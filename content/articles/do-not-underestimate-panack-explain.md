---
title: Do not underestimate the power of panack explain
status: published
date: 2026-10-15
tags:
  - compiler
  - tooling
---

A compiler can tell you whether code passed or failed. Panack Explain can also show selected decisions the checker made: the types it compared, the facts it used, and where those facts came from.

I want compiler reasoning to be something developers can inspect while they’re trying to understand their code. These examples show what that looks like in the alpha.13 development on the `next` branch. I’ve omitted sections of the full reports that aren’t relevant to each example.

> **Version note:** The `panack explain` command in alpha.12 has a narrower scope. This article describes the expanded work in progress for alpha.13, so some details may change before release.

## When the checker proves a subtraction

Save this as `example.panack`:

```panack
pure remaining(n: Nat): Nat {
  if n >= 2 { n - 2 } else { 0 }
}
main(): Void {
  print(remaining(5));
}
```

Compile and run it:

```text
$ panack compile example.panack -o example.bc
wrote example.bc

$ panack run example.panack
3
```

Ask Panack to explain its decisions for `remaining`:

```text
$ panack explain example.panack --function remaining
```

The report connects the proof to its source:

```text
program: accepted
function: remaining

subtraction: proved
source: project/example.panack:2:15-2:20
expression: n - 2
operand types: Nat, Nat
obligation: left >= right
right constant: 2
left lower bound: 2
guard branch: true
source: project/example.panack:2:6-2:12
expression: n >= 2
reason: retained lower bound is at least the right constant
```

The true branch of `n >= 2` gives the checker a lower bound of `2`, enough to prove `n - 2` safe.

## When the available bound is too weak

Change the subtraction to `n - 3` and save the file as `example.panack` in a separate folder:

```panack
pure remaining(n: Nat): Nat {
  if n >= 2 { n - 3 } else { 0 }
}
main(): Void {
  print(remaining(5));
}
```

Compilation now fails:

```text
$ panack compile example.panack -o example.bc
error: <path>/example.panack:2:15: Nat subtraction may underflow; prove the left side is large enough or use Int
  2 |   if n >= 2 { n - 3 } else { 0 }
    |               ^
```

The diagnostic path depends on where the file is saved. Since compilation fails, there’s no compiled program to run.

Ask for the explanation:

```text
$ panack explain example.panack --function remaining
```

Panack prints the normal compiler diagnostic as well as the explanation. The relevant report excerpt is:

```text
program: rejected
function: remaining

subtraction: unproved
source: project/example.panack:2:15-2:20
expression: n - 3
operand types: Nat, Nat
obligation: left >= right
right constant: 3
left lower bound: 2
guard branch: true
source: project/example.panack:2:6-2:12
expression: n >= 2
reason: retained facts do not prove the obligation; this does not establish a runtime failure
```

The checker can establish `n >= 2`, but that doesn’t prove `n >= 3`. “Unproved” means the available facts are insufficient; it doesn’t claim the expression will definitely fail at runtime.

## Inspect an inferred type and a source location

Save this as `example.panack` in another folder:

```panack
pure identity[T](value: T): T { value }
probe(): Void {
  answer = identity("typed");
}
main(): Void {}
```

Compile it and ask for the explanation of `probe`:

```text
$ panack compile example.panack -o example.bc
wrote example.bc

$ panack explain example.panack --function probe
```

The report shows how the local type was inferred and how the generic call argument was checked:

```text
inferred local: answer
source: project/example.panack:3:12-3:29
expression: identity("typed")
initializer type: Str
inferred type: Str
reason: the checked initializer type determines this local type

call argument 1 to identity: accepted
source: project/example.panack:3:21-3:28
expression: "typed"
actual type: Str
expected type: Str
reason: the checked argument is compatible with the expected type
```

To query the type at a particular position, add `--type-at LINE COLUMN`. Column 23 is inside `"typed"` on line 3:

```text
$ panack explain example.panack --function probe --type-at 3 23
```

The location query reports:

```text
checked expression type: Str
source: project/example.panack:3:21-3:28
expression: "typed"
reason: type retained from the checked expression
```

## When a call has the wrong type

Save this as `example.panack` in another folder:

```panack
pure takes_nat(value: Nat): Nat { value }
pure probe(): Nat { takes_nat("hello") }
main(): Void {}
```

Compilation fails because the call supplies a `Str` where `takes_nat` expects a `Nat`:

```text
$ panack compile example.panack -o example.bc
error: <path>/example.panack:2:21: argument 1 to takes_nat is Str, expected Nat
  2 | pure probe(): Nat { takes_nat("hello") }
    |                     ^
```

Ask Panack to explain the call:

```text
$ panack explain example.panack --function probe
```

