---
title: A deep dive into the Panackelty VM
status: published
date: 2026-10-13
publishedAt: 2026-10-13T15:08:04+02:00
tags:
  - vm
  - compiler
  - language
---

If a compiler turns `2 + 3` into a few instructions, something still has to run them. It needs to know where the numbers are, what `+` does, and where to put the answer. A virtual machine provides that machinery.

The phrase also gets used for software that models an entire computer, down to its processor and devices. A language VM has a narrower job: it runs one programming language's instructions according to defined rules.

In Panackelty, the compiler emits bytecode and the VM executes it. Looking at how it runs that bytecode gives us a concrete example of the questions every VM has to answer.

## A machine needs rules for every instruction

The compiler and VM must agree on more than the instruction names. The VM's contract describes what values an instruction uses, how control moves through a program and what happens if execution fails. If `BINARY +` consumes two values, the contract needs to say which values and what result it can produce. A function call needs rules for passing arguments and returning a value; calls into the host need rules too.

## Different VMs make different trade-offs

The contract and the implementation are different things. Some VMs interpret each instruction; others compile code before it runs or while it is running. Those approaches change startup time, execution speed and implementation effort, while the VM's instruction rules stay the same.

The Java Virtual Machine (JVM) makes a useful comparison because it shares one design choice with Panackelty. Both use an operand stack inside each call frame, with local variables alongside it. When a method returns a value, it goes onto the caller's stack. The details differ, but the shape will look familiar.

They differ in what they verify. For modern class files, stack-map frames record the types expected at points in a method. The JVM verifier checks instructions against those types before the method runs, catching problems such as stack underflow or passing the wrong kind of value to an instruction.

Panackelty's verifier checks bytecode structure, call targets and effect rules, but doesn't prove the operand stack's types along every path. The VM catches those stack problems while instructions run. I'll come back to that split later.

WebAssembly makes a different trade-off. It also uses an operand stack, but its control flow is built from nested `block`, `loop` and `if` instructions. A branch targets one of those enclosing constructs rather than any instruction offset. Validation checks operand types and stack effects before a module can be instantiated.

Panackelty bytecode uses explicit branch targets. Its verifier checks that each target is valid, then the VM catches invalid stack behaviour during execution. The JVM, WebAssembly and Panackelty therefore put different work into validation and execution.

The specifications also leave different choices to implementors. The JVM doesn't prescribe a memory layout, garbage collector or native-code strategy. Panackelty's current C VM uses tagged values and reference counts. Those details matter when building a VM, but bytecode portability still depends on compatible host services: it can't make two filesystems or network services behave identically.

## Untrusted bytecode needs checking before it runs

Panackelty has two ways to get bytecode to its C11 interpreter. When I run a source file, the compiler produces bytecode in memory and passes it straight to the VM. Panackelty source is compiled to bytecode, not native instructions for the processor.

A saved `.bc` file starts elsewhere: the VM decodes it and verifies its structure before execution. After that, both routes use the same bytecode engine.

![A Panackelty source file is compiled to bytecode in memory, while a saved bytecode file is decoded and verified. Both routes lead to the same C11 VM.](/images/panackelty-vm-architecture.svg)

Saved bytecode can come from outside the current compiler run. The VM doesn't assume the file is trustworthy; it checks its structure before executing it. Those checks don't prove every program is valid or safe, but they give the VM a clear boundary between decoding an artifact and running its instructions.

## Each instruction needs access to its inputs

Panackelty bytecode is stack-based. Most instructions take their inputs from the top of an operand stack and push a result back. For `2 + 3`, the important part of the disassembly looks like this:

```text
FUNCTION|main|impure|
0|CONST|Nat:2
1|CONST|Nat:3
2|BINARY|+
```

After the first instruction, the stack contains `Nat:2`. After the second, it contains `Nat:2, Nat:3`. `BINARY|+` consumes those two values and pushes `Nat:5`.

The compiler doesn't need to give every intermediate value a named register. The next instruction finds its inputs at the top of the stack, which makes this small sequence easy to follow in a disassembly. The trade-off is that the compiler, verifier and VM all need to agree about what each instruction takes from the stack and what it leaves there.

