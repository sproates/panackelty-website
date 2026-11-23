# Process test helpers

Run a command under explicit bounds and compare its output with an expected observation.

## Import

```panack
import stdlib/testing/process as commands
```
For an async function, select the async module instead:

```panack
import stdlib/testing/process/async as commands
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## run()

```panack
run(name: Str, command: TestCommand, expected: ProcessOutput): TestResult
```

**Parameters**

- `name: Str` — test name.
- `command: TestCommand` — exact executable and resource bounds.
- `expected: ProcessOutput` — expected compatibility output.

**Returns:** `TestResult`.

Runs the command and compares termination, stdout and stderr exactly. Launch errors become failed test results. The async form awaits execution.

**Errors:** Returns a failed `TestResult` rather than throwing for an ordinary command mismatch.

## command_output()

```panack
pure command_output(name: Str, actual: ProcessOutput, expected: ProcessOutput): TestResult
```

**Parameters**

- `name: Str` — test name.
- `actual: ProcessOutput` — observed output.
- `expected: ProcessOutput` — expected output.

**Returns:** `TestResult`.

Pure comparison of exit code, signal, stdout and stderr, in that order. Performs no subprocess I/O.

## command_result()

```panack
pure command_result(name: Str, actual: Result[ProcessOutput,HostError], expected: ProcessOutput): TestResult
```

**Parameters**

- `name: Str` — test name.
- `actual: Result[ProcessOutput,HostError]` — completed observation or host failure.
- `expected: ProcessOutput` — expected output.

**Returns:** `TestResult`.

Pure. Turns a host failure into a failed test, otherwise compares output.

## expect_command_error()

```panack
expect_command_error(name: Str, command: TestCommand, expected_code: Str): TestResult
```

**Parameters**

- `name: Str` — test name.
- `command: TestCommand` — command to execute.
- `expected_code: Str` — expected native HostError code.

**Returns:** `TestResult`.

Passes only if execution returns a HostError with the requested code. A completed nonzero exit is not a host error.

## capture_report()

```panack
capture_report(name: Str, command: TestCommand, expected: ProcessOutput, destination: Option[Path]): TestResult
```

**Parameters**

- `name: Str` — test name.
- `command: TestCommand` — command to execute.
- `expected: ProcessOutput` — expected complete output.
- `destination: Option[Path]` — optional stdout capture destination.

**Returns:** `TestResult`.

Writes stdout only after the complete observation matches. A failed capture write turns the test into a failure. The mismatch diagnostic may decode actual stdout as UTF-8; use this helper for textual reports, not arbitrary invalid byte sequences.

**Errors:** Invalid UTF-8 in that diagnostic path may trap. Other command/capture failures become failed results.

## Command and output records

```panack
record TestCommand {
  executable: Path,
  arguments: [Str],
  stdin: Bytes,
  working_directory: Path,
  environment: [Str],
  timeout: Duration,
  output_limit: Nat
}
record ProcessOutput { exit_code: Nat, signal: Nat, stdout: Bytes, stderr: Bytes }
```

`TestCommand.environment` is a list of inherited-environment overrides (`NAME=value`), not the canonical `ProcessEnvironment` enum. Execution uses the [process bounds](/reference/stdlib-process/#command). The compatibility output has `exit_code` and `signal`: a normal exit has signal zero, and a signal termination has exit code zero. These are deliberately different from the canonical `ProcessOutput.termination` record. `command_result` accepts `HostError { operation: Str, code: Str, native_code: Nat }`.

