---
title: A more useful standard library
summary: Panackelty's standard library now has ordinary and async imports, more consistent APIs, proper error information and documentation you can actually read on the site.
status: draft
tags:
  - development
  - language design
  - standard library
---

I've finished a fairly substantial round of work on Panackelty's standard library. This is part of alpha.16, so it isn't in the current release yet, but the implementation is on the development branch and the new documentation is now on the site.

The motivation was quite simple. If I want to write an HTTP endpoint that reports how long the service has been running, the handler needs to read a clock. That shouldn't be an architectural event.

Previously, an async handler couldn't call the ordinary clock API. Panackelty distinguishes pure functions, ordinary effectful functions and async functions, and an async function can't just call an arbitrary effectful function. I want to keep that distinction. But I also want async functions to be able to do useful things.

## Choose the import, keep the names

This was the bit of the design I liked immediately. An ordinary function uses:

```panack
import stdlib/time as time
```

An async function uses:

```panack
import stdlib/time/async as time
```

The function is still called `time.now()`. In async code, it's `await time.now()`.

I really don't want a library full of names like `nowAsync`, `readFileSync` and their various counterparts. Choosing the module makes the distinction clear without making every function name carry it around too.

Here's a small, complete async function using the new time API:

```panack
import stdlib/time/async as time

async pause_briefly(): Result[Unit,time.SleepError] {
  await time.sleep(time.milliseconds(10))
}
```

Constructing a duration is pure, so `time.milliseconds(10)` is an ordinary call even under the async import. Waiting is effectful, so that part uses `await`.

And waiting really does suspend the current task, allowing other tasks to run. Reading the clock is different: it can complete immediately. An async API doesn't mean every operation needs a worker thread or an artificial delay. It means the operation fits properly into async code.

The ordinary and async modules also share their value and error types. A duration doesn't become a different kind of duration because I changed an import.

## It needed to go further than the clock

Once I'd settled on this approach, fixing time alone would have left the same problem waiting in the next package.

The work covers console input and output, files, processes, TCP and HTTP streams, as well as clocks and timers. It also includes async access to the resource APIs for SHA-256 and gzip. Pure operations, such as working with paths or constructing values, remain ordinary calls.

I've also reviewed names and organisation across the library. There are canonical APIs and a migration guide, with compatibility names documented where they're retained. I want someone using one part of the stdlib to have a reasonable chance of understanding another part without having to rediscover all the conventions.

Some of the less visible work matters a lot here. What happens if a read reaches its size limit? What happens if an async task is cancelled while it owns a resource? Who closes a stream? What information survives when the underlying system reports an error?

Adding `async` to a signature doesn't answer any of those questions.

## Errors are part of the API

I've been fairly insistent about diagnostics throughout Panackelty, and the stdlib needs the same care.

Operations that can fail return results with error information the program can inspect. Domain errors let the caller distinguish relevant failure cases, while `render()` provides an explanation for a human. Host-backed errors retain native details where they're available, rather than throwing those details away and leaving the caller with something like “operation failed”.

That matters for HTTP in particular. If a request fails, I want enough information to investigate the failure. I don't want the useful details to have disappeared somewhere between the transport and my program.

The documentation also spells out bounds and cleanup responsibilities. Those are part of using an API correctly, so they belong next to the function you're looking up.

## The docs needed doing too

My first reaction to the website documentation was that it mostly sent you to GitHub for the actual detail. That's not what I want from an API reference.

There are now nineteen module reference pages covering 72 function entries, with signatures, parameters, return values, errors and examples. The standard library comes before HTTP on the API page because it's more fundamental. There are also guides for async code, input and file publication, resource handling and migration.

You can read the [time reference](/reference/stdlib-time/) to see the format, or start from the [standard library overview](/reference/standard-library/). The [async stdlib guide](/playbook/async-stdlib/) includes a complete HTTP uptime example, so the original motivating case is there as an actual program.

## What comes after this

Anonymous functions, closures and explicit state management are still ahead. I wrote about that direction in [Async stdlib functions, closures, state...](/articles/async-functions-closures-and-state/).

Those features will make it easier to express things like request handlers with shared state. This stdlib work gives those handlers useful operations to call. I'm looking forward to putting the pieces together, but being able to read a clock, work with files and run a process from async code is already a useful step.
