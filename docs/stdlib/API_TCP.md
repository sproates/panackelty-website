# TCP

Exchange bytes or serve bounded and continuous TCP clients through async callbacks.

## Import

```panack
import stdlib/network/tcp/async as tcp
```
This module is async-only. Await every operation. It provides raw TCP, not HTTP framing, DNS, TLS or IPv6. Addresses use the supported numeric IPv4 form.

## exchange()

```panack
async exchange(address: Str, port: Nat, request: Bytes, response_limit: Nat, timeout: Duration): Result[Bytes,TcpError]
```

**Parameters**

- `address: Str` — numeric IPv4 destination.
- `port: Nat` — destination port.
- `request: Bytes` — bytes to send.
- `response_limit: Nat` — maximum received response bytes.
- `timeout: Duration` — positive deadline, no more than 60 seconds, in whole milliseconds.

**Returns:** `Result[Bytes,TcpError]`.

Sends one request and half-closes the write side so the peer sees request EOF, then receives the bounded response. Duration conversion never rounds.

**Errors:** Invalid address/configuration, connection failure, timeout, response limit and socket failures are reported.

## serve_bounded()

```panack
async serve_bounded(address: Str, port: Nat, handler: AsyncFn[Bytes,Result[Bytes,Str]], limits: TcpServerLimits): Result[[Result[Unit,TcpError]],TcpError]
```

**Parameters**

- `address: Str` — numeric IPv4 bind address.
- `port: Nat` — listening port.
- `handler: AsyncFn[Bytes,Result[Bytes,Str]]` — callback receiving one complete EOF-delimited request.
- `limits: TcpServerLimits` — admission, concurrency, byte and time limits.

**Returns:** `Result[[Result[Unit,TcpError]],TcpError]`.

Accepts a finite number of clients. Each sends one request terminated by a write-half close. The server calls the handler once, writes the returned bytes and closes the socket. Results retain client order. No framing bytes are added.

**Errors:** Outer errors describe setup; individual client failures are inner errors with `ClientFailure`. Handler-returned text cannot reliably be separated from native client failures.

## serve_stream()

```panack
async serve_stream[T](address: Str, port: Nat, worker: AsyncFn[T,Result[Bytes,Str]], context: T, limits: TcpServerLimits): Result[[Result[Unit,TcpError]],TcpError]
```

**Parameters**

- `address: Str` — bind address.
- `port: Nat` — listening port.
- `worker: AsyncFn[T,Result[Bytes,Str]]` — callback invoked as soon as a client is accepted.
- `context: T` — value passed to each worker.
- `limits: TcpServerLimits` — finite-server limits.

**Returns:** `Result[[Result[Unit,TcpError]],TcpError]`.

Starts the worker before receiving a complete request. The worker calls `read_chunk` to implement its own framing. This supports peers that wait for a response before half-closing.

**Errors:** Setup and ordered per-client failures follow `serve_bounded`.

## serve()

```panack
async serve[T](address: Str, port: Nat, worker: AsyncFn[T,Result[Bytes,Str]], context: T, limits: TcpServiceLimits, ready: AsyncFn[TcpServiceReady,Result[Unit,Str]]): Result[TcpServiceSummary,TcpError]
```

**Parameters**

- `address: Str` — bind address.
- `port: Nat` — listening port.
- `worker: AsyncFn[T,Result[Bytes,Str]]` — streaming worker.
- `context: T` — value supplied to workers.
- `limits: TcpServiceLimits` — concurrency, per-client bytes/deadline and drain.
- `ready: AsyncFn[TcpServiceReady,Result[Unit,Str]]` — readiness callback.

**Returns:** `Result[TcpServiceSummary,TcpError]`.

Runs a continuous service rather than stopping after a fixed admission count. Workers use `read_chunk`. The ready callback receives the bound address and port.

**Errors:** Service and callback failures use `ServiceOrCallbackFailure` because the existing runtime does not distinguish their provenance.

## read_chunk()

```panack
async read_chunk(limit: Nat): Result[Bytes,TcpError]
```

**Parameters**

- `limit: Nat` — maximum bytes in this read, from 1 through 16,384.

**Returns:** `Result[Bytes,TcpError]`.

Available only inside an active streaming worker. Returns available bytes up to the limit; empty bytes mean peer EOF. Cumulative request limits and client deadlines still apply. Calling it outside an active worker traps.

**Errors:** Read failures and exceeded per-client bounds return `TcpError`.

## Server limits and results

```panack
record TcpServerLimits {
  clients: Nat, concurrency: Nat, request_limit: Nat, response_limit: Nat,
  client_timeout: Duration, admission_timeout: Duration, drain: Duration
}
record TcpServiceLimits {
  concurrency: Nat, request_limit: Nat, response_limit: Nat,
  client_timeout: Duration, drain: Duration
}
```

- `clients`: 1–256 total admissions for a finite server.
- `concurrency`: 1–32 simultaneous clients, no greater than `clients` for a finite server.
- `request_limit` and `response_limit`: 0–1,048,576 bytes per client.
- `client_timeout`: acceptance through response completion.
- `admission_timeout`: finite-server admission deadline from successful listen.
- `drain`: time allowed after admission stops.

All durations must be whole milliseconds and no more than 60 seconds. Client/admission deadlines must be positive; drain may be zero.

```panack
record TcpServiceReady { address: Str, port: Nat }
record TcpServiceSummary { accepted: Nat, succeeded: Nat, failed: Nat }
```

The summary counts accepted, successful and failed clients.

## TcpError

```panack
record TcpError { operation: TcpOperation, kind: TcpErrorKind, native: Str }
```

`native` is the preserved runtime/callback text. No errno is invented and no request or response contents are retained. Use `problem.kind` for control flow and `problem.render()` for a human-readable explanation. The `native` field preserves the original failure. Host-backed native errors contain `operation: Str`, `code: Str` and `native_code: Nat`; a zero native number means no host error number was supplied.

```panack
enum TcpErrorKind { InvalidArguments, InvalidAddress, TimedOut, ConnectFailed, SocketFailed, BindFailed, ListenFailed, AcceptFailed, ReadFailed, WriteFailed, ShutdownFailed, PeerClosed, ResponseLimitExceeded, RequestLimitExceeded, ClockFailed, PollFailed, Unavailable, InvalidDuration, ClientFailure, ServiceOrCallbackFailure, OtherFailure }
```


## Higher-level service example

[The HTTP uptime service](/playbook/async-stdlib/#complete-example-http-uptime-service) uses the HTTP package built on this transport.

