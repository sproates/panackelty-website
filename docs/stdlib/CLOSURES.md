# Closures

A closure is a function that retains values from the scope where it was created.
Use one when a callback needs some configuration in addition to the parameters
supplied by its caller.

## Retain a value

```panack
main(): Void {
  greeting = "Hello, "
  greet = (name: Str) => greeting + name
  print(greet.call("Ian"))
}
```

This prints `Hello, Ian`. The caller supplies `name`; the function retains
`greeting` from its surrounding scope. That retained value is a **capture**.
The function keeps captured values available even after the scope that created
it has finished.

## Capture is immutable

Capturing a binding does not give the callback a mutable variable that other code
can silently change later. Panack rejects implicit capture of `mut` bindings.
Pass a value as a parameter, take an immutable snapshot before creating the
closure, or use [State](/playbook/state/) when calls need to share changes.

A closure can retain a State handle. The handle identifies a shared container;
the contents change only through explicit State operations. This lets the code
show where shared mutation happens.

## Keep resources in parameters

Request writers, connections and other native resources cannot be captured.
Receive them as callback parameters instead. In the cookbook's HTTP handler,
the start time and State handle are captures; the request and response writer
are parameters supplied by the server.

## When to use a named function instead

A closure keeps a callback and its captured values together. A named function
with an explicit context parameter is useful when you want that context visible
in the function signature. Both can use State; neither is required by it.

The [cookbook](/playbook/callables-and-state/) shows the same HTTP service in both
styles. See [Anonymous functions](/playbook/anonymous-functions/) for the syntax
used to define the callback.
