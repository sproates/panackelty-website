---
title: How Panackelty measures its own source coverage
status: draft
tags:
  - testing
  - compiler
  - coverage
---

# How Panackelty measures its own source coverage

A coverage report tries to answer a straightforward question: which parts of a program ran while a particular set of tests was running?

For Panackelty, the question has an unusual extra step. Its compiler is self-hosted: it is written in Panackelty, the language it compiles. The compiler and standard library can therefore be measured as `.panack` source by Panackelty's own compiler and virtual machine.

That makes for a useful engineering tool, but it also creates room for misleading numbers. A percentage is only meaningful if the report can explain what was eligible to count, which executions it observed, and what it could not establish. This article explains how Panackelty handles those questions, what its current source report covers, and what the figures can and cannot tell you.

The details here come from a compiler project, with its own bytecode, virtual machine and bootstrap process. Most projects do not need that machinery. The useful ideas are more general: define the code and tests a report represents, make gaps in the evidence visible, and treat coverage as a guide for testing rather than a verdict on quality.

## Coverage is evidence that code ran

Coverage is not a verdict on the quality of a test suite. It records execution. Assertions and other checks tell us whether the program returned the right result.

Suppose a function handles positive and non-positive values:

```panack
pure classify(value: Nat): Str {
  if value >= 10 {
    "large"
  } else {
    "small"
  }
}
```

A test that calls `classify(12)` shows that the function ran, that the condition was evaluated, and that the true outcome was taken. It says nothing about the false outcome. A test could also execute both outcomes without checking that either returned the right text.

Coverage helps answer “did this path run?” It cannot answer “did the test notice if the path was wrong?” That second question needs an assertion, a checked transcript, a mutation check, or another piece of behavioural evidence.

## Why measure Panackelty source?

Native C coverage already measures parts of the virtual machine and host implementation. That is a different report from coverage of the compiler and standard library written in `.panack`.

The source report makes activity in that self-hosted code easier to see. It can show, for example, whether a compiler error path ran, whether both sides of a standard-library condition were exercised, or whether a function was never reached by the measured tests.

It also gives maintainers a way to ask better follow-up questions. If an important source outcome has no observed hit, is there a missing test? Is the code genuinely unreachable? Was the test left out of the measured corpus? Or did the collector fail to connect execution to source? Those possibilities need different answers, so the reporting system keeps them distinct.

## First define what could count

Before tests run, Panackelty builds a source inventory: a map of eligible source items and their locations. The inventory is created from parsed source before the compiler lowers that source into bytecode.

That timing matters. One `if` in a Panackelty program may become several bytecode instructions. Counting those instructions would measure details of the compiler's implementation, not the decision the programmer wrote. The inventory instead records source-level items such as functions, expressions, statements, decisions and their possible outcomes.

The inventory includes functions even when no test calls them. Otherwise, unused production code could disappear from the denominator and make the measured percentage look better. It also records explicit exclusions. Imports, type declarations, record and enum declarations, and compile-time refinement checks do not execute as runtime source, so the report lists them with reasons rather than pretending they were uncovered.

The inventory is not itself a coverage report. It describes what could be measured. Execution evidence is collected separately.

### What the source measures mean

Panackelty reports three views, each with a different denominator:

- **Lines** are unique source lines where an eligible expression or statement starts. They are not every line spanned by a multi-line expression. Function headers, punctuation and excluded declarations do not create executable lines.
- **Functions** are original source declarations, including functions that were never entered. Generic functions keep one source identity even when callers use different type arguments.
- **Source outcomes** are choices written in the source: the true or false side of an `if`, evaluating or skipping the right side of `&&` or `||`, entering or leaving a loop, and selecting a `match` arm. They are not incidental branches introduced while lowering code for the VM.

For example, if only the true side of `classify` runs, its function can count as reached while its false source outcome remains a known zero. If an expression spans several lines, reaching its starting line does not claim that every line in the span ran.

## How an execution becomes a source observation

