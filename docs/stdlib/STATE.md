# Shared State

State provides a shared container for a value. Functions can read that value or
update it safely, even when several async tasks use the same container. This
container is called a **cell**.

Use State when separate calls need to share changes: a request count, for example,
must keep increasing rather than start again for every request.

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

Two requests might both read a count of zero before either writes a replacement.
If each then stores one, an increment is lost. Keeping the read and calculation
inside `update` prevents that: Panack coordinates competing operations on the
same cell, and each update uses the value left by the previous committed update.

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
