---
title: Exact arithmetic without silent rounding
status: draft
tags:
  - types
  - language
---

In TypeScript, `0.1 + 0.2 === 0.3` is `false`; the sum is `0.30000000000000004`. Binary floating-point can’t represent some decimal fractions exactly, so the small difference can affect a comparison.

Panackelty takes a different approach for its built-in numeric types. Integers, decimal values and rational values are exact. When an operation cannot produce an exact result in the requested type, Panackelty reports that fact instead of quietly choosing a rounded value.

That is a deliberate design choice. Panackelty makes exact values the default so a calculation does not silently lose information. If a program needs truncation or rounding, the code should make that decision visible.

That doesn’t rule out other numeric types. If there were a concrete need for faster processing of large numerical workloads, we could consider adding a `Float` alongside the exact types. It would be a deliberate choice to accept approximation for that work.

## Choose the type for the calculation

As of alpha.12, Panackelty has four built-in numeric types for different jobs:

| Type | What it represents |
| --- | --- |
| `Nat` | An arbitrary-precision integer that is zero or positive |
| `Int` | An arbitrary-precision signed integer |
| `Dec` | An arbitrary-precision base-ten decimal, not a binary floating-point value |
| `Rat` | An exact fraction with an arbitrary-precision numerator and denominator |

These are not just different ways to print the same value. The type tells the compiler which operations make sense and what result to expect.

## Fractions stay fractions

In Panackelty, `/` between integers produces a `Rat`, even when the answer is a whole number. `1 / 3` is stored as exactly one third; `6 / 3` is represented as `2/1`.

Rational arithmetic keeps that exactness through addition, subtraction, multiplication and division. Panackelty also reduces fractions as it works. Multiplying one third by thirty produces `10/1`:

```panackelty
main(): Void {
  third = 1 / 3
  ten = third * 30
  print(ten)        // 10/1
  print(ten.nat())  // 10
}
```

The displayed `10/1` makes the value’s type visible. Converting it to `Nat` is explicit, and succeeds because the rational is a whole, non-negative number.

A conversion such as `(1/3).nat()` traps. It does not discard the fractional part and return zero.

Sometimes a program really does want integer division. For two `Nat` values, `quotient(7, 2)` returns `3`, with the remainder available through `%`. The separate operation makes truncation a deliberate choice instead of an accidental consequence of using `/`.

## Decimal values stay decimal

`Dec` represents base-ten values directly. Addition, subtraction and multiplication are exact, so a decimal calculation does not pick up binary floating-point approximation.

The TypeScript comparison from above is true in Panackelty:

```panackelty
main(): Void {
  total = 0.1 + 0.2
  print(total)         // 0.3
  print(total == 0.3)  // true
}
```

This is useful when the inputs and intermediate calculations are naturally decimal, such as prices, measurements or rates.

Exact arithmetic does not decide how a final amount should be rounded to pounds and pence. The application still needs to choose when to round and which rule its domain requires.

Decimal division is exact when the result has a finite decimal expansion. Dividing by two can produce a finite decimal; dividing one by three cannot.

In that case, `Dec` division reports that an explicit rounding operation is needed. Panackelty does not yet provide rounding modes or a rounded-decimal conversion API. It won’t silently choose one on your behalf.

## Conversions are part of the program

Rational and decimal arithmetic are separate. Panackelty does not implicitly convert a `Rat` to a `Dec`, or an integer to a `Rat`.

Integer division already gives a rational. Where an integer must be written as one, use `n / 1`.

A rational can be converted to `Dec` only when it has an exact finite decimal representation. After the fraction is reduced, its denominator can contain only factors of two and five.

`(1 / 2).dec()` succeeds and gives `0.5`. `(1 / 3).dec()` traps rather than approximating the value.

These conversions are deliberately visible because changing numeric representations can change which values are possible. If a conversion cannot preserve the value, Panackelty makes the failure explicit.

## Exact does not mean unlimited

`Nat`, `Int`, `Dec` and `Rat` have no fixed machine-word precision limit in their language definitions. Large values can grow as calculations proceed, avoiding ordinary fixed-width integer overflow.

Exact arithmetic is not free. Bigger integers and fractions take more memory and more work, and rational numerators and denominators can grow substantially.

Exactness does not prove that a formula is right. It means the operations follow the defined arithmetic rules without silently rounding or truncating.

The programmer still needs to choose the right model, units and domain policy. Use `Dec` for exact base-ten calculations, `Rat` when fractions must remain exact, and `quotient` when the algorithm intends to truncate integer division.

For the full rules, see [numeric semantics in the specification](https://github.com/sproates/panackelty/blob/main/SPEC.md#values-and-numeric-semantics), the [exact-decimal example in the README](https://github.com/sproates/panackelty/blob/main/README.md#exact-decimal-arithmetic), and the [decimal example program](https://github.com/sproates/panackelty/blob/main/examples/decimal.panack).