The collection process has several pieces. Each does a limited job:

1. **Inventory the source.** The compiler identifies eligible items and their structural source locations for each declared test root.
2. **Register the executions.** A coverage session records the compiled programs and inventories that may run, including supported nested VM or child-process executions.
3. **Collect counters.** When coverage is enabled, the native VM records observations as instructions and functions run. Ordinary execution does not allocate coverage counters or write coverage files.
4. **Recreate and check identities.** The self-hosted compiler tooling recreates the source inventory and probes. A bounded reader checks the records against the local compiler, source, bytecode and inventory identities before accepting them.
5. **Aggregate the sessions.** The aggregator checks that expected executions registered, their records belong to the current session, and the records form a complete, consistent set. It then combines hits for the same source item without counting shared files twice in the denominator.
6. **Apply the reviewed policy and publish.** The source report is checked against its manifest and regression policy. The independent coverage publisher selects a successful report from the core `next` branch and verifies its provenance before replacing the live source report.

This division is deliberate. The VM observes execution, the compiler associates observations with source, the reader checks the evidence, and the publisher checks what it is about to make public. A test run does not get to define its own denominator just by reporting whichever items it happened to hit.

Coverage is an opt-in observation alongside execution. The accepted source baseline leaves bytecode version 9 unchanged; coverage probes and counters do not become part of ordinary compiled programs. A collection failure is reported as a collection failure rather than changing the program's normal result.

## Attempts, completions and interrupted runs

The collector distinguishes an attempted execution from a completed one. Entering a function is different from returning from it. Evaluating an expression is different from leaving it successfully. That distinction matters when an operation traps or a process stops part-way through a run.

A trap can still leave useful evidence about the instructions reached before it. A killed process, crash, timeout or missing session record may leave the evidence incomplete. Panackelty does not fill those gaps with zeroes. A report must establish what ran and that its records are complete before it can claim a complete measurement.

The session system gives each execution a fresh identity. It records which artifacts may run, admits each execution, and checks the resulting records against the session identity and expected execution tree. Replaying an old record, omitting an expected child, adding a surplus record or changing the registered artifact set prevents a complete report.

These checks make accidental gaps visible; they are not cryptographic proof against someone deliberately rewriting local files. The reports are reproducible engineering evidence under the stated local workflow, not signed attestations from an adversarial environment.

## Zero and unavailable are different

A **known zero** means the report has enough evidence to say that an eligible item did not run.

**Unavailable** means it cannot safely say whether that item ran. For example, the source association may be missing or ambiguous, or a required execution record may be incomplete.

Those should never be collapsed into one number. Counting an unavailable item as zero would claim it was observed and missed. Counting it as covered would invent a hit. Panackelty preserves the state and shows covered, known-zero and unavailable counts separately.

When an item is unavailable, the report does not present a complete percentage as though the denominator were fully known. It can show a lower and upper bound: the confirmed covered items form the lower bound, and treating every unavailable item as covered would form the upper bound. The report's complete percentage remains absent until the measurement is complete.

## What the current source report covers

The published baseline is a defined native test corpus, not every test in the repository. Its versioned manifest, a checked-in list of what the report includes, names the production `.panack` files eligible for measurement, 14 unit-test roots, 13 positive functional roots and three compiler paths: source checking, disassembly and a byte-identical compiler bootstrap check. That last check rebuilds the compiler through its stages and requires the resulting compiler artifacts to match byte for byte. Test files themselves are executed and identified where needed, but they are not part of the production-source denominator.

The manifest is explicit. A newly tracked production source file does not silently enter or leave the measured scope; the manifest needs review. Shared imports can be compiled in different contexts, but the same source item is counted once in the denominator. Actual hits from the distinct executions can contribute to that item's result.

The initial corpus omits some external-process and death tests, TCP integration, package and release paths, other functional cases, and browser or WASI suites. Some dynamically generated compiler checks also need separate registered batches before they can be included. These are stated scope limits, not claims that those tests are unimportant or that the code they exercise has no coverage. Native C/LLVM coverage remains a separate report for core `main`; the `.panack` source report follows core `next`.

