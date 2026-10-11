---
title: What is Unit in Panackelty?
status: published
date: 2026-10-12
tags:
  - types
---

Some functions do useful work without producing information for their caller. Writing a file is one example: the caller may need to know whether the operation succeeded, but there is no file contents value to return.

Panackelty has a type for that successful “no data” value: `Unit`. It has exactly one value, written `()`.

## `Unit` is a value

Because `Unit` is an ordinary type, a function can return it, store it, pass it to another function or use it as part of a larger type. Its value carries no detail, but its presence still has meaning:

```panackelty
success: Unit = ()
print(success) // ()
```

There is only one possible `Unit` value, so two `Unit` values are equal. Arithmetic and ordering do not apply to it. `Unit` is for representing a value whose meaning is “there is no further result to provide”.

## No data can still be a successful result

The value becomes especially useful when an operation can either succeed without returning data or fail with an explanation. Panackelty can express that as `Result[Unit,E]`:

```panackelty
pure finish_step(completed: Bool): Result[Unit,Str] {
  if completed {
    Ok(())
  } else {
    Error("step failed")
  }
}
```

The two cases have different meanings. `Ok(())` says the step succeeded and has no result data. `Error("step failed")` carries the failure. A real filesystem operation uses this shape too: `fs_write` returns `Result[Unit,HostError]`.

If the function returned only `Unit`, the caller would have no result value through which to distinguish success from a reported failure. If it returned only an error type, success would need another convention. `Result` makes both outcomes explicit in one type.

## `Unit` is not `Void`

`Unit` and `Void` can look similar because both are associated with functions that may not return useful data. They have different roles:

- `Unit` is a first-class value. It can be stored, passed, returned and used inside `Result`, records, enums and collections.
- `Void` is a function return marker. It is not a value that can be stored or passed around.

That means `Void` cannot be used as the success type in `Result`: `Result[Void,E]` is not a valid Panackelty type. `Result` needs a success value to put inside `Ok(...)`. `Unit` supplies that value, so `Result[Unit,E]` can represent both outcomes: `Ok(())` for success with no data, or `Error(problem)` for failure.

A `Void` function may reach the end of its body without producing a value. A function declared to return `Unit` must explicitly produce `()`:

```panackelty
main(): Void {
  print("Finished")
}

pure finish(): Unit {
  ()
}
```

The empty parentheses on the last line are the result. They are not an omitted result.

## It is not a missing value

`Unit` also differs from `None()`. `None()` is one variant of `Option[T]`, used when a value may be absent. `Unit` is a present value with one possible form. A function can return `Option[Unit]` if it needs to represent either “no event” or “an event happened, with no extra data”, though in many APIs `Result[Unit,E]` is the more useful choice when failure details matter.

That distinction keeps the type informative. `Unit` says a value exists but carries no payload; `None()` says the optional value is absent; `Void` says the function has no value result at all.

## Where it fits

The difference is useful when two operations follow the same success-or-failure pattern, but only one has data to return. For example, `fs_read` returns `Result[Bytes,HostError]`, while `fs_write` returns `Result[Unit,HostError]`. A successful read contains bytes; a successful write contains `()`. Both use `Result` to report an error in the same way, without inventing a dummy value for the write or giving it a separate convention.

Use `Void` when a function has no value result. Use `Unit` when an API needs a result value even though success carries no extra information.

For the exact rules and more examples, see [First-class Unit in the specification](https://github.com/sproates/panackelty/blob/main/SPEC.md#first-class-unit), [Exact fractions and Unit in the README](https://github.com/sproates/panackelty/blob/main/README.md#exact-fractions-and-unit), and [typed filesystem operations](https://github.com/sproates/panackelty/blob/main/SPEC.md#typed-filesystem-process-and-sleep-apis).
