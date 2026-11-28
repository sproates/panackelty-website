---
title: Making shared state explicit
summary: Panackelty's new State API gives several calls a safe way to share a changing value. Here's what a cell is, why updates use pure functions, and where the guarantees stop.
status: draft
previewOrder: 2
tags:
  - language design
  - standard library
---

A request counter is a fairly simple requirement. Each request adds one, and the count needs to survive between calls.

But the counter belongs to the running service, rather than to an individual request. Creating a local variable inside the handler would start the count again on every call. Sharing a changing value introduces another question too: what happens when two calls try to update it?

Panackelty alpha.16 has an explicit State API for this. I wanted shared changes to be easy to express and easy to spot when reading the code.

For a running total inside a loop, I would still use a local mutable variable. State is useful when several calls or tasks need to share changes to the same value. It gives that shared value an identity and controls how reads and updates happen.

## What is a cell?

State stores a value in a shared container called a **cell**. Your program gets a handle to that cell, which can be passed to functions or retained by a closure.

There are three operations:

- `state.create(initial)` creates a cell containing the initial value.
- `state.read(cell)` returns an immutable snapshot of the current value.
- `state.update(cell, transform)` calculates and stores a replacement, then returns the new value.

The handle and the value are different things. Copying a handle gives another part of the program access to the same cell. Calling `create` again makes a separate cell, even if it starts with the same value.

That's why an immutable binding can refer to State. The binding continues to identify the same cell; the value inside that cell can change.

## Share a counter between calls

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

`State[Nat]` is a handle to a cell containing a non-negative integer. It isn't itself the number.

The output is:

```text
1
2
0
2
```

The first request returns the updated count, 1. The second uses `same_count`, which is another handle to the same cell, so it returns 2.

The third line prints `before`: the snapshot read when the count was still zero. That number hasn't changed. The final line reads the cell again and gets its current value, 2.

A snapshot is a value you can keep using. It isn't a live view that changes whenever someone updates the cell.

The `@increment` expression passes the named function as a value. `increment` is pure: it only calculates the next number. `record_request` is effectful because `state.update` commits the change.

## Keep an update together

Sharing a value doesn't by itself make a read-modify-write sequence safe. Imagine a shared count of 10. Two requests read it, calculate 11, and each writes back 11. There were two requests, but the count only increased once.

`state.update` keeps the read, calculation and replacement together as one operation relative to other accesses to that cell. Each increment uses the current value supplied to its callback. Two completed increments take 10 to 12. While the transformation is running, other reads and updates on that cell wait. Other cells and runnable tasks can still make progress.

This is the atomic-update guarantee. It applies to one cell, not to every operation the surrounding function happens to perform.

## The callback is deliberately restricted

The transformation passed to `update` must be pure. It cannot perform I/O, read the clock, await work, or create, read or update any cell. A completed update runs its transformation once. The API doesn't retry the callback behind your back.

If the calculation needs information from a file or a clock, obtain that information before the update and pass the resulting immutable data into the calculation. For the value being updated, use the callback's parameter. If you read the count beforehand and calculate a replacement from that old snapshot, wrapping the later write in `update` won't make the old snapshot current. It can still overwrite an intervening increment.

The pure-callback rule keeps external effects out of the transformation. It doesn't make an expensive calculation cheap, so keep the callback short enough that other users of the cell aren't left waiting.

## Closures can carry the handle

The complete example uses named functions and explicit parameters. State doesn't require closures.

If a callback is more convenient, the same counter can be retained by one. Inside the example's `main`, after creating `count`, this would work:

```panack
next = () => record_request(count)
print(next.call())
```

The closure retains the handle. The change still happens at the explicit `state.update` call inside `record_request`.

Panackelty rejects implicit capture of a mutable variable. Retaining a State handle makes the sharing explicit without changing the closure's binding. The [closures article](/articles/closures-without-hidden-mutation/) explains that distinction in more detail.

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

If a task is cancelled while waiting for the cell, its update callback never runs. If an update is cancelled or traps before it commits, the previous value is preserved. Once committed, a later cancellation or failed response doesn't undo it. That's relevant to a request counter: the number can record an increment even when the response never reaches the caller.

Cells hold immutable data, including numbers, text, records and collections. Their contents can't include other cells, callbacks, tasks or native resources. A closure can retain a State handle, but a State cell can't contain that closure.

The [State reference](/reference/stdlib-state/) documents those rules alongside the API. For something to run immediately, select **A shared counter** in the [playground](/playground/). The [HTTP cookbook](/playbook/callables-and-state/) takes the same idea into a service, with both closure-based and explicit-context versions.