A coverage percentage without its manifest and exclusions would be easy to misread. A change to the source tree, denominator or execution corpus can change the figures even when the behaviour under test has not changed.

## What the current baseline says

The reviewed SC6 source baseline requires these coverage floors:

- **Compiler:** 5,173 / 5,998 start lines; 397 / 429 functions; 5,514 / 6,922 source outcomes.
- **Bytecode:** 587 / 601 start lines; 60 / 60 functions; 517 / 588 source outcomes.
- **Standard library:** 72 / 133 start lines; 23 / 33 functions; 33 / 64 source outcomes.

These are policy floors for the reviewed baseline, not universal targets for every project and not a claim that a particular percentage makes software dependable. The full accepted collection recorded 31 fresh executions, no unavailable measurements and 68 protected source items. The report also records commit, manifest, toolchain and source identities so readers can see what was measured and when.

Selected UTF-8, `Option`/`Result` and duration items have additional positive-coverage requirements. Their source hashes and structural IDs are pinned in the policy. If one is edited or removed, the guard cannot quietly disappear with it; the change needs an explicit policy review.

## How coverage helped find a bug

The first assertion batch added checks for UTF-8 boundaries and malformed sequences, both sides of `Option` and `Result` handling, and exact, negative and zero duration ratios. Looking at the coverage gap helped identify behaviour that needed those checks.

The new duration assertions exposed a real type-sensitive comparison bug. `duration_ratio` compared signed ticks with a natural-number zero, and `duration_divide` could receive a signed zero. Because equality is kind-sensitive, the intended error check could be skipped and the program could trap instead. Comparing two `Duration` values preserves the intended typed error.

Coverage did not find the defect by itself. It showed where execution evidence was missing; assertions made the expected behaviour precise and exposed the wrong result. Mutation checks then confirmed that tests rejected an overlong UTF-8 sequence, an incorrect fallback value and removal of a duration error guard.

That distinction is central to how I use the report. A hit is evidence of execution. It is not evidence that a test would fail if the behaviour were broken.

## Use the report as a guide

When a source item is a known zero, the next step is to decide whether it deserves a test. A missing error path, boundary case or important alternative usually does. A defensive path that cannot occur under the language's rules may need an explanation rather than a test. The report gives a place to investigate; it does not make that decision automatically.

When a source item is unavailable, the right response is to fix or explain the measurement gap. Treating it as zero would hide whether the test suite or the collector needs attention.

Coverage can also move for reasons that have little to do with behavioural quality. Splitting a packed line into several lines can change the line denominator. A new production function can add an unvisited function. A changed manifest can add or remove measured executions. Panackelty compares each component against reviewed floors and requires changes to scope, exclusions and protected items to be explained. An improvement in one component cannot conceal a regression in another.

There is no universal percentage that proves a compiler is well tested. Coverage is most useful alongside focused assertions, compiler and VM tests, functional runs, bootstrap checks and mutation tests. It tells us where the test suite went; the other evidence tells us what it checked.

## What another project can take from this

The collection system described above exists because Panackelty measures source code running across compiler invocations, nested VMs and supported child processes. That is a particular problem. An ordinary application can usually start with the coverage support already provided by its language and test framework.

The decisions around the report still matter. They apply to a web service, a desktop application or a command-line tool as much as to a compiler.

### Decide what question the report should answer

“How much of the code ran?” needs a boundary. Is the report about production code, the tests themselves, generated files, or the whole repository? Which test commands and environments contribute? Are background workers, scheduled jobs or child processes included?

Write down that scope before comparing percentages. For example, a web service report built from request tests may not include a queue worker that runs in a separate process. The worker's code has not necessarily been tested just because the service's main test command passed. Make the boundary visible in the report or its documentation so readers know what the number describes.

Most projects can use their test runner's existing file selection and coverage configuration for this. A small checked-in configuration or manifest can make the intended scope reviewable, especially when generated, vendored or platform-specific code needs special treatment.

