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

When you press **Run program**, the page starts a worker, a background task that
lets the editor stay responsive while your program runs. The worker loads
Panackelty's compiler and standard library, along with the Panackelty virtual
machine (VM). The VM executes Panackelty bytecode. For the browser, the VM is
compiled to WebAssembly, a format browsers can run.

![Flow from source to output: the page sends source to a worker; a Panackelty VM compiled to WebAssembly runs the compiler bytecode and produces Panackelty bytecode; a fresh VM verifies and runs it; the page displays the output and diagnostics as text.](/images/playground-run-flow.svg)

The compiler itself is written in Panackelty and runs in the VM.

JavaScript connects the editor, worker and WebAssembly module. It doesn't
reimplement Panackelty's compiler or language rules.

> **Host access is limited.** Panackelty programs can't read files on your device, write runtime files, start processes or open network connections. Standard input is empty, and native services such as file operations and sleep aren't available.

## Each run starts fresh

The compiler needs files while it works: its own bytecode, the standard
library, your source and the bytecode it produces. A temporary filesystem holds
them for that run and is discarded when it ends.

The playground isn't a persistent REPL. It doesn't remember your program, so
copy any code you want to keep. Loading another example replaces the editor's
contents.

## Runs are bounded

Runs have practical limits: source and combined output are each limited to
32 KiB, compiled bytecode to 1 MiB, the VM stack to 2 MiB and each VM instance
to 256 MiB of WebAssembly memory. A foreground run is stopped after 15 seconds.

The browser itself uses additional memory, and it may delay timers when the page
is in the background. These limits aren't a security certification or a cap on
all memory used by the browser tab.

Pressing **Stop** terminates the worker for that run. Completion, errors and the
time limit also end it. Replies from an ended worker are ignored, so old output
can't replace the result of a later run.

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
