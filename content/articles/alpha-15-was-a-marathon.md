---
title: Alpha 15 was a marathon
summary: Alpha.15 may not look like the most exciting release, but packages, richer guarded types, compiler explanations and faster development feedback took a lot of connected work.
status: published
date: 2026-11-06
tags:
  - releases
  - packages
  - compiler
  - development
---

Well, that was a lot of work.

It may not look like the most exciting release, but alpha.15 was incredibly hard work. There isn't one screenshot that explains it. A lot of the change is in how Panackelty handles projects, how precisely I can describe data, and how much of the compiler's work I can inspect.

That can sound like a collection of separate technical jobs. In practice, they all affect the same thing: how much confidence I can have in a program, and how much useful information Panackelty can give me while I build one.

## A project needs to hold together when it moves

The package work gives a project a way to declare and restore its dependencies. A dependency can be a local folder, a local archive, an HTTPS archive or a Git source pinned to a commit. The lockfile records the resolved graph, so ordinary locked checks, compilation and runs use the sources already selected for the project.

That sounds like package plumbing, and a lot of it is. But getting it right means working through what happens when a project is moved, when an archive is missing or corrupt, when a Git reference changes, or when the network is unavailable. The installed toolchain has to handle those cases clearly too.

This doesn't add a public package registry or package publishing. It gives projects a careful way to describe where dependencies come from and reproduce that choice. For an early language, that is a useful thing to have in place before a package ecosystem grows around it.

## A type can describe more than its basic shape

Alpha.15 also extends guarded types. A type can describe rules about a string, the size of a collection, or the relationship between fields in a record.

For example, the release includes a small [dispatch program](https://github.com/sproates/panackelty/blob/main/examples/validated_dispatch.panack). It takes a configuration with a queue and a retry window, then handles request labels. Before accepting a request, it checks that the retry window is valid and that the label contains non-blank text, is between one and eighty characters, and has no control characters. The retry window has its own rule: the first delay must be no greater than the last. These are the sorts of checks that might otherwise be repeated around a program or left for a comment to explain.

When the compiler can prove a value meets its guard, the program can use that type directly. When the value comes from runtime input, `validate[Label](raw_label)` returns a `Result`. The caller decides what to do with an invalid label, and the validation error can report each failed rule without printing or keeping the original input for you.

That is more expressive than checking whether a port number is between two bounds. It lets a type carry part of the meaning of the data, and it gives the compiler work to explain.

## I can ask what the compiler did

That last point connects to `panack explain`. The interactive tool lets me inspect a function's checked statements, see what the compiler required and why, and follow the source evidence behind a decision. It also shows which instructions came from which source constructs, including instructions generated while compiling the program.

This became especially important as guarded types gained more rules. It isn't enough for a new check to accept the right program and reject the wrong one. I also want to know that the compiler can explain that check, and that the generated instructions still point back to the source that led to them.

I checked the explanation and source-origin work against real Panackelty projects, including the compiler and package manager. That made this more than a neat view of one small example. The tool had to cope with programs much larger and more complicated than the examples I use to introduce a feature.

I'll follow this with another article shortly, showing what the new `panack explain` looks like and going into it in more detail.

## Faster feedback without skipping the checks

Some of the work went into speeding up the development loop. The compiler test harness now prepares shared suite inputs once, while the tests themselves still run afresh. The coverage collector can reuse a validated preparation plan between matching runs, but it still runs every selected test with new sessions and counters and writes a new report.

At the time of writing, the measured clean full validation was 16.1% faster, and checks after a small compiler edit were 20.05% faster. For coverage, a hosted collection fell from 30 minutes and 22 seconds to 3 minutes and 35 seconds, with all 31 test sessions still run. These are results from the accepted workloads and machines, not promises about every future run or about Panackelty program speed.

The coverage result is a good example of the sort of detail that mattered throughout alpha.15. Reusing work is useful only if a change to the compiler, a test or its dependencies invalidates the right things. Faster feedback is worth having, but I still need the same evidence that the tests passed against the current source.

## Some good work ends with leaving things alone

I also traced the compiler's dependency on its standard library across 42 source files and five representative changes. The recommendation was to keep the existing source organisation. That isn't a dramatic release feature, but it gives us evidence for the decision and a clearer boundary for later work.

Not every investigation needs to end in a refactor. Sometimes the useful result is knowing what the current design actually depends on, and not taking on a larger change without a reason.

There is a lot in alpha.15 that won't jump out from a short list of release notes. But projects can now carry their dependency choices with them; types can say more about the data they represent; and I can inspect more of what the compiler checked and produced. Alongside the faster feedback, that is a substantial change to how I can develop and understand Panackelty.

It may not be the release with the flashiest headline. It was still a lot of work, and I think the result is worth explaining properly.
