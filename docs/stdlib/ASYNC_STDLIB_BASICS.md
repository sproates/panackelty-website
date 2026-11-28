# Async stdlib in practice

These examples use the **native alpha.16 toolchain**. Install the release to run
them; their host I/O is unavailable in the browser playground. The full source
is included below each recipe.

## Choose the effect at the import

```panack
import stdlib/time/async as time
```

Read the clock with `await time.now()`. Use pure helpers such as `time.seconds(5)`
without await. An ordinary caller instead imports `stdlib/time as time` and calls
`time.now()` directly. The function names stay the same.

Async operations allow the calling task to suspend. They do not make impure work
pure and do not mean that every operation starts a new thread.

## Measure elapsed time

[The timing example](../../examples/async_timing.panack) reads a monotonic clock,
awaits a short timer and reads again. It reports whether the clock stayed
monotonic; actual timings vary, so its output does not claim a precise delay.

```sh
./bin/panack run examples/async_timing.panack
```

```text
Clock did not move backwards: true
```

`now.difference(start)` returns a Duration. The clock is for elapsed time, not
calendar dates, and equal consecutive readings are allowed.

## Write and read a temporary note

[The temporary-note example](../../examples/async_temporary_note.panack) creates
a unique file, writes a note, reads it with a byte limit, checks UTF-8 and attempts
cleanup on success or failure. It needs a writable current directory.

```sh
./bin/panack run examples/async_temporary_note.panack
```

```text
remember the milk
```

Filesystem errors explain the failed operation. If cleanup also fails, preserve
both explanations rather than losing the original failure.

## Run a bounded subprocess

[The subprocess example](../../examples/async_pipe_input.panack) invokes
`/bin/cat` with explicit input, an exact empty environment, a five-second timeout
and a 64-byte output limit. It requires a POSIX host with that executable.

```sh
./bin/panack run examples/async_pipe_input.panack
```

```text
hello λ
```

A completed process can return a nonzero status or be terminated by a signal.
Check `output.termination`, not just the outer `Result`. Decode captured bytes
with the checked UTF-8 API.

## Return uptime from an HTTP handler

[The uptime service](../../examples/network/http_uptime/src/main.panack) stores
its start Instant and service name in an immutable context. Each `/health`
request awaits a new clock reading. No closure or mutable global is needed.

```sh
./bin/panack run --project examples/network/http_uptime/panack.json 8082
```

Open `http://127.0.0.1:8082/health` on the same machine. The response contains
`uptime_ns=` followed by elapsed nanoseconds. A clock failure returns HTTP 503
with an explanation. Nanosecond representation does not imply nanosecond accuracy.
The service binds to loopback; Ctrl-C stops it.

## Keep HTTP failures useful

[The diagnostic client](../../examples/network/http_diagnostic_client/src/main.panack)
imports `http/client/async`. It applies explicit bounds and prints either the
HTTP status/body size or the rendered error with available transport detail.

```sh
./bin/panack run --project examples/network/http_diagnostic_client/panack.json https://example.com/
```

This command needs network access. A valid HTTP 404 is a received response;
this example prints its status and exits unsuccessfully as an application policy.
A URL, DNS, connection, TLS or framing failure is an error result. Certificates
and hostnames remain verified. The error preserves details rather than guessing
a cause; use typed categories for program decisions instead of parsing prose.

See the [stdlib reference](../reference/STANDARD_LIBRARY.md),
[migration guide](STDLIB_MIGRATION.md), [resource guide](ASYNC_RESOURCES.md) and
[input/publication guide](ASYNC_INPUT_AND_FILES.md) for the rest of the API.
