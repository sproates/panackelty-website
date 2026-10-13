---
title: What purity means in Panackelty
status: published
date: 2026-10-13
publishedAt: 2026-10-13T13:53:44+02:00
tags:
  - language
  - compiler
---

Imagine a function that reads a settings file and checks whether the values make sense. If the file changes, the same call can give a different answer, even though the function received the same filename. The contents changed, but they weren't passed in. The function has a dependency its arguments don't show.

Now read the file first and pass its contents to a validator. The validator can make its decision from the values it receives, without needing to know where they came from.

That's purity in practical terms. A pure function's result is determined by the values it receives, and it doesn't read or change state outside the call. Reading a file, checking the clock and printing are effects, because they reach beyond those values. Purity can make a function easier to test, reuse and reason about, but it doesn't mean every function in a program has to be pure.

There's a formal name for one consequence: **referential transparency**. When a pure call returns a value, you can replace the call with that value without changing the program's behaviour. You don't need to wonder whether evaluating the call also changed a file, printed a message or affected some later calculation.

Panackelty uses purity as an explicit boundary. The compiler's lexer is a useful example because it needs source text, but it doesn't need to fetch that text from disk itself.

## Make changing inputs visible

Suppose the lexer took a path and read the file before scanning it:

```panackelty
pure lex_path(path: Str): Result[[Token], [Diagnostic]] {
  lex_file(read_file(path), path)
}
```

Panackelty rejects this. `read_file` is effectful, and a pure function can't call it. The function's only argument is the path, but its answer also depends on the file's current contents. Change the file and the same call can produce different tokens.

Panackelty separates those jobs. The project loader reads the source, then passes the text and path to the lexer. The real lexer has this signature:

```panackelty
pub pure lex_file(source: Str, file: Str): Result[[Token], [Diagnostic]]
```

The path is still useful: the lexer puts it in source positions and diagnostics. It doesn't open the path. Its input is the source string it was given.

```text
path --effectful file read--> source text
source text + path --pure lex_file(...)--> tokens or diagnostics
```

A file it can't read is a loading problem; text with invalid tokens is a lexer problem. I can test the lexer with a string directly, without creating a temporary file or project. If a source file changes on disk, the loader has to read it again before the lexer sees the change.

The same split carries through the compiler. The effectful `load_project` follows imports and reads the source modules into a `LoadedProject`, an in-memory snapshot. The pure `prepare_project_program` takes that value and the project metadata, then produces a `Program` or diagnostics. The command driver handles environment settings, reports errors and writes output. I can test the project-building rules against a `LoadedProject` without doing file access in the middle of that work.

## Purity is a choice, not a rule for every function

Panackelty functions are effectful by default. You don't have to mark a function `pure`, and you can read a file and process it in one function if that fits your program. You do you.

The trade-off is that the function now has more than one job. Its result depends on both the arguments and the outside state it reads. A test of the scanning rules has to arrange the file as well, and a caller can't tell from an ordinary `Fn` whether it reads a file, prints a message or does something else. The effects may be several calls away from the code that needs to account for them.

I use `pure` where I want the separation to hold. If someone later adds a file read to `lex_file`, or calls another effectful function that eventually reads one, the compiler reports it. The annotation is a rule the compiler checks, rather than a comment asking the next person to be careful.

The same split can help outside a compiler. Read a service's configuration once, then pass the resulting values to a pure validator. The validator can be tested with the values you choose; separate tests can check how configuration is loaded. The point isn't that every application should be built this way. It's that the part applying rules doesn't need to know where its data came from.

## Pure doesn't mean immutable

The lexer moves a cursor as it scans. One of its helpers is pure even though it changes a local variable:

```panackelty
pure scan_digits(source: Str, start: Nat): Nat {
  mut cursor: Nat = start

  while cursor < len(source) && is_digit(source[cursor]) {
    cursor = cursor + 1
  }

  cursor
}
```

The cursor changes, but only inside the call. The source string and the caller's values stay as they were. Panackelty allows local mutation in pure functions; it doesn't allow those functions to use that mutation to change state outside the call.

Purity and immutability are related, but they're different ideas. Panackelty's arrays, maps and sets are immutable values: an operation that adds an item returns a new collection. But a pure function can still use local variables, assignments and loops. What matters is whether it can reach outside its inputs and result to read or change state.

## What purity does not tell us

Purity doesn't tell us whether a function is correct. `scan_digits` could contain a bug and stop at the wrong character. A pure function can also run forever or trap. Referential transparency describes the behaviour of an expression that returns; it doesn't prove the logic is right or that every call will finish. Purity makes the function's relationship with outside state predictable, not its answer infallible.

Nor does purity make an input fresh or trustworthy. Once the loader has read a file, the lexer works with that snapshot. If someone edits the file afterwards, the lexer won't notice until the loader reads it again. And if the text is malformed, the lexer still needs to report that. In Panackelty it returns either tokens or diagnostics in a `Result`.

## How Panackelty enforces purity

When I declare a function `pure`, Panackelty checks that its calls are pure too. File and terminal I/O and clock-reading built-ins are effectful, so pure code can't call them.

Callable types carry the distinction too: `PureFn`, `Fn` and `AsyncFn`. A `PureFn` can be used where the matching `Fn` is expected, but an `Fn` can't be used where a `PureFn` is required. That matters for array `map` and `reduce`, whose callbacks must be pure. Mapping a collection can't unexpectedly print something or read a file.

The compiler checks the source, and Panackelty checks compiled bytecode as well. Bytecode records whether functions are pure, and the verifier checks calls between them. With an indirect call, the target may only become clear when the program runs, so the VM checks its effect at that point too. That keeps the boundary in place even when a function value hides which function will be called.

Native built-ins need an effect classification as well. They're implemented in C, so the compiler can't inspect their implementation to find out whether they perform I/O. The compiler and VM rely on each built-in's declared effect, which makes that declaration part of the trusted boundary. It needs to be accurate.

Other languages draw this line differently. Haskell represents input/output actions with the `IO` type; Panackelty classifies functions as pure, effectful or async. The details differ, but in both cases effects are part of how you reason about a program.

For me, the useful part is being able to hand the compiler a `LoadedProject`, test how it processes that exact snapshot, and keep file access out of those pure stages.

## Further reading

- [Panackelty project driver](https://github.com/sproates/panackelty/blob/main/src/compiler/driver.panack)
- [Panackelty project loader](https://github.com/sproates/panackelty/blob/main/src/compiler/loader.panack)
- [Panackelty lexer](https://github.com/sproates/panackelty/blob/main/src/compiler/lexer.panack)
- [Panackelty pure compiler frontend](https://github.com/sproates/panackelty/blob/main/src/compiler/project_frontend.panack)
- [Panackelty language specification](https://github.com/sproates/panackelty/blob/main/SPEC.md)
- [The Haskell 2010 Report](https://www.haskell.org/onlinereport/haskell2010/)
- [Philip Wadler, “The Essence of Functional Programming”](https://doi.org/10.1145/143165.143169)
