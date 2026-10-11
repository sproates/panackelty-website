---
title: What does panack explain actually explain?
status: draft
tags:
  - compiler
  - tooling
---

A compiler can reject a program with a useful error and still leave you wondering why a particular expression passed or failed. Panackelty’s `panack explain` command is meant to make some of those compiler decisions easier to inspect.

**Version note:** This article describes `panack explain` as of Panackelty alpha.12. The feature will be expanded in alpha.13; details TBC.

The command currently doesn't explain every type rule or tell you what will happen when the program runs. It will never prove a whole program correct. Its query reports evidence for two specific checks:

- natural-number subtraction;
- local effect checks at calls and `await` expressions.

## Ask about one function

Give the command a source file and the function you want to inspect:

```sh
panack explain example.panack --function remaining
```

Panackelty checks the loaded project with its usual resolver, type checker and purity checks. The command then shows supported evidence for the selected function, alongside the result for the whole project.

It reads source code, but it doesn't execute the program, emit bytecode or write files.

## Why was this subtraction accepted?

Panackelty’s `Nat` type represents non-negative integers. Subtraction is safe only when the compiler can prove that the result won't be negative. A guard can establish the required lower bound:

```panackelty
pure remaining(n: Nat): Nat {
  if n >= 2 { n - 2 } else { 0 }
}
```

For `n - 2`, the explanation shows the constant being subtracted, the lower bound it has for `n`, and the true branch of `n >= 2` that provides the evidence. It also gives source locations for the subtraction and the guard.

Change the expression to `n - 3` and that lower bound is no longer enough. The checker reports the obligation as unproved. It hasn't run the program and found a negative result; it couldn't establish safety from the facts available to it.

The rules are deliberately limited. The explanation shows the checker's evidence. It doesn't run a separate theorem prover, invent assumptions or suggest a repair, so an expression that is mathematically safe may still be outside the supported proof rules.

## Where is this call allowed?

The command also shows the effect checker's decision at an individual call or `await` boundary. For example, a call to `print` inside a `pure` function is rejected because `print` is effectful. The explanation shows the function's mode, how the callee is classified and why that boundary passed or failed.

An allowed boundary is a local result: that call or `await` passed its effect rule. It says nothing about whether every argument, another call or the whole program is valid. Panackelty checks each nested call separately.

This matters when effects cross function boundaries. Panackelty classifies a call from the declaration or callable type visible at that call site. It doesn't inspect every callee body for a later file write, network operation or other I/O. The explanation also can't tell you which branch will run at runtime.

## Read the whole-project status separately

The output includes `program: accepted` or `program: rejected`. This is the result of checking the complete loaded project. A local subtraction proof or an allowed call boundary can't override an unrelated type error, purity failure or other diagnostic.

A rejected project can still have valid local effect evidence for a separately type-valid function. The command keeps the usual diagnostics and exit status.

## Further reading

For the exact output contract and limitations, see the [compiler explanation guide](https://github.com/sproates/panackelty/blob/main/docs/COMPILER_EXPLANATIONS.md) and the [README example](https://github.com/sproates/panackelty/blob/main/README.md#explain-subtraction-and-effect-checks).
