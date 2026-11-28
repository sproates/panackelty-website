---
title: Making shared state explicit
summary: Panackelty's new State API gives several calls a safe way to share a changing value. Here's what a cell is, why updates use pure functions, and where the guarantees stop.
status: draft
previewOrder: 2
tags:
  - language design
  - standard library
---

A request counter is a fairly simple requirement. Each request adds one, and the next request sees the updated count.

But the counter belongs to the running service, rather than to an individual request. Creating a local variable inside the handler would start the count again on every call. Sharing a changing value introduces another question too: what happens when two calls try to update it?

Panackelty alpha.16 has an explicit State API for this. I wanted shared changes to be easy to express and easy to spot when reading the code.

## What is a cell?

State stores a value in a shared container called a **cell**. Your program gets a handle to that cell, which can be passed to functions or retained by a closure.

There are three operations:

- `state.create(initial)` creates a cell containing the initial value.
- `state.read(cell)` returns an immutable snapshot of the current value.
- `state.update(cell, transform)` calculates and stores a replacement, then returns the new value.

The handle and the value are different things. Copying a handle gives another part of the program access to the same cell. Calling `create` again makes a separate cell, even if it starts with the same value.

That's why an immutable binding can refer to State. The binding continues to identify the same cell; the value inside that cell can change.

## A complete example, without a closure

```panack
import stdlib/state as state

pure increment(current: Nat): Nat {
  current + 1
}

record_request(count: State[Nat]): Nat {
  state.update(count, @increment)
}

main(): Void {
  count = state.create[Nat](0)
  same_count = count
  before = state.read(count)

  print(record_request(count))
  print(record_request(same_count))
  print(before)
  print(state.read(count))
}
```

This prints `1`, `2`, `0`, then `2`.

The first two calls update the same cell. `same_count = count` copies the handle, so it doesn't create an independent counter.

`before` is different. It's the number returned by the earlier read, when the cell contained zero. It stays zero after the updates. Reading State doesn't give you a variable that silently changes underneath you.

The `@increment` expression passes the named function as a value. `increment` is pure: it calculates a replacement without changing anything itself. `record_request` is effectful because `state.update` commits the change.

## Why not just use a mutable variable?

For a running total inside a loop, I would still use a local mutable variable. State would add unnecessary machinery to that job.

The useful distinction is sharing. If several handlers or tasks need access to the same changing value, the program needs to say how those accesses fit together.

Imagine a shared count of 10. Two requests read it, calculate 11, and each writes back 11. There were two requests, but the count only increased once.

`state.update` keeps the read, calculation and replacement together as one operation relative to other accesses to that cell. Each increment uses the current value supplied to its callback. Two completed increments take 10 to 12.

This is the atomic-update guarantee. It applies to one cell, not to every operation the surrounding function happens to perform.

## The callback is deliberately restricted

The transformation passed to `update` must be pure. It cannot perform I/O, read the clock, await work, or create, read or update another cell. The callback runs once; the API doesn't retry it behind your back.

If the calculation needs information from a file or a clock, obtain that information before the update and pass the resulting immutable data into the calculation. Keep the shared value itself inside the update: reading a snapshot first and later using it to replace the current value can still overwrite someone else's intervening change.

These rules also mean an update isn't somewhere to put a network request or a long sequence of work. Its job is to calculate the next value.

## Closures can carry the handle

The complete example uses named functions and explicit parameters. State doesn't require closures.

If a callback is more convenient, the same counter can be retained by one. Inside the example's `main`, after creating `count`, this would work:

```panack
next = () => record_request(count)
print(next.call())
```

The closure retains the handle. The change still happens at the explicit `state.update` call inside `record_request`.

Panackelty rejects implicit capture of a mutable variable. I don't want the reader to have to remember that an apparently ordinary variable is actually shared with a function created elsewhere. A State handle gives that relationship a type, and the API names tell you where the contents are read or changed.

## The async interface

Choose `stdlib/state/async` when you need to call State operations from async functions. The names stay the same, and the operations use `await`:

```panack
import stdlib/state/async as state

async record_request(count: State[Nat]): Nat {
  await state.update(count, (current: Nat) => current + 1)
}
```

This is a function definition, rather than a complete program. Its caller creates the cell with `await state.create[Nat](0)` and can inspect it with `await state.read(count)`.

Both imports use the same `State[T]` type. An async operation waiting for access to a cell lets other runnable tasks progress. The transformation itself remains pure and doesn't suspend.

## Where the guarantees stop

State isn't persistent storage. A new run of the program creates new cells. It also doesn't provide a transaction across several cells, or make a cell update atomic with sending an HTTP response.

If an update is cancelled or traps before it commits, the previous value is preserved. Once committed, a later cancellation or failed response doesn't undo it. That's relevant to a request counter: the number can record an increment even when the response never reaches the caller.

Cells hold immutable data, including numbers, text, records and collections. Their contents can't include other cells, callbacks, tasks or native resources. A closure can retain a State handle, but a State cell can't contain that closure.

The [State reference](/reference/stdlib-state/) documents those rules alongside the API. For something to run immediately, select **A shared counter** in the [playground](/playground/). The [HTTP cookbook](/playbook/callables-and-state/) takes the same idea into a service, with both closure-based and explicit-context versions.