### Choose a measure that matches the risk

Line coverage gives a useful map of where execution reached. Function coverage can highlight code that was never called. Branch coverage can show that a decision's alternatives have not all run. None of these measures is automatically the right one for every project.

For an application, the important alternatives may be successful and failed requests, retry and stop behaviour, permission granted and denied, or valid and invalid input. A metric should help you see those paths. The most detailed number available is not necessarily the most useful one.

Panackelty counts source outcomes because VM-level branches can reflect compiler lowering rather than choices in the language source. Most application teams should use their established tool's metrics and make clear what those metrics count; they rarely need to design a new collector.

Coverage tools can use different rules for what counts as a line or branch. A percentage from one tool or configuration may not be directly comparable with a percentage from another. Read the tool's definition before treating the figures as the same measure.

### Keep missed code separate from missing evidence

If the tool can establish that a branch did not run, that is a useful test gap. If instrumentation failed, a subprocess was not observed, or a report is missing data, the result is uncertain. Those situations call for different actions.

Check how a coverage tool represents files it cannot instrument, code excluded by configuration and tests that fail before producing a report. If those cases can be mistaken for uncovered code or silently disappear from the denominator, document the limit and make it visible in the workflow. Panackelty's explicit `unavailable` state is one way to make that distinction; another project may use warnings, report errors or separate status fields.

### Tie every number to the run that produced it

Coverage changes when source files, test selection, tool versions or configuration change. Save enough provenance to understand a result later: the source revision, test commands, coverage configuration and tool version. If separate jobs or processes contribute, establish that the report combines the intended runs and does not reuse an old result by accident.

This does not require Panackelty's session tickets and byte-level identity checks. It does require knowing what a published report describes. A CI artifact linked to its exact commit and workflow run is often enough for an application's needs.

### Use a low result to choose the next test, then check behaviour

Suppose a service has a retry limit. A report might show that tests exercise retrying but never reach the path that gives up. That points to a useful test: exceed the limit and check that the request stops retrying and reaches the intended failure handling.

The coverage result identifies the unvisited path. The assertions establish that the application handles it correctly. Mutation testing can add another check by changing the condition or removing the handling and confirming that a test fails.

When a percentage becomes a target, teams can end up exercising code without checking its effects. A rise is useful when it reflects tests for behaviour that matters. A fall deserves explanation, which might be a real regression, a changed denominator, or more accurate measurement.

### A short review before sharing a coverage figure

Before treating a coverage number as a project result, ask:

1. Which source files and test runs are included?
2. Which metric is being reported, and what exactly does it count?
3. Can I tell the difference between code that did not run and code the tool could not measure?
4. Can I connect this report to the source revision and test configuration that produced it?
5. Which tests check that the covered behaviour was correct?

Those answers make a coverage figure much more useful than a larger percentage without context. The Panackelty implementation is one detailed example of putting those questions into practice; the same questions can improve reports produced by much simpler tools.

## Inspect the evidence

The [live source coverage report](https://sproates.github.io/panackelty-coverage/source/html/index.html) shows the latest accepted source measurements and their provenance: the source revision and evidence behind the report. The [baseline contract](https://github.com/sproates/panackelty/blob/main/docs/SOURCE_COVERAGE_BASELINE.md) describes the manifest, policy, reproduction process and publication boundary. The [inventory contract](https://github.com/sproates/panackelty/blob/main/docs/SOURCE_INVENTORY.md) explains which source constructs are counted, and the [collection guide](https://github.com/sproates/panackelty/blob/main/docs/SOURCE_COVERAGE.md) describes counters, sessions and record validation.

To reproduce the baseline, use a clean committed core checkout with Node 24 and the normal native toolchain, then run:

```sh
make source-coverage-report-tests
make source-coverage-baseline
```

The second command refuses to overwrite an existing output directory. The resulting report includes the exact manifest and source, compiler, bytecode and session identities used for that collection.
