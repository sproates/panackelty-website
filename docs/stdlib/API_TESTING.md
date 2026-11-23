# Testing assertions

Build explicit test results using pure assertions. Reporting is a separate checked effect.

## Import

```panack
import stdlib/testing as testing
```
## expect()

```panack
pure expect(name: Str, condition: Bool, reason: Str): TestResult
```

**Parameters**

- `name: Str` — test name.
- `condition: Bool` — whether the assertion holds.
- `reason: Str` — explanation used when it fails.

**Returns:** `TestResult`.

Pure. Creates a passed or failed result without printing or exiting.

## equal_str()

```panack
pure equal_str(name: Str, actual: Str, expected: Str): TestResult
```

**Parameters**

- `name: Str` — test name.
- `actual: Str` — observed value.
- `expected: Str` — required value.

**Returns:** `TestResult`.

Pure. Compares values and supplies an expected/actual explanation on failure.

## equal_nat()

```panack
pure equal_nat(name: Str, actual: Nat, expected: Nat): TestResult
```

**Parameters**

- `name: Str` — test name.
- `actual: Nat` — observed value.
- `expected: Nat` — required value.

**Returns:** `TestResult`.

Pure. Compares values and supplies an expected/actual explanation on failure.

## TestResult

```panack
record TestResult { name: Str, outcome: TestOutcome }
enum TestOutcome { TestPassed, TestFailed(Str) }
```

`TestFailed(reason)` retains the failure explanation; `TestPassed()` has no payload. Assertions do not stop later tests.

## Reporting

Use [testing/reporting](/reference/stdlib-testing-reporting/) for checked output. The older `testing.report(results: [TestResult]): Nat` is an ordinary compatibility function that returns the failure count but does not expose output failure as a `Result`.

