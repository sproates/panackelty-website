---
title: What's in alpha.16?
summary: A quick overview of the new functions, shared State, standard-library changes and faster tools in Panackelty alpha.16.
status: draft
previewOrder: 4
tags:
  - development
  - language design
  - standard library
---

Panackelty alpha.16 is released. This one brings together quite a lot of work on making the language more useful and expressive, along with improvements to the tools used to build programs.

Here's the basic overview. I'll go into the features properly in the articles that follow.

## What's new?

- **Anonymous functions.** Write a small function where you need it, for example when transforming a collection or registering a request handler.
- **Closures.** Functions can retain immutable values from the context where they were created. A callback can keep the configuration it needs without receiving it on every call.
- **Explicit shared State.** Several calls can share a changing value, such as a request counter, through an API that makes reads and updates visible.
- **A more useful standard library.** Ordinary and async module imports provide consistent ways to work with clocks, files, processes, console I/O and networking, with structured errors and expanded documentation.
- **Faster compiler and VM, plus incremental compilation.** Less repeated work during execution and compilation, with an optional persistent cache for subsequent checks and builds.

The combination is what interests me most. An HTTP handler can now retain its startup time, read the clock and update a shared counter. Each feature is useful on its own, but together they make that sort of program much more straightforward to write.

## Give it a go

The [browser playground](/playground/) has examples for anonymous functions, closures and State, with expected output and suggested edits. For HTTP services and other native capabilities, use the [native installation](/get-started/).

The [release page](/releases/) has the full change list and downloads. If you're updating existing code, the [stdlib migration guide](/playbook/stdlib-migration/) covers the API changes.

Next I'll look more closely at closures, explain the new State system, and put them together in a working HTTP service.
