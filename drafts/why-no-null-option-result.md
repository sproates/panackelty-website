---
title: Why there is no null in Panackelty
status: draft
previewOrder: 2
tags:
  - types
  - errors
---

Panackelty doesn’t need a universal `null` value. `Option[T]` says a value may be present or absent; `Result[T,E]` distinguishes success from failure; and [Unit](/articles/what-is-unit-in-panackelty/) is the value used for success with no result data. Each gives the caller a specific meaning to handle. A single `null` would not say which situation it represents.

## Absence is an `Option`

An `Option[T]` contains either `Some(value)` or `None()`:

```panackelty
pure describe_home(value: Option[Str]): Str {
  match value {
    Some(home) => "Home is ${home}",
    None() => "Home is not set"
  }
}
```

There is no hidden value inside `None()`. The caller has to consider both possibilities before it can use a `Str` from this `Option[Str]`.

This fits a lookup where absence is an expected outcome. For example, `environment(name)` returns `Option[Str]`: the variable either has a string value or is not set. The result does not invent an error reason when “not present” is all the caller needs to know.

## Failure is a `Result`

When the caller needs to know why an operation failed, Panackelty uses `Result[T,E]`. It contains either `Ok(value)` or `Error(problem)`, where the error type `E` carries the relevant information:

```panackelty
pure safe_divide(numerator: Nat, denominator: Nat): Result[Nat,Str] {
  if denominator == 0 {
    Error("division by zero")
  } else {
    Ok(quotient(numerator, denominator))
  }
}

pure describe(result: Result[Nat,Str]): Str {
  match result {
    Ok(value) => "result: ${value}",
    Error(message) => "error: ${message}"
  }
}
```

The type keeps success and failure separate. A successful result contains a `Nat`; a failure contains a `Str` explaining the problem. Host APIs use the same shape with structured error types, such as `Result[Bytes,HostError]` for reading a file.

## The compiler can check a match

`Option` and `Result` are tagged unions. The compiler knows which variants each type has, so a `match` must account for every case. If a new case is added to an enum, incomplete matches can be caught during checking rather than becoming a surprise when that case occurs at runtime.

This does not mean every returned `Result` is automatically handled. The type exposes the possible outcomes, and exhaustive matching checks code that branches on them. A caller can still choose to ignore a value; the language does not turn every `Result` into a mandatory error-handling protocol.

## “Nothing” still has a type

`None()` does not mean that a value has no type. It is the empty variant of an `Option[T]`; the surrounding context determines `T`. Panackelty’s `Unit` value, written `()`, serves another purpose: it represents a successful value when an operation has nothing useful to return. That makes `Result[Unit,E]` possible for an operation that succeeds without data or returns an error.

`Unit` is also distinct from `Void`. `Unit` is an ordinary value that can be stored or passed around. `Void` is the function return marker for code that returns no value.

## Not every failure is a `Result`

`Option` and `Result` are for outcomes the program chooses to represent as data. They do not eliminate traps for invalid operations or guarantee that every possible failure has been handled. A division by zero, for example, can still trap if code performs the operation without checking it first.

The point of having no universal `null` is to keep these meanings visible. Use `Option` when a value may be absent, `Result` when success and failure need separate payloads, and `Unit` when success carries no data. The type tells the next function what it may receive, and exhaustive matching helps make the alternatives clear in the code.

For the definitions and examples, see [Option and Result in the specification](https://github.com/sproates/panackelty/blob/main/SPEC.md#standard-library), [exhaustive data modelling in the README](https://github.com/sproates/panackelty/blob/main/README.md#exhaustive-data-modelling), and the [core type definitions](https://github.com/sproates/panackelty/blob/main/src/stdlib/core.panack).
