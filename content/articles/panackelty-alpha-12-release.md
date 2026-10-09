---
title: Panackelty alpha.12 release
status: published
date: 2026-10-09
tags:
  - releases
  - language
  - compiler
---

The next planned release of Panackelty is called alpha.12.

It has three main features: chained `else if` conditions, source coverage for Panackelty code, and namespaces for organising code across files.

I’m working on it. There’s no release date yet, but there will be one soon.

## New workflow

Since I released alpha.11, I’ve been developing alpha.12 on a branch called `next`. This approach keeps the release’s changes together while they’re still in progress. My aim is to merge that work back into `main` in one pull request when it’s all ready to be released.

I’ve continued updating the roadmap on `main`.

## Longer conditional chains

Panackelty already supports `if` and `else`, but not `else if`. In hindsight, that feels like a big oversight that should have been addressed earlier. I’m adding `else if` so a chain of alternatives can be written directly:

```panackelty
pure classify(value: Nat): Str {
  if value == 0 {
    "zero"
  } else if value == 1 {
    "one"
  } else if value == 2 {
    "two"
  } else {
    "many"
  }
}
```

The conditions are checked in order. Once one condition is true, its body runs and the later conditions are skipped. The final `else` is optional, but that choice matters when the chain produces a value. If there isn’t a final `else` block, there may be no value to return. When the result is used, the compiler also checks that the branches produce compatible types.

The compiler still has to get the type and effect checks right. It also has to preserve source locations and behave the same whether the program runs from source (`.panack` files) or saved bytecode (`.bc` files).

## Measuring Panackelty source coverage

Panackelty already publishes coverage reports for its VM, which is written in C. For alpha.12, I’m adding a separate report for Panackelty source code.

The report will measure the compiler, bytecode tools and the standard library during test runs. It will show which functions and expressions ran, which outcomes the tests reached in each conditional, and which source files and test scenarios it covers.

Coverage shows what these test runs reached. It doesn’t tell me whether the whole test suite ran, whether every possible behaviour was covered, or whether the assertions are any good. If some code can’t be measured, the report needs to say so instead of quietly counting it as uncovered.

## Namespaces

Programs spread across several files need a way to say which function or type belongs where. Otherwise, separate files could introduce names that clash, and it becomes harder to see what each file makes available to the rest of the program or indeed other programs.

Namespaces are a way to give declarations distinct identities. Imports look like this:

```
import project/src/user
```

Modules that export public definitions look like this:

```
pub record User {
    id: Int
}
```

A program can then refer to the declaration it really meant, even when another module declares something with the same name. The compiler needs to preserve identities through type checking, code generation, source loading and saved bytecode.

The tricky part here is that Panackelty’s compiler is written in Panackelty. I use a seed (a previously built copy of the compiler). The seed was built before namespaces existed, so it can’t compile a new compiler whose own source code already uses namespaces.

I tackle changes like this in stages. I use the seed to build a new compiler that can tell modules apart and resolve imports. I keep the new compiler’s source in syntax the seed understands, so the seed can still compile it.

Then I check that each new build of the compiler produces the same bytecode as the previous build.

The last step is to move the compiler, its build and test tooling, and libraries over to namespaces. I then repeat that rebuild check using the migrated source.