A register-based VM puts those inputs directly into each instruction. That can reduce some stack traffic, but the compiler has to choose registers and the bytecode has to encode them. Neither design wins in every case. The stack model gives Panackelty a straightforward instruction stream that I can inspect one operation at a time.

The instruction set includes constants, local loads and stores, arithmetic, branches, loops, collection construction, calls and returns. Short-circuit Boolean operators use jumps, so the right side can be skipped when its result won't affect the answer. Printing is a runtime call rather than a special VM instruction. That distinction keeps the machine's general instruction set separate from services the host provides.

## A call needs somewhere to pause

When one function calls another, the caller has to wait while the callee runs. The VM needs to keep enough state to return to the right place with the right values. Panackelty stores that state in a call frame.

Each frame holds the function being run, the position of its next instruction, its local bindings and its operand stack. A call consumes arguments from the caller's stack and starts a new frame with those values bound to the callee's parameters.

Consider `main` calling this function with `21`:

```panackelty
pure twice(value: Nat): Nat {
  value * 2
}
```

The new frame starts with `value` set to `Nat:21`. `LOAD value` pushes it onto the operand stack. `CONST Nat:2` pushes the multiplier. `BINARY *` consumes both and pushes `Nat:42`. Finally, `RETURN` takes that result out of the callee frame, releases its locals and temporary values, and pushes `Nat:42` onto the waiting caller's stack.

In the C implementation, frames live in an array managed by the VM. Calling a Panackelty function doesn't make a recursive C call. The instruction dispatcher advances the program counter and handles each operation; a user function call adds a frame, while a built-in follows its runtime path.

That keeps the language's call depth in VM-managed memory instead of the native C call stack. It also lets an execution advance by an instruction budget and keep its frames between advances. The command-line runner uses the same dispatcher until the program completes or traps. A budget limits how many instructions the dispatcher starts; it doesn't limit the time taken by one exact arithmetic operation, an allocation, cleanup or a host callback. It isn't a real-time guarantee or a resource sandbox.

## Runtime values need clear ownership

The VM represents runtime values as tagged objects. The tag says whether a value is a `Nat`, `Str`, array, record or another source-level kind, and the rest of the object stores its data. The tag lets the runtime check an operation even though ordinary source programs have already passed type checking.

For Panackelty's exact numeric types, the representation is part of how the VM carries out the language's arithmetic rules. `Nat` and `Int` use arbitrary-precision integers stored in base-1,000,000,000 limbs. `Dec` stores a decimal coefficient and a base-10 exponent. `Rat` stores a reduced numerator and a positive denominator. Integer `/` produces an exact rational; decimal division traps when the exact answer has a repeating decimal expansion.

Strings store UTF-8 bytes, a code point count and a flag recording whether the contents are ASCII. That extra metadata lets some string operations avoid scanning the bytes again, while the language still measures and indexes strings by code point.

Collections are immutable. An operation that looks like an update returns a new collection value and leaves the old one unchanged. In the C VM, heap values use reference counts. Stack slots, locals, arguments and collection elements each own references. Moving or discarding a value means transferring or releasing the reference, and the object is freed once its final reference is gone.

Because source values can't form ownership cycles through mutable references, reference counting can reclaim the value graph without a tracing garbage collector. The trade-off is that the C code has to release exactly the references it owns on every success and failure path. If building a call frame runs out of memory halfway through, for example, it still has to release the locals already installed.

`Unit` and `Void` show why the tag matters. `Unit` is the successful value when an operation has no data to return. In `Result[Unit, HostError]`, for example, success still contains a value: `Unit`. `Void` is an internal marker for the absence of a source-level result. They need different tags because success with no data and no value are different states.

## Checking bytecode and running it answer different questions

Before running a saved bytecode file, the VM checks its structure. It checks instruction and operand forms, constants, function entries, branch targets, call targets and argument counts. It also checks effect edges, so code marked pure can't call code marked effectful.

That is structural and call-contract checking, not a second source type checker. The bytecode format doesn't preserve all the source type information, and the verifier doesn't reconstruct parameter and result types or prove the stack's types along every path. A file can pass verification and still reach a dynamic error. The VM checks conditions such as stack underflow, an uninitialised local, an invalid index or natural-number underflow, then traps if an operation is invalid.

