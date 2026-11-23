# Console

Read bounded byte chunks from standard input and write checked text to standard output or standard error.

## Import

```panack
import stdlib/console as console
```
For an async function, select the async module instead:

```panack
import stdlib/console/async as console
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## read()

```panack
read(limit: Nat): Result[Option[Bytes],ConsoleError]
```

**Parameters**

- `limit: Nat` — maximum bytes for this read, from 1 through 65,536.

**Returns:** `Result[Option[Bytes],ConsoleError]`. `Ok(Some(data))` contains a non-empty chunk; `Ok(None())` means EOF.

A read may return fewer bytes than requested. It is not a line reader. UTF-8 characters can span chunks: assemble a bounded complete buffer before decoding, or retain incomplete trailing bytes. Only one async stdin read may be outstanding.

**Errors:** `InvalidReadLimit` for an invalid limit; `ReadBusy` for an overlapping read; I/O, worker-resource or unsupported-host failures are reported separately.

## write()

```panack
write(message: Str): Result[Unit,ConsoleError]
```

**Parameters**

- `message: Str` — at most 16,384 UTF-8 bytes, excluding any added newline.

**Returns:** `Result[Unit,ConsoleError]`.

Writes the text to standard output without adding a newline. The async form is awaited. Check the result; a failed diagnostic write cannot reliably report itself through the same broken stream.

**Errors:** `OutputTooLarge` when the message exceeds the byte limit; I/O, worker-resource and unsupported-host failures are retained.

## write_line()

```panack
write_line(message: Str): Result[Unit,ConsoleError]
```

**Parameters**

- `message: Str` — at most 16,384 UTF-8 bytes, excluding any added newline.

**Returns:** `Result[Unit,ConsoleError]`.

Writes the text to standard output and adds a newline. The async form is awaited. Check the result; a failed diagnostic write cannot reliably report itself through the same broken stream.

**Errors:** `OutputTooLarge` when the message exceeds the byte limit; I/O, worker-resource and unsupported-host failures are retained.

## write_error()

```panack
write_error(message: Str): Result[Unit,ConsoleError]
```

**Parameters**

- `message: Str` — at most 16,384 UTF-8 bytes, excluding any added newline.

**Returns:** `Result[Unit,ConsoleError]`.

Writes the text to standard error without adding a newline. The async form is awaited. Check the result; a failed diagnostic write cannot reliably report itself through the same broken stream.

**Errors:** `OutputTooLarge` when the message exceeds the byte limit; I/O, worker-resource and unsupported-host failures are retained.

## write_error_line()

```panack
write_error_line(message: Str): Result[Unit,ConsoleError]
```

**Parameters**

- `message: Str` — at most 16,384 UTF-8 bytes, excluding any added newline.

**Returns:** `Result[Unit,ConsoleError]`.

Writes the text to standard error and adds a newline. The async form is awaited. Check the result; a failed diagnostic write cannot reliably report itself through the same broken stream.

**Errors:** `OutputTooLarge` when the message exceeds the byte limit; I/O, worker-resource and unsupported-host failures are retained.

## ConsoleError

```panack
record ConsoleError { operation: ConsoleOperation, kind: ConsoleErrorKind, native: HostError }
```

`operation` distinguishes reading (including the limit), stdout writes and stderr writes. The error does not retain the output text. Use `problem.kind` for control flow and `problem.render()` for a human-readable explanation. The `native` field preserves the original failure. Host-backed native errors contain `operation: Str`, `code: Str` and `native_code: Nat`; a zero native number means no host error number was supplied.

```panack
enum ConsoleErrorKind {
  InvalidReadLimit, OutputTooLarge, ReadBusy, IOFailure, ResourceLimit, UnsupportedHost, OtherFailure
}
```


## Example

[Read the complete bounded-input program](/playbook/async-input-and-files/#complete-example-async-console-input). It handles EOF, the total input limit, invalid UTF-8 and failed output.

