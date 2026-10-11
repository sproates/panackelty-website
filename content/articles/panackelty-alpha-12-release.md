---
title: Panackelty alpha.12 release
status: published
date: 2026-10-09
tags:
  - releases
  - language
  - compiler
  - LLM
---

*Updated 2026-10-11: alpha.12 has been released.* The downloadable native
preview adds chained `else if` conditions, executable file-based namespaces and
opt-in source coverage for Panackelty code. [Get alpha.12](/get-started/),
read the [release notes](https://github.com/sproates/panackelty/releases/tag/v0.1.0-alpha.12),
or browse the [coverage reports](https://coverage.panackelty.com/).

## New workflow

Alpha.12 was developed on the `next` branch and merged to `main` once its
release checks passed. The release keeps the existing v9 bytecode format. The
native toolchain is available for Linux x86-64 and Apple silicon; the browser
playground remains separately pinned and does not yet share every native feature.

## Longer conditional chains

Panackelty now supports `else if` chains with multiple conditions and an
optional final `else`:

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

Conditions are evaluated in order. After the first true condition, later
conditions are skipped. When a conditional produces a value, the compiler checks
that its branches produce compatible types; omitting the final `else` can leave
no value on some path.

## Measuring Panackelty source coverage

Alpha.12 adds inventory, collection, aggregation and reporting commands for
Panackelty source. The verified baseline covers 43 tracked compiler, bytecode
and standard-library source files across an explicit root set. Coverage records
what those test runs reached; it does not mean every test ran, every behaviour
was exercised or assertions are sufficient. The [coverage reports](https://coverage.panackelty.com/)
show source revisions and measured scope separately from the native C VM report.

## Namespaces

File-based namespaces let a program import a module explicitly, for example
`project/src/user`, and give declarations stable, distinct identities across
modules. The release supports `project/` and `stdlib/` imports, aliases, selected
imports, qualified names, public declarations and re-exports. Source execution
and saved-v9 bytecode run the selected entry module only. Imports stay within the
entry module's tree and active toolchain; packages and remote dependencies are
not included. Unsupported or deferred body checks reject instead of emitting an
unchecked program.

The compiler is itself written in Panackelty, so namespace support also had to
work through source loading, checking, code generation, bytecode and the seeded
rebuild process. The staged implementation let the pre-namespace compiler seed
build an intermediate compiler before the migrated compiler rebuilt itself.

## Beyond LLM capabilities

The implementation required settling how imports identify modules, how the
compiler preserves declaration identities, what bytecode must retain and how a
compiler seed predating namespaces can bootstrap the change. An LLM can help
with bounded implementation and checking tasks, but those decisions and the
cross-toolchain acceptance evidence still need an explicit design and review.
