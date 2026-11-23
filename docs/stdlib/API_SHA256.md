# SHA-256

Hash a bounded byte value or incrementally hash larger input with an owned context.

## Import

```panack
import stdlib/digest/sha256 as sha256
```
For an async function, select the async module instead:

```panack
import stdlib/digest/sha256/async as sha256
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## hash()

```panack
pure hash(data: Bytes): Bytes
```

**Parameters**

- `data: Bytes` — at most 16 MiB.

**Returns:** `Bytes`, the 32-byte SHA-256 digest.

Pure and synchronous, including when imported through `/async`. It does not yield. Use a context for larger inputs or smaller cooperative work steps.

**Errors:** Oversized input traps rather than returning a `Result`. Unsupported hosts also report a VM error for this pure operation.

## create()

```panack
create(): Result[Sha256Context,Sha256Error]
```

**Parameters**

None.

**Returns:** `Result[Sha256Context,Sha256Error]`.

Creates a new context owned by the invocation. At most 65,536 contexts may be created per invocation.

**Errors:** Initialization, resource-limit and unsupported-host failures are reported.

## update()

```panack
update(context: Sha256Context, data: Bytes): Result[Unit,Sha256Error]
```

**Parameters**

- `context: Sha256Context` — live context.
- `data: Bytes` — next chunk, at most 65,536 bytes.

**Returns:** `Result[Unit,Sha256Error]`.

Appends bytes to the running digest. The async form performs one bounded atomic step, then yields. Oversized chunks are rejected before mutation and can be retried in smaller pieces.

**Errors:** Invalid context, oversized chunk and digest failure are distinct. A digest-library failure invalidates the context.

## finish()

```panack
finish(context: Sha256Context): Result[Bytes,Sha256Error]
```

**Parameters**

- `context: Sha256Context` — live context.

**Returns:** `Result[Bytes,Sha256Error]`, the 32-byte digest.

Finalises and consumes the context, including when finalisation fails. Do not call close after successful finish or reuse an alias.

**Errors:** Invalid context and finalisation failure are reported.

## close()

```panack
close(context: Sha256Context): Result[Unit,Sha256Error]
```

**Parameters**

- `context: Sha256Context` — live unfinished context.

**Returns:** `Result[Unit,Sha256Error]`.

Releases the context without producing a digest and invalidates all aliases. Use this when abandoning a calculation.

**Errors:** A consumed, closed or foreign context is invalid.

## Ownership and cancellation

Contexts cannot cross invocation boundaries. Async operations yield after a bounded native mutation, not halfway through it. Cancellation before that step makes no change; cancellation afterwards does not roll it back. Task/VM teardown closes owned resources. A failure to allocate an acknowledgement after mutation closes the context rather than leaving an uncertain reusable state.

## Sha256Error

```panack
record Sha256Error { operation: Sha256Operation, kind: Sha256ErrorKind, native: HostError }
```

`operation` identifies creation, update (with byte count), finish or close. Input contents and handles are not retained. Use `problem.kind` for control flow and `problem.render()` for a human-readable explanation. The `native` field preserves the original failure. Host-backed native errors contain `operation: Str`, `code: Str` and `native_code: Nat`; a zero native number means no host error number was supplied.

```panack
enum Sha256ErrorKind {
  InvalidContext, ChunkTooLarge, InvalidArgument, InitializationFailed,
  DigestFailed, ResourceLimit, UnsupportedHost, OtherFailure
}
```


## Example

[Hash multiple chunks with cleanup](/playbook/async-resources/#complete-example-async-digest).

