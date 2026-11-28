# Functions and State cookbook

These complete programs combine [anonymous functions](/playbook/anonymous-functions/),
[closures](/playbook/closures/) and [State](/playbook/state/). Start with those
pages if the concepts are new to you. These examples require alpha.16. The
standalone counter also runs in the matching browser playground; the HTTP
services require the native toolchain.

## Keep a counter between calls

The [standalone counter](../../examples/state/counter.panack) creates one cell,
then stores a closure named `next` that retains its handle. Calling `next`
updates that same cell each time. The pure `increment` callback receives the
current count and returns its replacement.

The program prints `1`, `2`, then `2`: two increments followed by a read.
The callback expresses the calculation; the State operation makes the shared
change explicit.

## Combine state and an async HTTP handler

The [closure example](../../examples/network/http_state_closure/src/main.panack) keeps
its start instant and request counter in an anonymous handler. The
[contextual example](../../examples/network/http_state_contextual/src/main.panack)
uses a named handler and passes the same values through an explicit context.
Neither style is required by State; choose the one that makes your code clearest.

Both examples count committed increments for `/status` and report monotonic
uptime. An unrecognised route does not increment the count. A request rejected
before entering the handler is not counted either.

The handler increments before reading the clock. If that clock read fails, the
response is HTTP 503 and includes the committed count. Failure to read the clock
at startup prints an explanation and exits instead of starting an unusable service.

Cancellation or a trap before commit preserves the old cell value. Cancellation
or response failure after commit does not undo it. A cancelled waiter never runs
the callback. These rules define what the counter measures; it is not a count of
successfully delivered responses. Restarting the server resets the count.

## Keep external work outside an update

An update callback cannot read the clock, perform I/O, await work or create, read or update
a cell. Do that work before or after the update. If the update needs a value
obtained asynchronously, await it first and pass the resulting immutable data
into the callback. There are no callback retries, public locks or multi-cell
transactions in this API.
