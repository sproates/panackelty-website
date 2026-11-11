---
title: Async stdlib functions, closures, state...
status: published
date: 2026-11-11
tags:
  - development
  - language design
  - standard library
---

I want building useful programs in Panackelty to feel straightforward. An HTTP handler should be able to read the clock, access a file or update a request counter without the programmer having to work around the language.

The next work brings together a broader async standard library, anonymous functions, closures and explicit state management. Each is useful independently, but the combination is what interests me most.

## Reviewing the standard library

I'm changing the standard library, including its function names, organisation and documentation. Some functions may be renamed as part of making the API more consistent.

The main change is to provide async versions of functions where appropriate. That includes capabilities such as filesystem access, running processes and reading the clock. Pure operations, such as constructing a duration or manipulating a string, don't need an async equivalent.

I want choosing the async interface to be simple. Rather than adding suffixes to individual function names, the import selects the version:

```panackelty
import stdlib/time as time

started = time.now()
```

For async code:

```panackelty
import stdlib/time/async as time

started = await time.now()
```

The operation is still called `now`. The module path tells the reader which interface is being used, and `await` makes the async call visible where it happens.

In this example, `now()` reads a monotonic clock for measuring elapsed time. It returns a result containing either an instant or a clock error. It isn't a calendar date or a promise that clock reads can never fail.

Async also doesn't mean every operation has to wait. Reading the clock can complete immediately. Waiting for a timer or a subprocess should allow other tasks to continue. The interface needs to fit async code without hiding blocking work inside an async function.

The documentation will cover the ordinary and async interfaces together, with practical examples for time, processes and I/O as well as HTTP.

## Anonymous functions

Panackelty will support anonymous functions, so a small operation can be written where it's used rather than requiring a separate named function.

For example, an increment operation can be expressed as:

```text
(current: Nat) => current + 1
```

The examples from this point show the intended API shape rather than code available in the current release.

An anonymous function is particularly useful when passing behaviour to another function: transforming a value, updating state or registering a request handler. Named functions will still make sense for larger operations and behaviour used in several places. I want both options available.

## Closures

Closures let a function retain values from the context in which it was created. A request handler could retain a service name or the instant when the service started, without having to receive those values as explicit parameters on every call.

For an uptime endpoint, the handler needs a startup instant and a fresh clock reading for each request. The startup instant doesn't change. Capturing it gives the handler the context it needs, while the async time API supplies the later reading.

That is already useful without any shared mutation. Closures aren't just a way to hide mutable variables inside functions.

## Making shared state visible

A request counter introduces a different requirement. Every invocation needs to update the same count.

One familiar approach is to capture a mutable variable:

```text
mut count = 0

handler = () => {
  count = count + 1
  count
}
```

It's compact, but understanding it requires knowing where `count` was declared and how capture works. Is this the same variable across calls, or a value copied when the function was created? What happens when requests overlap?

I want an explicit state API that makes shared updates visible:

```text
count = state.create[Nat](0)

handler = async () => {
  total = await count.update((current: Nat) => current + 1)
  total
}
```

Here the closure captures a handle to shared state. The binding `count` stays the same; the value managed through that handle changes. Seeing `count.update(...)` tells the reader that this operation updates state outside the individual invocation.

The update will read, transform and replace the value as one indivisible operation relative to other tasks. The transformation itself will be pure and won't suspend. That avoids two requests reading the same count and both writing back the same incremented value.

This doesn't make every sequence of state operations atomic. Reading a value, awaiting other work and then writing a replacement is a different operation, with different risks. The API should make the safe, common case easy to express without pretending those risks disappear.

Explicit state and closures work together. A closure carries the state handle to the code that needs it; the state API controls how the contents are accessed and updated. Local mutable variables still have their place for work confined to a single invocation.

## Putting it together

A status endpoint can report both its request count and the service's current uptime. The startup code reads the clock once, then registers a handler that captures that instant alongside the shared counter:

```text
import stdlib/time/async as time

requests = state.create[Nat](0)

match await time.now() {
  Error(problem) => {
    // Report the clock error and stop startup.
  },
  Ok(started) => {
    server.get("/status", async (request: Request) => {
      total = await requests.update((current: Nat) => current + 1)

      match await time.now() {
        Error(problem) => {
          response.status(503)
          response.text("Uptime is unavailable: the clock could not be read.")
        },
        Ok(now) => {
          elapsed = now.difference(started)
          uptime_seconds = elapsed.ticks() / 1000000000
          response.text("Requests handled: ${total}; uptime: ${uptime_seconds} seconds")
        }
      }
    })
  }
}
```

The outer anonymous function is the request handler. Its closure retains both `started`, an immutable instant, and `requests`, a handle to shared state. The inner anonymous function describes the counter update. Each request gets a fresh clock reading through `await time.now()`, and subtracting the startup instant gives the elapsed duration.

This counts requests to `/status` during that server instance's lifetime, including requests where the clock read fails. Uptime is measured from the startup clock reading. The response includes both values when the clock is available, or an explanation with an HTTP 503 response when it isn't.

A handler could also capture configuration or read a file through the async filesystem module. Those capabilities should compose naturally, with the compiler continuing to enforce the distinction between pure computation and effects.

That's the developer experience I'm working towards: useful operations expressed close to where they're needed, with enough information in the code to understand what is shared, what changes and where async work happens.

## Documentation

Once these changes are implemented, I'll document them on this site. That will include the standard-library APIs, how to use anonymous functions and closures, and how to manage shared state, with practical examples showing how they work together.