Indirect calls make the split clear. If code calls a function value, the verifier might not know which function will be there at runtime. The VM checks the actual target, its argument count and its effect classification when that call runs. Verification can check what is knowable from the file; execution checks what depends on the value that arrives.

These checks don't turn the VM into a security sandbox. File, terminal, process, clock and network operations cross through host services. The VM makes that boundary visible, but the host decides which services a program can use and what they allow.

## A saved program needs a versioned meaning

Source code is written for people to read. A saved `.bc` file is a binary artifact for the VM. Every file starts with the nine bytes `PANACKBC\0`, followed by a two-byte, big-endian version number. At the time of writing, that number is 9. The marker identifies a Panackelty bytecode file; the version tells the decoder which layout and instruction meanings to expect.

Consider a program with one function:

```panackelty
main(): Nat {
  2 + 3
}
```

Here is its actual version-9 encoding. Each pair is one hexadecimal byte. The comments identify the fields:

```text
50 41 4e 41 43 4b 42 43 00  # magic: PANACKBC\0
00 09                       # version 9
00 01                       # one function
00 04 6d 61 69 6e           # function name: "main"
00                          # ordinary function flag
00                          # no parameters
00 00 00 04                 # four instructions
00 00 00 01 02              # CONST Nat:2
00 00 00 01 03              # CONST Nat:3
05 00                       # BINARY +
14                          # RETURN
```

The function name has a two-byte length followed by UTF-8 bytes, so `00 04` says that the next four bytes spell `main`. Multi-byte numbers are big-endian, with the most significant byte first. The instruction count takes four bytes. Each instruction starts with an opcode: `00` means `CONST`, `05` means `BINARY`, and `14` means `RETURN`.

Read the first constant as `00` (`CONST`), `00` (the `Nat` tag), `00 01` (a one-byte magnitude), then `02` (the value two). The next constant uses the same encoding for `3`. `BINARY` then uses `00` to mean `+`.

That is the bytecode itself, not a text listing. `panack disasm` turns the instructions back into readable lines, which is why the earlier example showed `CONST`, `CONST` and `BINARY +`. The decoder also checks the file before the verifier checks its structure. For instance, it rejects a truncated instruction, an unknown opcode or extra bytes after the program.

The file stores parameter names and effect flags, but not the source types for each parameter or result. The source compiler has already checked those types. The bytecode verifier checks the structure and call rules it can establish from the file; the VM checks dynamic conditions such as operand types and stack underflow during execution.

The encoding is canonical: function records are sorted by Unicode name, and each number has one minimal representation. Given the same compiler version and dependencies, compiling the same source can produce byte-for-byte identical artifacts. That gives me a stable file to compare between builds. Malformed-input cases exercise the decoder and verifier.

Versioning matters because an opcode can change or take on a new meaning. Without a version boundary, an older file might still look readable while doing something different from what its compiler intended. Panackelty doesn't promise compatibility across alpha releases, so the safe approach when the bytecode version changes is to compile the source again with the matching toolchain.

## What do we gain from an interpreter?

Panackelty uses one interpreter for bytecode compiled from source and bytecode loaded from a file. That gives me an execution path I can inspect, but every instruction still goes through dispatch, so the design doesn't promise native-code performance. Reference ownership and verification need careful handling too. The host still decides what services programs can use.

I find that a useful trade-off. If a program surprises me, I can follow the instructions it ran and see what the VM did with them.

## Further reading

- [Panackelty VM execution guide](https://github.com/sproates/panackelty/blob/main/src/vm/README.md)
- [Panackelty bytecode format](https://github.com/sproates/panackelty/blob/main/src/bytecode/FORMAT.md)
- [The Java Virtual Machine Specification, Chapter 2](https://docs.oracle.com/javase/specs/jvms/se26/html/jvms-2.html)
- [The JVM's verification rules](https://docs.oracle.com/javase/specs/jvms/se26/html/jvms-4.html#jvms-4.10)
- [WebAssembly Core Specification](https://webassembly.github.io/spec/core/)
