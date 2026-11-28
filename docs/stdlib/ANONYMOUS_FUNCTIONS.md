# Anonymous functions

An anonymous function is a function you define without giving it a declaration
name. Use one when a small operation is easiest to understand beside the code
that calls it.

## Define and call a function

```panack
main(): Void {
  increment = (value: Nat) => value + 1
  print(increment.call(4))
}
```

This prints `5`. The parameter is `value`, its type is `Nat`, and the expression
after `=>` supplies the result. Assigning the function to `increment` stores it;
`increment.call(4)` runs it. Defining a function does not run its body.

## Pass a function directly

```panack
main(): Void {
  values: [Nat] = [1, 2, 3]
  increased = values.map((value) => value + 1)
  print(increased)
}
```

The result is a list containing `2`, `3` and `4`. Here `map` supplies the
parameter type from the list's element type, so the callback does not need
`value: Nat`. Without that context, write the parameter type explicitly.

Named functions remain useful for reusable operations. Pass a named function
as a value using `@name`.

## Effects and async functions

The body determines whether an unmarked anonymous function is pure or has ordinary
effects. An async anonymous function starts with `async`, for example
`async (...) => { ... }`. Call an async function with `await` inside an async
function. Making a function anonymous does not relax the usual effect rules.

## Next steps

An anonymous function can also retain values from its surrounding scope. Read
[Closures](/playbook/closures/) for that behaviour, or the
[cookbook](/playbook/callables-and-state/) for complete programs.
