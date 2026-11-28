---
title: What's in alpha.16?
summary: Panackelty alpha.16 adds anonymous functions, closures and shared State, expands what async code can do, and brings faster compiler and VM tools.
status: draft
previewOrder: 4
tags:
  - development
  - language design
  - standard library
---

Panackelty alpha.16 is released. A lot of the work came from a fairly ordinary requirement: I want to write an HTTP handler that knows when the service started and keeps a count of requests. Reading the clock and updating a counter shouldn't require working around the language.

That led to changes across the standard library, functions and shared state. Here's what's in the release, before I get into the details in the articles that follow.

## Functions and shared state

- **Anonymous functions** let you write a small function directly where it's used. Transforming an array or registering a handler doesn't always need a separate named function declaration.
- **Closures** let a function retain values from where it was created, even after the code that created it has finished. A handler can keep its configuration, for example, without receiving it again on every call.
- **Shared State** gives several calls access to the same changing value, with explicit operations to read it or update it. A request counter is one use. Closures retain immutable bindings; shared changes go through State rather than an implicitly captured mutable variable.

These features work together, but they're useful independently too. You can pass State explicitly to a named function, or use a closure simply to retain some configuration that never changes.

## A standard library that fits async code

Async functions can now use more of the standard library, including clocks, console I/O, files, processes and networking. Choosing an async module gives you the appropriate interface while keeping the function names familiar.

The library also has more consistent APIs, structured errors and documentation you can read directly on the site. I've already covered that work in [A more useful standard library](/articles/a-more-useful-standard-library/), and the [API reference](/reference/standard-library/) has the individual functions.

## Faster tools

Alpha.16 includes the VM and compiler optimisations I've been working on, reducing repeated work when compiling and running programs. There is also optional incremental checking and compilation, so separate commands can reuse valid cached work instead of starting from scratch each time.

I did much of this work before the language changes because I wanted building and verifying those changes to be less painful. The [optimisation article](/articles/making-panackelty-easier-to-develop/) has the measurements and background.

## Try it

The [playground](/playground/) now has selectable examples for anonymous functions, closures and a shared counter. Each includes expected output and a suggested edit. HTTP services need the [native toolchain](/get-started/); the browser playground doesn't provide networking.

For the full change list and downloads, see the [release page](/releases/). If you're updating existing code, check the [stdlib migration guide](/playbook/stdlib-migration/) for API changes.

I'll follow this overview with a closer look at closures, a separate article on the new State system, and a walkthrough of an HTTP service that puts them together.