The report identifies the argument and the types the checker compared:

```text
program: rejected
function: probe

call argument 1 to takes_nat: rejected
source: project/example.panack:2:31-2:38
expression: "hello"
actual type: Str
expected type: Nat
reason: the checked argument is incompatible with the expected type
```

The compiler diagnostic says the types don’t match. The explanation shows which argument was checked and what the checker found.

## Inspect a callback contract

For an array `map` callback, use:

```panack
pure probe(): [Str] { [1].map(@format) }
pure format(value: Nat): Str { "formatted" }
main(): Void {}
```

The report shows the callback type, expected parameter, and result requirement:

```text
array_map callback contract: accepted
callback type: PureFn[Nat,Str]
expected callback parameter types: [Nat]
callback result type: Str
expected callback result: any non-Void value
reason: the checker accepted the callback's purity, arity, parameter types and result constraint
```

`reduce` callback checks are covered too. Other callback operations aren’t covered yet.

## When an effect boundary passes or fails

An ordinary function can call `print`:

```panack
report(): Void {
  print(1);
}
main(): Void {
  report();
}
```

Compile and run it:

```text
$ panack compile example.panack -o example.bc
wrote example.bc

$ panack run example.panack
1
```

Ask Panack to explain `report`:

```text
$ panack explain example.panack --function report
```

The report shows:

```text
effect boundary: allowed
expression: print(1)
boundary: call
context: ordinary
callee: print
classification basis: builtin or constructor contract
callee effect: ordinary
awaited: no
reason: ordinary function permits this effectful call
```

Make `report` pure and the same call is rejected:

```panack
pure report(): Void {
  print(1);
}
main(): Void {}
```

Compilation reports:

```text
$ panack compile example.panack -o example.bc
error: <path>/example.panack:2:3: pure function cannot call impure function print
  2 |   print(1);
    |   ^
```

The explanation makes the boundary visible:

```text
effect boundary: rejected
expression: print(1)
boundary: call
context: pure
callee: print
classification basis: builtin or constructor contract
callee effect: ordinary
awaited: no
reason: pure function cannot call impure function print
```

The normal diagnostic appears alongside the extra detail, so the explanation adds context without replacing the compiler’s existing message.

## Why I think this approach is different

Other language tools expose useful compiler information in different forms. Rust’s `rustc --explain` gives a longer explanation keyed to a compiler error code ([1](https://doc.rust-lang.org/stable/rustc/command-line-arguments.html)). GHC provides low-level typechecker tracing ([2](https://downloads.haskell.org/ghc/latest/docs/users_guide/ghc.html)), and GHCi can query an inferred type at a source location ([3](https://downloads.haskell.org/ghc/9.14.1.20260728/docs/users_guide/ghci.html)).

I’m taking a different direction with Panack. I want one developer-facing, per-function explanation that brings selected decisions together across types, effects, and proofs. I want it to show not only why a check failed, but also why it passed, what checker facts supported the result, and where those facts came from. That combination is the part I think can become distinctive.

There isn’t yet an explanation for every type, effect, and proof decision made while checking a function. I’ll keep expanding the coverage, and I’ll improve the output too. The full report can be long, with sections that aren’t relevant to every function. I want to make it easier to scan while keeping the facts and source locations that make the explanations useful. The current scope and known limits are in the compiler explanation guide ([4](https://github.com/sproates/panackelty/blob/next/docs/COMPILER_EXPLANATIONS.md)) and the Panackelty README ([5](https://github.com/sproates/panackelty/blob/next/README.md#explain-checked-types-guarded-conversions-subtraction-and-effects)).

## The title

The title comes from “Double Life”, an advert for the original PlayStation that used the slogan “Do not underestimate the power of PlayStation”. In my opinion, it’s one of the most memorable and powerful adverts of all time. [Watch “Double Life” on YouTube](https://www.youtube.com/watch?v=QIW4HMl81hw) [6].

## References

1. [Rust compiler command-line documentation](https://doc.rust-lang.org/stable/rustc/command-line-arguments.html).
2. [GHC typechecker trace documentation](https://downloads.haskell.org/ghc/latest/docs/users_guide/ghc.html).
3. [GHCi `:type-at` documentation](https://downloads.haskell.org/ghc/9.14.1.20260728/docs/users_guide/ghci.html).
4. [Panackelty compiler explanation guide](https://github.com/sproates/panackelty/blob/next/docs/COMPILER_EXPLANATIONS.md).
5. [Panackelty README: explain checked types, guarded conversions, subtraction and effects](https://github.com/sproates/panackelty/blob/next/README.md#explain-checked-types-guarded-conversions-subtraction-and-effects).
6. [“Double Life” PlayStation advert](https://www.youtube.com/watch?v=QIW4HMl81hw).
