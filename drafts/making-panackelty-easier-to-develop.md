---
title: Making Panackelty easier to develop
summary: Before working on async standard-library APIs, closures and state, I spent some time making the VM and compiler faster. The aim was to make the next language changes less painful to build and verify.
status: draft
tags:
  - development
  - compiler
  - performance
---

If I wanted to write a small HTTP service with a healthcheck endpoint that reported its uptime, that would seem a reasonable thing to do in Panackelty. It already has an HTTP server.

But with the current API, it wouldn't work. The clock API is available, but an async handler wouldn't be able to call it. An endpoint that counted how many requests the server had handled would raise a different question: how should handlers share and update application state?

These are exactly the sorts of problems I want to find by building real programs. They're also the reason I want to improve async access to the standard library and work through support for anonymous functions, closures and explicit state.

But before making those changes, I wanted to make developing Panackelty itself less painful.

## The cost of trying something

Panackelty is self-hosted. Its compiler is written in Panackelty and runs on the Panackelty VM. That means the speed of the VM affects how quickly I can build the compiler, and the speed of the compiler affects how quickly I can prepare programs and tests.

A language change involves a lot of repetition. Change the implementation, compile it, try a small program, inspect the result, correct something, and try again. Eventually there are broader checks too: existing programs must still behave correctly, the compiler must still compile itself, and the packaged toolchain must still work.

Slow feedback makes every part of that more expensive. It also makes it harder to stay interested in the problem you're actually trying to solve. By the time a check finishes, you've either been sitting waiting or you've moved on to something else.

## Start with what the machine is actually doing

I started by profiling the VM while it compiled Panackelty code. One early opportunity was function lookup.

The bytecode identifies functions by name. The VM was repeatedly resolving those names while executing calls, even though successful verification already provided enough information to identify the target. The optimisation retains that target after verification, so subsequent direct calls don't have to repeat the lookup.

The names are still there for diagnostics. The bytecode format didn't need to change, and the runtime checks weren't removed.

There were other opportunities in local-variable lookup, string handling, collections and allocation. Some values could be reused instead of repeatedly allocating equivalent objects. Some information could be calculated once and retained. Each trial needed its own measurements and correctness checks; a plausible idea wasn't enough to adopt it.

Because the compiler runs on the VM, these improvements helped the compiler too. They also benefit other programs doing the affected kinds of work, although the size of that benefit depends on the program.

## Then stop repeating compilation work

Making the VM faster helps when the compiler has work to do. There was also work the compiler didn't need to do again at all.

The interface I wanted was straightforward:

```sh
panack compile --incremental main.panack -o main.bc
```

Run the command, let Panack work out what can be reused, and get the result. I didn't want to have to keep a watch process running just to benefit from an earlier compilation.

The cache checks source and toolchain contents rather than trusting file modification times. If nothing relevant has changed, it can reuse the complete compiled result. If a source file has changed, it can retain work for modules that are still valid under the dependency rules.

That second case turned out to be more interesting than simply saving the compiler's internal data structures.

An early implementation avoided checking unchanged function bodies again, but spent a lot of time decoding the saved checked bodies. That removed some work and introduced another substantial cost in its place.

The later approach retains compiled functions together with the information needed to check their effects against the current program. It can reuse those functions without reconstructing their complete checked-body trees. Signatures and effect checks still run, and changes invalidate the affected modules and their consumers.

The latest step also retains declaration summaries for unchanged source files. These preserve the declarations, positions and other information the loader needs without parsing every function body again. If a compiled function can't be reused, the compiler restores the complete source representation before checking it. A missing body is explicitly marked as missing; it must never be mistaken for an empty function.

There is quite a lot of care behind a command that looks simple.

## What difference did it make?

Two local comparisons give a useful sense of the gains:

- **Unchanged incremental compiler builds:** avoiding parsing before a complete cache hit reduced the measured time from 2.48 seconds to 0.044 seconds.
- **Edited incremental compiler builds:** declaration-summary reuse reduced the median from 7.91 seconds to 5.61 seconds.

These are separate experiments at different points in development. They aren't a cumulative before-and-after benchmark, and the percentages shouldn't be added together. The edited-build figures are medians from three paired measurements. The generated bytecode matched fresh compilation.

There are costs too. In the latest cold-build comparison, creating the summaries increased the first incremental build from 13.20 seconds to 15.09 seconds. Subsequent edits are where that investment pays back. An application built once on a fresh machine has different needs from a compiler being edited repeatedly throughout the day.

The full local validation for the latest slice still took about nine and a half minutes. Making one compilation faster doesn't make every part of validation disappear. There are runtime tests, process and network tests, bootstrap checks, packaging and installation checks as well.

## There is more to do

Ordinary CI isn't yet retaining these incremental compiler caches between runs. A hosted trial successfully reused the cache between jobs, but adopting it in the regular pipelines is separate work. The cache has to be useful for the jobs that actually run, and restoring it has a cost of its own.

There are also more compiler and VM opportunities. Incremental reuse is still conservative, and it works at module granularity rather than avoiding every possible piece of repeated work inside an edited module. Bootstrap proofs deliberately continue to compile afresh.

It would be very easy to keep going. Every improvement makes the next experiment a little more tempting.

But I started this because I wanted to make language development easier. At some point I need to use the faster tools to develop the language.

## Back to useful programs

The immediate next step is the async clock API and the uptime example. Reading the clock isn't pure, but it can fit into the async model without pretending that it is. My preferred direction is to select the async API through the module import, while keeping the operation names familiar.

The counter brings me back to application state. I'm leaning towards supporting anonymous functions, closures and explicit state as independently useful options, but the details still need to be worked through. In particular, I want it to be clear when a function uses state from outside its own body and how that state can change.

Those features haven't been delivered by this optimisation work, and the design isn't finished. I now have a better starting point for implementing and testing them.

I'd quite like that small uptime endpoint to work now.

The measurement details are in the [compiler optimisation record](https://github.com/sproates/panackelty/blob/next/docs/COMPILER_EDIT_PROFILE.md) and the [VM direct-call trial](https://github.com/sproates/panackelty/blob/next/docs/VM_CALL_LOOKUP_TRIAL.md).
