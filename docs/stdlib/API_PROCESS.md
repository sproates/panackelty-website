# Processes

Run a bounded subprocess, inspect its termination and access invocation arguments.

## Import

```panack
import stdlib/process as process
```
For an async function, select the async module instead:

```panack
import stdlib/process/async as process
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## run()

```panack
run(command: Command): Result[ProcessOutput,ProcessError]
```

**Parameters**

- `command: Command` — executable, arguments, input, working directory, environment, timeout and combined output limit; all fields are required.

**Returns:** `Result[ProcessOutput,ProcessError]`. A nonzero child exit is still `Ok(output)`.

Runs the exact executable path. Relative executable paths resolve against the child working directory. There is no PATH search or implicit shell. Arguments are passed separately and exclude argv[0]. The async form suspends while the process runs. Timeout or cancellation stops and reaps the process group under the host policy; descendants that leave that group are not a general containment guarantee. Timeout and output-limit failures return no partial output.

**Errors:** Invalid arguments/environment, launch failure, timeout and combined-output exhaustion have distinct categories.

## arguments()

```panack
arguments(): [Str]
```

**Parameters**

None.

**Returns:** `[Str]`, the arguments supplied to the current invocation.

Use the async import and `await process.arguments()` inside an async function.

## exit()

```panack
exit(status: Nat): Unit
```

**Parameters**

- `status: Nat` — requested exit status.

**Returns:** Declared `Unit`; normal execution does not continue after exiting.

Ends the current invocation with the requested status. Use the async form inside async code.

## Command

```panack
record Command {
  executable: Path, arguments: [Str], stdin: Bytes, working_directory: Path,
  environment: ProcessEnvironment, timeout: Duration, output_limit: Nat
}
```

- `executable` is the exact path to run.
- `arguments` excludes argv[0]; values must not contain NUL.
- `stdin` is the complete byte input, at most 16 MiB.
- `working_directory` is the child working directory.
- `environment` selects inherited or exact entries.
- `timeout` must be positive and at most 365 days.
- `output_limit` bounds stdout and stderr combined, at most 16 MiB. Arguments and environment lists each allow at most 4096 entries. Host argument-size limits may be smaller.

```panack
enum ProcessEnvironment { InheritEnvironment([Str]), ExactEnvironment([Str]) }
```

Entries are `NAME=value` strings with unique, nonempty names and no NUL. Empty values are allowed. `InheritEnvironment` overrides entries in the invocation environment; `ExactEnvironment` supplies only the listed entries. An exact environment does not sandbox the child.

## ProcessOutput

```panack
record ProcessOutput { termination: ProcessTermination, stdout: Bytes, stderr: Bytes }
enum ProcessTermination { Exited(Nat), Signalled(Nat) }
```

`Exited(code)` identifies normal termination; check whether the code is zero. `Signalled(signal)` identifies signal termination. Output is bytes: use checked UTF-8 decoding when text is expected.

## ProcessError

```panack
record ProcessError {
  executable: Path, working_directory: Path, timeout: Duration, output_limit: Nat,
  kind: ProcessErrorKind, native: HostError
}
```

The record preserves executable, directory and bounds, but excludes arguments, environment and input/output contents. Use `problem.kind` for control flow and `problem.render()` for a human-readable explanation. The `native` field preserves the original failure. Host-backed native errors contain `operation: Str`, `code: Str` and `native_code: Nat`; a zero native number means no host error number was supplied.

```panack
enum ProcessErrorKind {
  InvalidTimeout, LimitExceeded, InvalidArgument, InvalidEnvironment, LaunchFailed,
  TimedOut, OutputLimitExceeded, ClockUnavailable, ResourceLimit, Cancelled,
  HostFailure, UnsupportedHost, OtherFailure
}
```


## Example

[Run the complete bounded subprocess example](/playbook/async-stdlib/#complete-example-async-pipe-input).

