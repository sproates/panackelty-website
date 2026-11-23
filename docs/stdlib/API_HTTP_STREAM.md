# Raw HTTP streams

Send raw HTTP request bytes and read a bounded response stream. Parsing and framing belong to the HTTP package.

## Import

```panack
import stdlib/network/http_stream as transport
```
For an async function, select the async module instead:

```panack
import stdlib/network/http_stream/async as transport
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## open()

```panack
open(host: Str, port: Nat, tls: Bool, request: Bytes, response_limit: Nat, timeout: Duration): Result[HttpStream,HttpStreamError]
```

**Parameters**

- `host: Str` — destination hostname.
- `port: Nat` — destination port.
- `tls: Bool` — whether to use TLS.
- `request: Bytes` — complete request bytes, at most 65,536 bytes.
- `response_limit: Nat` — total raw-response bound, at most 256 MiB.
- `timeout: Duration` — positive overall deadline, at most 60 seconds.

**Returns:** `Result[HttpStream,HttpStreamError]`.

Allocates a transport; it does not confirm a connection or response. Reads drive DNS, connection, request transmission and response receipt. The deadline starts at open and includes time between reads. At most 512 opens are allowed per invocation; slots are not reused.

**Errors:** Invalid configuration, allocation and transport setup failures are reported. Network failures may appear on read.

## read()

```panack
read(stream: HttpStream): Result[Bytes,HttpStreamError]
```

**Parameters**

- `stream: HttpStream` — live stream with no overlapping read.

**Returns:** `Result[Bytes,HttpStreamError]`, up to 16,384 bytes.

Empty bytes mean EOF, repeatable until close. Ordinary reads block; async reads yield through transport polling without occupying an I/O worker. Cancelling a pending read consumes the stream, even if bytes arrived before cancellation. Cancellation cannot undo a request already sent.

**Errors:** DNS, TLS verification, connection, timeout, response-limit and read failures retain transport detail. Overlapping reads return `ReadBusy`; closed/foreign handles return `InvalidStream`.

## close()

```panack
close(stream: HttpStream): Result[Unit,HttpStreamError]
```

**Parameters**

- `stream: HttpStream` — live stream with no read in progress.

**Returns:** `Result[Unit,HttpStreamError]`.

Closes the transport and invalidates every alias. Explicit close releases it early; invocation teardown provides final cleanup.

**Errors:** A pending read prevents close (`ReadBusy`). Closed or foreign handles are invalid.

## HttpStreamError

```panack
record HttpStreamError { operation: HttpStreamOperation, kind: HttpStreamErrorKind, native: Str }
```

Here `native` is the original transport text, not a `HostError`. Available libcurl and TLS detail is preserved; request bytes are not retained. Use `problem.kind` for control flow and `problem.render()` for a human-readable explanation. The `native` field preserves the original failure. Host-backed native errors contain `operation: Str`, `code: Str` and `native_code: Nat`; a zero native number means no host error number was supplied.

```panack
enum HttpStreamErrorKind {
  InvalidArguments, TimedOut, NameResolutionFailed, TlsVerificationFailed, TlsFailed, ConnectionFailed, WriteFailed, ReadFailed, ResponseLimitExceeded, InvalidStream, ReadBusy, ResourceLimit, Unavailable, ResolverUnavailable, ClockFailed, InitializationFailed, PollingFailed, InvocationEnded, OtherFailure
}
```


## Use the HTTP package for URLs

Most applications should use `http/client/async`, not construct raw HTTP bytes. [The diagnostic client example](/playbook/async-stdlib/#complete-example-diagnostic-http-client) shows URL requests, status handling and detailed errors. Browser/WASI hosts do not provide this native transport.

