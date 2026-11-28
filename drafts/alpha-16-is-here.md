---
title: Alpha.16 is here
summary: Anonymous functions, closures, explicit State and a more useful async standard library are now released, alongside the compiler and VM work that helped make them possible.
status: draft
previewOrder: 3
tags:
  - development
  - language design
  - standard library
---

Panackelty alpha.16 is released. The native packages, installer and browser playground are all updated, and the documentation is on the site.

I wrote about the standard library recently, but there was another part of the work I particularly wanted to get finished: making it straightforward to pass behaviour around and give that behaviour the context it needs.

An HTTP handler is a good example. It might need the time the service started, some configuration and a request counter. Those are fairly ordinary requirements, but they touch several parts of the language.

Alpha.16 brings those parts together.

## Functions where you need them

You can now write an anonymous function directly where you're passing it to another function. A short array transformation doesn't need a separate named declaration just to add a few lines of behaviour.

A function can also retain immutable values from the context where it was created. That's a closure. It means a handler can keep its configuration, or a function can return another function configured for a particular job.

For values that need to change across calls, there's explicit State. A closure can retain a handle to shared state, and the code says when it reads or updates the value. Implicitly capturing a mutable variable is rejected.

I like that distinction. Retaining a startup time and updating a counter are different things, and I want the code to make that difference visible.

## Useful operations from async code

The standard library has ordinary and async module paths. Choose `stdlib/time/async` and a clock read is `await time.now()`. The function hasn't acquired an `Async` suffix; the import selects the interface.

The work goes well beyond time. There are async APIs for the supported console, file, process and network operations, along with resource APIs such as SHA-256 and gzip. Pure operations still use ordinary calls.

The [standard-library article](/articles/a-more-useful-standard-library/) covers the reasoning, and the [reference](/reference/standard-library/) has the actual APIs. The [functions and State cookbook](/playbook/callables-and-state/) shows how the pieces fit together, including an HTTP service with a request count and uptime.

## The less visible work

Before making these language changes, I spent time on VM and compiler performance. I wanted the development loop to be less painful, especially when changing something that needs a compiler rebuild and verification.

That work is included in alpha.16 too. It reduces repeated work in the VM and compiler, and adds persistent incremental compilation. Separate invocations of `panack check --incremental` and `panack compile --incremental` can reuse valid cached work. The cache checks dependencies; it isn't permission to use stale results after changing the program.

I've already [written about the optimisation work](/articles/making-panackelty-easier-to-develop/), so I won't repeat the measurements here. The bytecode format remains v9, although you should still use the compiler, VM and standard library from the same release.

## Try it

The [playground](/playground/) now includes selectable examples for anonymous functions, closures and a shared counter. Each has expected output and a suggested change to try. Those examples run in your browser; HTTP services still need the native toolchain.

For native programs, start with [installation](/get-started/). If you're updating existing code, the [stdlib migration guide](/playbook/stdlib-migration/) covers the API changes. The [release page](/releases/) has the complete release notes and downloads.

There's still plenty I want to do, but this felt like a sensible release boundary. I want to use these features to build more real programs and let that experience drive the next work.
