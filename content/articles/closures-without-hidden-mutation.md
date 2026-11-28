---
title: Closures can remember things without hiding mutation
summary: Anonymous functions let you put behaviour where it's used. Closures let that behaviour retain the values it needs. Alpha.16 supports both, with explicit State for shared changes.
status: published
date: 2026-11-28
publishedAt: 2026-11-28T11:15:39.247Z
tags:
  - language design
  - standard library
---

When I started thinking about closures in Panackelty, my hesitation wasn't about functions remembering things. That's useful. It was about having to remember that a variable somewhere outside a function could change when the function ran.

I wanted the convenience of closures, but I also wanted shared mutation to be visible in the code. Alpha.16 supports that combination.

First, it's worth separating two ideas that often appear together. An anonymous function is a function written without a name. A closure retains values from the context where it was created. The same function can be both.

## Put a small function where it's used

Here's a complete program using an anonymous function:

```panack
main(): Void {
  scores: [Nat] = [82, 47, 65]
  results = scores.map((score) =>
    if score >= 50 { "Pass" } else { "Try again" }
  )
  for result in results { print(result) }
}
```

`map` calls the function for each score and collects the returned strings. The program prints `Pass`, `Try again`, then `Pass`.

The `(score) => ...` expression defines the function. The array's element type supplies the parameter type, so I don't have to repeat `Nat` on `score`. Where that context isn't available, a parameter needs an annotation, such as `(score: Nat)`.

This callback only uses its parameter and literal values. It doesn't need to retain anything from the surrounding code. The benefit is simply that the small operation is right beside the call that uses it.

## Return a function that keeps its configuration

Suppose I want two delivery-price calculators. Both charge 2 per item, but standard and express delivery have different base fees:

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

`delivery_price` returns a function. `PureFn[Nat,Nat]` means a pure function taking one `Nat` and returning a `Nat`. A stored function is invoked with `.call(...)`.

Calling `delivery_price(5)` creates the calculator; it doesn't calculate a delivery price yet. The returned function retains the value of `base_fee`, which is 5 for `standard` and 12 for `express`.

Both calls to `delivery_price` have finished by the time the calculators are used. Their base fees are still available. The three prices are 11, 18 and 7.

The returned function is anonymous, and it is also a closure because it retains `base_fee`. It keeps the values it references, rather than every variable that happens to be nearby.

Change the express base fee from 12 to 20 and its result becomes 26. The standard prices stay 11 and 7. Each calculator has its own retained configuration.

## Remembering a value doesn't mean changing it

Nothing in that example needs to mutate. Each calculator keeps an immutable fee and calculates a result from the number of items supplied to it. Retaining that fee doesn't stop the calculator being pure.

A handler retaining a service's startup time works on the same principle. The startup instant stays fixed; each invocation can use it to calculate an elapsed duration from a fresh clock reading.

A request counter has a different requirement: its value needs to change across calls. Panackelty rejects implicit capture of a `mut` binding, even if the closure only tries to read it. You can pass the value as a parameter, take an immutable snapshot, or use State when changes really should be shared.

With State, a closure retains a handle to a shared cell. Reads and changes happen through `state.read` and `state.update`. The handle stays the same while the value in the cell can change. That makes the shared operation visible without making closures responsible for managing updates.

I'll give State its own article. The [State guide](/playbook/state/) already has the API and working examples.

## Where I'd use each

For a short transformation, I'd use an anonymous function at the call site. For a callback that needs configuration after its creator has returned, a closure carries that configuration with it. A larger operation may still be clearer as a named function, passed using `@name`.

There are boundaries around what a closure can retain. Native resources such as response writers and connections can't be captured; they need to be supplied as parameters when the function is called. Capturing a value also doesn't change which effects a function is allowed to perform.

The [playground](/playground/) has **Anonymous functions** and **Closures that remember** examples based on these programs. Try changing the pass threshold in the first, then changing only the express fee in the second. One changes the operation being applied; the other changes the configuration retained by one returned function.
