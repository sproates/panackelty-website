# Test reporting

Print ordered test results and return either the failure count or a checked console error.

## Import

```panack
import stdlib/testing/reporting as reporting
```
For an async function, select the async module instead:

```panack
import stdlib/testing/reporting/async as reporting
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## report()

```panack
report(results: [TestResult]): Result[Nat,ConsoleError]
```

**Parameters**

- `results: [TestResult]` — results in the order to report.

**Returns:** `Result[Nat,ConsoleError]`. `Ok(count)` contains the number of failed tests.

Prints PASS/FAIL lines followed by the total and failure counts. Stops on the first failed write. It does not choose an exit status for the program; use the returned count for that policy.

**Errors:** [ConsoleError](/reference/stdlib-console/#consoleerror) if output fails. A failed write prevents a successful count return.

## Result types

This module re-exports [TestResult, TestOutcome and the pure assertions](/reference/stdlib-testing/). They have the same identity as in `stdlib/testing`, including through the async module.

