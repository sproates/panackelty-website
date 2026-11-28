# Shared State

State provides a shared container for a value. Functions can read that value or
update it safely, even when several async tasks use the same container. This
container is called a **cell**.

Use State when separate calls need to share changes: a request count, for example,
must keep increasing rather than start again for every request.

## Why use State instead of a mutable variable?

A mutable variable is useful when one function owns a changing value—for example,
a running total inside a loop. Keep using mutable variables for that.

State is useful when several calls or async tasks need to share a changing value.
A request counter belongs to the running service, so each request must update
the same counter.

Sharing a mutable variable alone would not make that update safe. Two requests
could both read `10`, both add one, and both write `11`. One request would go
uncounted.

With `state.update`, reading the current value and replacing it happen as one
coordinated operation. Two increments take the count from `10` to `12`.

Panack also rejects mutable-variable capture in closures. A closure can retain
a State handle instead, making shared changes explicit at each `state.update`
call.

## Create, update and read a cell

```panack
import stdlib/state as state

main(): Void {
  count = state.create[Nat](0)
  total = state.update(count, (current: Nat) => current + 1)
  print(total)
  print(state.read(count))
}
```

This prints `1` twice. `create` makes a cell initially holding zero.
`update` gives its current value to the callback, stores the callback's result
and returns that new value. `read` returns an immutable snapshot of the value.

Copying a State handle shares the same cell. Creating another cell makes a
separate container, even if both start with the same value.

## Keep the whole update together

Keep the read and calculation inside `update`. Reading a snapshot with `read`
and calculating a replacement before calling `update` can still lose someone
else's change. Use the current value supplied to the update callback.

The update callback is pure and runs once. It cannot perform I/O, read the clock,
await work or create, read or update a cell. Obtain external values before the
update and capture the resulting immutable data if needed.

## Use State with async functions

To use the async State API, import:

```panack
import stdlib/state/async as state
```

Call `create`, `read` and `update` with `await` inside an async function.
Both APIs use the same `State[T]` type. An async operation waiting for a cell
lets other runnable tasks progress.

## Choose what to store

Cells hold immutable data such as numbers, text, records and collections.
Their contents cannot include other cells, callbacks, tasks or native resources.
A closure can retain a cell's handle, so multiple calls can use the same cell.

See the [State API reference](/reference/stdlib-state/) for signatures, identity
and cancellation behaviour. The [cookbook](/playbook/callables-and-state/) shows
a retained counter and two HTTP services combining State with the async clock.
