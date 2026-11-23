# Paths

Construct and manipulate opaque filesystem paths without accessing the filesystem.

## Import

```panack
import stdlib/path as path
```
## from_text()

```panack
pure from_text(value: Str): Result[Path, PathError]
```

**Parameters**

- `value: Str` — nonempty path text without NUL.

**Returns:** `Result[Path,PathError]`.

Pure. Encodes path text without checking whether it exists.

**Errors:** `EmptyPath` or `PathContainsNul`.

## from_native()

```panack
pure from_native(value: Bytes): Result[Path, PathError]
```

**Parameters**

- `value: Bytes` — nonempty native POSIX path bytes without NUL.

**Returns:** `Result[Path,PathError]`.

Preserves native bytes, including names which are not valid UTF-8. Does not access the filesystem.

**Errors:** `EmptyPath` or `PathContainsNul`.

## current()

```panack
pure current(): Path
```

**Parameters**

None.

**Returns:** `Path`, the lexical current-directory path.

Pure. This is not a host call resolving an absolute working directory.

## Path methods

All methods are pure.

- `join(child: Path): Result[Path,PathError]` appends a relative child; an absolute child produces `AbsolutePathAppend`. This does not establish confinement.
- `parent(): Path` returns the lexical parent, retaining the behaviour of the compatibility name `directory()`.
- `filename(): Option[Path]` returns the final path component when there is one.
- `is_absolute(): Bool` tests the path form.
- `native_bytes(): Bytes` preserves the exact native representation.
- `to_text(): Result[Str,PathError]` requires valid UTF-8; otherwise returns `PathNotUtf8`.
- `display(): Str` provides text for diagnostics even when the path is not valid UTF-8. Do not use display text to reconstruct a native path.

`PathError` is `EmptyPath`, `PathContainsNul`, `PathNotUtf8` or `AbsolutePathAppend`. These are path-value failures, separate from `FilesystemError` returned by host operations.

## Example

[The temporary-file example](/playbook/async-stdlib/#complete-example-async-temporary-note) uses paths without treating them as strings.

