---
title: How the Panackelty browser playground works
status: draft
tags:
  - playground
  - compiler
  - tooling
---

The Panackelty playground lets you try real programs without installing the
native toolchain. Your code is compiled and run in your browser; the page
doesn't send your source to a server.

Behind the editor, the browser runs Panackelty's compiler and virtual machine.
The browser edition gives programs a smaller set of host features than the
native toolchain.

## A real compiler, running in your browser

When you press **Run program**, the page starts a worker. Because it runs
separately from the page's interface, the editor can remain responsive while
compilation happens. The worker loads the WebAssembly VM, compiler and standard
library selected for this browser edition.

The compiler is itself a Panackelty bytecode program. The VM runs it to check
your source and produce Panackelty bytecode. A fresh VM instance then verifies
and runs that bytecode. The page displays the result as text.

JavaScript connects the editor, worker and WebAssembly module. It doesn't
reimplement Panackelty's compiler or language rules.

## Each run starts fresh

The compiler needs files while it works: its own bytecode, the standard
library, your source and the bytecode it produces. A temporary filesystem holds
them for the duration of the run. It doesn't give Panackelty programs access to
files on your device, and it's discarded when the run ends.

The playground isn't a persistent REPL. It doesn't remember your program, so
copy any code you want to keep. Loading another example replaces the editor's
contents.

## What a program can access

Panackelty programs in the playground can't read your documents, start
processes or open network connections. Standard input is empty, and runtime
file writes are unavailable. The browser edition also leaves out typed native
services such as filesystem operations and sleep.

Runs have practical limits: source and combined output are each limited to
32 KiB, compiled bytecode to 1 MiB, the VM stack to 2 MiB and each VM instance
to 256 MiB of WebAssembly memory. A foreground run is stopped after 15 seconds.

The browser itself uses additional memory, and it may delay timers when the page
is in the background. These limits aren't a security certification or a cap on
all memory used by the browser tab.

Pressing **Stop** terminates the worker for that run. Completion, errors and the
time limit also end it. A later run gets a new worker, so it can't reuse the
previous run's state.

## The browser edition has its own release

The browser-specific build is maintained in the separate
[Panackelty Browser project](https://github.com/sproates/panackelty-browser).
The website pins a particular browser release and checks its digest before
assembling it. That pin is separate from the native toolchain, so a new native
release doesn't automatically change the compiler or host features in the
playground. The notice on the page tells you which native compiler release the
browser edition is based on.

Try it in [the Panackelty playground](https://panackelty.com/playground/).
The browser project's [contract and limitations](https://github.com/sproates/panackelty-browser#contract-and-limitations)
describe the implementation and its exact bounds.
