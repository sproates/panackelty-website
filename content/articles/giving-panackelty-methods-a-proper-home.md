---
title: Giving Panackelty methods a proper home
status: published
date: 2026-10-19
publishedAt: 2026-10-19T15:39:10+02:00
tags:
  - language design
  - compiler
  - alpha.14
---
Panackelty’s early use of global functions and receiver-call sugar was a deliberate choice. I needed to get the language moving, build useful programs and establish a working compiler and runtime. A relatively simple function model provided a practical foundation without making a complete method system a prerequisite for everything else.

That choice has served its purpose. The language and libraries have developed far enough to show where the model becomes restrictive, and there’s now enough working infrastructure to replace it carefully.

The next step is to give methods explicit ownership, so the compiler knows which type a method belongs to and resolves calls through that identity.

Early receiver syntax provided a convenient way to write operations around a value. Conceptually, a call such as:

```text
value.operation(argument)
```

could be treated as a call to a function with the receiver passed as an argument:

```text
operation(value, argument)
```

That makes useful syntax available with relatively little machinery. Functions provide the implementation, and the compiler supplies the convenience at the call site. For an early language, it lets several parts of the system develop together without waiting for every detail of method ownership, visibility and generic inference to be settled.

But the syntax creates an expectation. When someone writes `value.operation()`, they naturally expect the type of `value` to determine which operation they mean.

As the libraries grow, that expectation needs to become an explicit language rule.

Consider a server and a map. Both might reasonably have operations called `get` and `put`, but those names describe quite different things. A map retrieves or stores values. An HTTP server registers routes and handlers. The server may even use a map internally.

Those APIs need to coexist without their names interfering with one another. A server’s implementation details shouldn’t affect how the compiler resolves its public methods, and adding another library with a familiar method name shouldn’t change the meaning of an existing call.

With type-owned dispatch, the compiler starts from the receiver’s checked type and looks for a method belonging to that owner. The selected declaration supplies the parameter types, result type, visibility and effect requirements. If the owner has no such method, the compiler reports an error. It doesn’t search for an unrelated global function that happens to have the same name.

This gives library authors a firmer basis for designing APIs. Names can describe the operation naturally, because their meaning is scoped by ownership.

It also makes the compiler’s responsibilities clearer. Generic methods need to infer their arguments consistently from the receiver, the supplied arguments and the expected result. Private methods need to remain private across imports. A type imported through an alias must retain its identity. Calls involving pure or asynchronous code must preserve the language’s effect rules.

Those contracts need to agree throughout parsing, checking and code generation.

Built-in types need the same discipline. Maps, sets, arrays, strings and bytes shouldn’t acquire their behaviour through an expanding collection of exceptions based on method names. Their methods need checked owners too, with a clear boundary around who can define them.

That boundary is part of the work just completed on the `next` branch, which is where the alpha.14 release is being worked on. The compiler now distinguishes built-in owners from ordinary nominal declarations and restricts built-in implementations to the designated toolchain core module. Naming a user package `toolchain`, or putting declarations in a file called `core.panack`, doesn’t grant it those privileges.

I’m making this change in stages because Panackelty’s compiler is itself written in Panackelty. Changes to the language have to preserve a working route from the existing compiler seed to the next compiler. Each stage needs evidence that successive compiler builds reproduce the same result, alongside tests that run real programs through both source and saved bytecode.

During that transition, arrow calls make the new dispatch path explicit:

```text
receiver->method(argument)
```

The arrow is temporary migration syntax. Existing dot calls still use the earlier receiver sugar, so changing their meaning immediately would force the libraries and the compiler’s own source to move together. Using `->` lets a call explicitly opt into the new ownership rules while existing code continues to work. Each API and its callers can then be migrated and tested in stages, including checking that a missing method produces an error rather than falling back to a global function.

Once that migration is complete, dot calls will use the new dispatch rules and arrow syntax will be removed. The final language will have one method-call syntax, backed by explicit ownership.

The foundations are now in place on `next`. The remaining work is to carry those ownership rules through built-in operations, libraries and the compiler itself, while preserving the checks around callable types, purity and asynchronous code.

The new method dispatch will be available in alpha.14, alongside an HTTP server framework. The two fit together: the framework needs server methods such as `get` and `put` to coexist naturally with collection APIs, with the compiler checking their different signatures and asynchronous handlers.

The earlier model made it possible to build the system that now supports this work. There’s a working compiler, a growing set of libraries and a body of tests against which the stronger rules can be established and existing code carried across. Alpha.14 will put that foundation to use in a framework for building HTTP services.
