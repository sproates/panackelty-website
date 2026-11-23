# Time

Read a monotonic clock, construct exact durations and wait without blocking an async task.

## Import

```panack
import stdlib/time as time
```
For an async function, select the async module instead:

```panack
import stdlib/time/async as time
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## now()

```panack
now(): Result[Instant,ClockError]
```

**Parameters**

None.

**Returns:** `Result[Instant,ClockError]`. `Ok` contains the current monotonic instant.

Use `await time.now()` with the async import. A clock read is impure, even though it completes in the current task turn. Instants from the same invocation share a clock domain; consecutive readings may be equal. An instant is not a calendar timestamp and must not be persisted for comparison with another invocation.

**Errors:** `ClockUnavailable` if the host cannot supply the monotonic clock.

## sleep()

```panack
sleep(duration: Duration): Result[Unit,SleepError]
```

**Parameters**

- `duration: Duration` — a wait from zero through 365 days.

**Returns:** `Result[Unit,SleepError]`. `Ok(())` means the wait completed.

The ordinary form blocks. `await time.sleep(duration)` suspends the current task, allowing other tasks to progress. Zero completes immediately. Cancellation discards the async timer; it does not produce a normal successful return.

**Errors:** Negative durations produce `NegativeDuration`; waits beyond the host range produce `DurationTooLarge`. Timer, resource or host failures remain errors.

## seconds()

```panack
pure seconds(value: Int): Duration
```

**Parameters**

- `value: Int` — a signed number of seconds.

**Returns:** `Duration`, exactly representing the supplied value.

Pure. Negative durations are valid values, though APIs such as `sleep` reject them.

## milliseconds()

```panack
pure milliseconds(value: Int): Duration
```

**Parameters**

- `value: Int` — a signed number of milliseconds.

**Returns:** `Duration`, exactly representing the supplied value.

Pure. Negative durations are valid values, though APIs such as `sleep` reject them.

## nanoseconds()

```panack
pure nanoseconds(value: Int): Duration
```

**Parameters**

- `value: Int` — a signed number of nanoseconds.

**Returns:** `Duration`, exactly representing the supplied value.

Pure. Negative durations are valid values, though APIs such as `sleep` reject them.

## from_fractional_seconds()

```panack
pure from_fractional_seconds(value: Rat): Result[Duration,DurationError]
```

**Parameters**

- `value: Rat` — an exact number of seconds.

**Returns:** `Result[Duration,DurationError]`.

Pure. Conversion requires an exact whole number of nanoseconds. No rounding is performed.

**Errors:** `FractionalNanosecond` when the input cannot be represented exactly.

## Instant and Duration

`end.difference(start): Duration` subtracts two instants and returns a signed duration. `duration.as_nanoseconds(): Int` and `duration.as_seconds(): Rat` expose exact values.

Duration methods are pure:

- `add(right: Duration): Duration` and `subtract(right: Duration): Duration` perform exact arithmetic.
- `scale(factor: Int): Duration` multiplies by a signed integer.
- `is_less_than(right: Duration): Bool` compares durations.
- `divide(divisor: Int): Result[Duration,DurationError]` rejects zero and results requiring fractional nanoseconds.
- `ratio(right: Duration): Result[Rat,DurationError]` returns an exact ratio and rejects a zero right-hand duration.

`DurationError` has `FractionalNanosecond` and `ZeroDurationDivisor`. Compatibility factories `from_nanoseconds` and `from_seconds` retain the behaviour of `nanoseconds` and `from_fractional_seconds`.

## SleepError

```panack
record SleepError { duration: Duration, kind: SleepErrorKind, native: HostError }
```

`duration` is the requested wait. Use `problem.kind` for control flow and `problem.render()` for a human-readable explanation. The `native` field preserves the original failure. Host-backed native errors contain `operation: Str`, `code: Str` and `native_code: Nat`; a zero native number means no host error number was supplied.

```panack
enum SleepErrorKind { NegativeDuration, DurationTooLarge, TimerFailure, UnsupportedHost, OtherFailure }
```


## Example

[Read the complete timing program](/playbook/async-stdlib/#complete-example-async-timing), including clock failures and the difference between two instants.

