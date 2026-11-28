---
title: Closures can remember things without hiding mutation
summary: Panackelty now has anonymous functions and closures. Shared changes use an explicit State API, because retaining a value and changing a value are different jobs.
status: draft
previewOrder: 2
tags:
  - language design
  - standard library
---

When I started thinking about closures in Panackelty, my hesitation wasn't about functions remembering things. That's useful. It was about having to remember that a variable somewhere outside a function could change when the function ran.

I wanted the convenience of closures, but I also wanted shared mutation to be visible in the code.

Alpha.16 supports anonymous functions, closures and explicit State. They work together, but they solve different problems.

## An anonymous function doesn't need to remember anything

This is a complete program:

```panack
main(): Void {
  scores: [Nat] = [82, 47, 65]
  results = scores.map((score) =>
    if score >= 50 { "Pass" } else { "Try again" }
  )
  for result in results { print(result) }
}
```

The function passed to `map` has no name. It takes a score and returns a result. The array's element type supplies the parameter type, so I don't have to repeat `Nat` on `score`.

It prints `Pass`, `Try again`, then `Pass`. There are no surrounding values for this callback to retain. The useful part is simply being able to write a small operation where it's used.

## A closure carries something with it

Now suppose I want delivery-price calculators with different base fees:

```panack
pure delivery_price(base_fee: Nat): PureFn[Nat,Nat] {
  (items: Nat) => base_fee + items * 2
}

main(): Void {
  standard = delivery_price(5)
  express = delivery_price(12)
  print(standard.call(3))
  print(express.call(3))
  print(standard.call(1))
}
```

`delivery_price` returns a function. `PureFn[Nat,Nat]` says that it takes a `Nat`, returns a `Nat`, and is pure. A stored function is invoked with `.call(...)`.

The calls to `delivery_price` finish before any prices are calculated. But `standard` retains a base fee of 5, and `express` retains 12. The output is 11, 18, then 7.

That's what the closure adds: the returned function keeps the immutable value it needs for later calls. Calling the express calculator doesn't change the standard calculator's fee.

## A counter needs something else

A counter should change between calls. Panackelty doesn't let a closure implicitly capture a `mut` binding, so shared changes use `stdlib/state`:

```panack
import stdlib/state as state

main(): Void {
  count = state.create[Nat](0)
  next = () => state.update(count, (current: Nat) => current + 1)
  current = () => state.read(count)

  print(current.call())
  print(next.call())
  print(next.call())
  print(current.call())
}
```

This prints 0, 1, 2, then 2.

`state.create` creates a cell, which is a value accessed through a shared handle. Both closures retain the same handle. The binding `count` isn't reassigned, but the value in the cell changes when `next` calls `state.update`.

I can see where that happens. Reading the value is explicit too, through `state.read`.

The update callback receives the current value and returns its replacement. It must be pure and it runs once. Reading, transforming and replacing the value happens as one operation relative to other accesses to that cell, so competing increments don't overwrite each other.

That guarantee doesn't extend to an arbitrary sequence of separate calls. If I read a value, do some other work and later replace it using that old snapshot, someone else may have updated it in between. Keep a read-modify-write operation inside `update`.

## Why offer both?

A closure is useful for carrying configuration or a State handle into a callback. State is useful when several calls need to share a changing value. Neither requires the other: State can also be passed explicitly to a named function.

There is a bit more code than capturing a mutable counter directly. I think that's worthwhile when the extra code tells the reader where shared changes happen. Ordinary local mutable variables still have their place; this isn't a requirement to turn every local calculation into a State cell.

You can run these three examples from the [playground's example picker](/playground/). The [State guide](/playbook/state/) explains the guarantees and limitations in more detail, including the async interface.
