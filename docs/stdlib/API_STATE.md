# State

Share a cell across calls while keeping changes explicit and atomic.

## Import

```panack
import stdlib/state as state
```

From async code, use:

```panack
import stdlib/state/async as state
```

Both imports use the same `State[T]` type. All three operations are effectful;
the async versions have the same names and types and require `await`.

## create()

```panack
create[T](initial: T): State[T]
```

**Parameters**

- `initial: T` — the immutable data to store initially.

**Returns:** A new `State[T]` handle. Copying the handle shares this cell;
creating another cell with the same initial value does not.

Payloads may contain primitives, records, variants and collections. Cells,
callbacks, tasks and native resources are rejected, including nested occurrences.
Creation is effectful, so a pure function cannot allocate a cell.

**Errors:** There is no recoverable `Result` wrapper. Invalid payloads are rejected
by the compiler and runtime safety checks. Allocation failure follows the VM's
normal failure behaviour. The cell is reclaimed when its last reference is released;
there is no manual close operation.

## read()

```panack
read[T](cell: State[T]): T
```

**Parameters**

- `cell: State[T]` — the cell to read.

**Returns:** An immutable snapshot of its current value.

If an update owns the cell, the read waits until that update commits or is aborted.
An async read yields while waiting. Later updates do not change an earlier snapshot.

**Errors:** There is no recoverable `Result` wrapper. A cancelled wait does not
return a snapshot. Ordinary calls made within a host scheduler let it progress
while waiting; the API does not introduce threads or a new timeout.

## update()

```panack
update[T](cell: State[T], transform: PureFn[T,T]): T
```

**Parameters**

- `cell: State[T]` — the cell to reserve and update.
- `transform: PureFn[T,T]` — a pure function receiving the current value and returning its replacement.

**Returns:** The newly committed value, not the previous value.

The callback runs exactly once after the cell is reserved. Competing reads and
updates wait; unrelated cells and runnable tasks may progress. Keep the whole
read-modify-write operation here. Reading a snapshot and later replacing the cell
based on it can overwrite an intervening change.

The callback cannot perform I/O, read the clock, await work or create, read or update a cell.
Obtain external values first and capture those immutable values if needed.

**Errors:** There is no recoverable `Result` wrapper. A callback trap or cancellation
before commit leaves the old value intact and releases the reservation. Cancellation
after commit does not undo the change. Cancelling a waiter never runs its callback.
There are no implicit retries, public locks or multi-cell transactions.

## Identity and use in closures

Closures may retain State handles. `a == b` compares cell identity without reading
or reserving either payload. Cells cannot be Map keys or Set elements, including
when nested in another value, but may be stored as Map values.

See the [callable and State guide](../../docs/guides/CALLABLES_AND_STATE.md) for
the closure-based and named contextual HTTP examples and their counting rules.
