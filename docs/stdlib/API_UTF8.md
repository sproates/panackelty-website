# UTF-8

Decode bytes to text with an explicit error location and category.

## Import

```panack
import stdlib/encoding/utf8 as utf8
```
## decode()

```panack
pure decode(data: Bytes): Result[Str,Utf8Error]
```

**Parameters**

- `data: Bytes` — complete byte sequence to decode.

**Returns:** `Result[Str,Utf8Error]`.

Pure and usable from ordinary or async code. Never silently replaces invalid bytes. A truncated final sequence is an error: when processing streamed input, retain incomplete sequences or assemble a bounded complete buffer first. Encoding in the other direction uses the pure `text.encode_utf8(): Bytes` method.

**Errors:** The error identifies a zero-based byte offset and one of the categories below.

## Utf8Error

```panack
record Utf8Error { offset: Nat, kind: Utf8ErrorKind }
enum Utf8ErrorKind {
  InvalidLeadingByte, InvalidContinuationByte, TruncatedSequence,
  OverlongEncoding, SurrogateCodePoint, CodePointOutOfRange
}
```

`offset` is the offending continuation byte, or otherwise the start of the invalid sequence. `render(): Str` produces a human explanation including that zero-based location. This pure error contains no host error.

## Example

[The console input program](/playbook/async-input-and-files/#complete-example-async-console-input) decodes a bounded complete buffer and reports invalid input.

