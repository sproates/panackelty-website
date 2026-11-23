# Gzip decoding

Decode gzip incrementally with checked trailers, bounded work and an explicit total output budget.

## Import

```panack
import stdlib/compression/gzip as gzip
```
For an async function, select the async module instead:

```panack
import stdlib/compression/gzip/async as gzip
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## create_decoder()

```panack
create_decoder(output_limit: Nat): Result[GzipDecoder,GzipError]
```

**Parameters**

- `output_limit: Nat` — total decoded-byte budget, from zero through 256 MiB.

**Returns:** `Result[GzipDecoder,GzipError]`.

Creates an invocation-owned decoder. A zero budget can decode an empty member. At most 64 decoder slots may be allocated per invocation; slots are not reused.

**Errors:** `UnsupportedOutputLimit`, decoder unavailability, resource limits and unsupported-host errors are reported.

## decode_chunk()

```panack
decode_chunk(decoder: GzipDecoder, data: Bytes, finish: Bool): Result[GzipChunk,GzipError]
```

**Parameters**

- `decoder: GzipDecoder` — live decoder.
- `data: Bytes` — at most 65,536 compressed bytes, including any unconsumed bytes from the preceding step.
- `finish: Bool` — true when no further input will follow.

**Returns:** `Result[GzipChunk,GzipError]`.

Each step consumes part or all of the input and produces at most 65,536 output bytes. Advance only by `consumed`; preserve the remaining bytes for the next call. Checks concatenated gzip members and trailers. Successful final input stops further decoding but does not close the handle. The async form performs one bounded native step, then yields.

**Errors:** An oversized chunk is rejected before mutation. Invalid gzip, truncated final input or an exhausted total budget stops decoding; close the decoder afterwards. `DecoderStopped` rejects further decoding after completion/failure.

## close()

```panack
close(decoder: GzipDecoder): Result[Unit,GzipError]
```

**Parameters**

- `decoder: GzipDecoder` — owned decoder, including a finished or failed decoder.

**Returns:** `Result[Unit,GzipError]`.

Releases the decoder and invalidates every alias. Completion alone is not cleanup.

**Errors:** Closed or foreign handles return `InvalidDecoder`.

## GzipChunk

```panack
record GzipChunk { consumed: Nat, data: Bytes, finished: Bool }
```

- `consumed` is the number of bytes consumed from this call’s input.
- `data` is this step’s decoded output.
- `finished` tells the caller that decoding has finished.

Never assume all supplied input was consumed or concatenate output without enforcing your application’s memory budget.

## Cancellation

Copies alias one decoder. Cancellation before a native step makes no mutation; cancellation after it does not undo decoding. Task/VM teardown closes resources. An allocation failure after mutation closes the resource so it cannot be reused in an uncertain state.

## GzipError

```panack
record GzipError { operation: GzipOperation, kind: GzipErrorKind, native: HostError }
```

`operation` records creation with its output limit, a decode call with input byte count/final-input flag, or close. Use `problem.kind` for control flow and `problem.render()` for a human-readable explanation. The `native` field preserves the original failure. Host-backed native errors contain `operation: Str`, `code: Str` and `native_code: Nat`; a zero native number means no host error number was supplied.

```panack
enum GzipErrorKind {
  InvalidDecoder, ChunkTooLarge, UnsupportedOutputLimit, OutputLimitExceeded,
  DecoderStopped, DecodeFailed, IncompleteInput, DecoderUnavailable,
  InvalidArgument, ResourceLimit, UnsupportedHost, OtherFailure
}
```


## Example

[Decode the complete gzip example](/playbook/async-resources/#complete-example-async-gzip), including unconsumed input and explicit close.

