---
title: What is Unit in Panackelty?
status: published
date: 2026-10-12
tags:
  - types
---

Writing a file gives the caller no file contents back, but the write can still succeed or fail. Panackelty represents both outcomes with a `Result`. The `fs_write` function returns `Result[Unit,HostError]`.

## A `Result` describes both outcomes

`Result` has two type parameters: the first is the value carried by success, and the second is the value carried by failure. The function returns a `Result` value, and that value is always one of two cases: `Ok(success_value)` or `Error(error_value)`.

- `Ok(())` means the write succeeded. `()` is a `Unit` value, so there is no extra data to return.
- `Error(problem)` means the write failed. `problem` has type `HostError`.

So `Result[Unit,HostError]` does not mean “a result that contains an error”. It describes both alternatives. `Result[HostError]` would leave out the success type; Panackelty's `Result` needs both.

For a smaller example, this function returns the same shape with `Str` as its error type:

```panackelty
pure finish_step(completed: Bool): Result[Unit,Str] {
  if completed {
    Ok(())
  } else {
    Error("step failed")
  }
}
```

Here, `Ok(())` is success and `Error("step failed")` is failure. The caller can handle either case explicitly.

## Why is the success type `Unit`?

The success case still needs a value type, even when success has no data to return. `Unit` has one value, written `()`. That gives `Result` a real value for `Ok(())` without inventing a dummy answer.

By comparison, `fs_read` returns `Result[Bytes,HostError]` because a successful read does have data: the bytes it read. Both functions report errors in the same way; the first type parameter records what success carries.

## `Unit` is not `Void`

`Unit` and `Void` can look similar because both are associated with functions that may not return useful data. They have different roles:

- `Unit` is a first-class value. It can be stored, passed, returned and used inside `Result`, records, enums and collections.
- `Void` is a function return marker. It is not a value that can be stored or passed around.

That means `Void` cannot be used as the success type in `Result`: `Result[Void,E]` is not a valid Panackelty type. `Ok(...)` carries a value, and `Void` is not a value. `Unit` supplies the value for a successful operation with no data: `Ok(())`.

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

`Unit` is also different from `None()`. `None()` means an optional value is absent; `Unit` is a present success value with nothing more to carry. Use `Void` when a function returns no value at all. Use `Unit` when the result needs to say that an operation succeeded, even though there is no data to return.

For the exact rules and more examples, see [First-class Unit in the specification](https://github.com/sproates/panackelty/blob/main/SPEC.md#first-class-unit), [Exact fractions and Unit in the README](https://github.com/sproates/panackelty/blob/main/README.md#exact-fractions-and-unit), and [typed filesystem operations](https://github.com/sproates/panackelty/blob/main/SPEC.md#typed-filesystem-process-and-sleep-apis).
