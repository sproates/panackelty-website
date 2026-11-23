# Filesystem

Read and write files, inspect directories and manage temporary paths with explicit bounds and checked failures.

## Import

```panack
import stdlib/filesystem as filesystem
```
For an async function, select the async module instead:

```panack
import stdlib/filesystem/async as filesystem
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## metadata()

```panack
metadata(path: Path): Result[FileMetadata, FilesystemError]
```

**Parameters**

- `path: Path` — entry to inspect.

**Returns:** `Result[FileMetadata,FilesystemError]`.

Inspects the final directory entry without following a final symlink. Intermediate symlinks and trailing separators use host path resolution. Size is the host byte-size field, not a recursive directory total.

**Errors:** Returns `FilesystemError`; see the error categories below.

## read()

```panack
read(path: Path, limit: Nat): Result[Bytes, FilesystemError]
```

**Parameters**

- `path: Path` — regular file to read.
- `limit: Nat` — whole-file byte limit, at most 128 MiB.

**Returns:** `Result[Bytes,FilesystemError]`.

Follows symlinks and preserves bytes. Exceeding the limit fails without returning partial data. Special files are rejected; use stream APIs for streams.

**Errors:** Returns `FilesystemError`; see the error categories below.

## write()

```panack
write(path: Path, data: Bytes): Result[Unit, FilesystemError]
```

**Parameters**

- `path: Path` — file to create or truncate.
- `data: Bytes` — complete contents, at most 128 MiB.

**Returns:** `Result[Unit,FilesystemError]`.

Follows symlinks. May leave partial contents on failure. It is neither atomic replacement nor a durability guarantee.

**Errors:** Returns `FilesystemError`; see the error categories below.

## read_chunk()

```panack
read_chunk(file: Path, offset: Nat, limit: Nat): Result[Bytes,FilesystemError]
```

**Parameters**

- `file: Path` — regular file to read without following a final symlink.
- `offset: Nat` — byte offset, at most 256 MiB.
- `limit: Nat` — maximum bytes for this chunk, at most 65,536.

**Returns:** `Result[Bytes,FilesystemError]`.

Reads a bounded portion of a regular file. With a positive limit, empty bytes indicate no remaining data at the offset. This does not establish directory confinement.

**Errors:** Returns `FilesystemError`; see the error categories below.

## write_atomic()

```panack
write_atomic(file: Path, data: Bytes): Result[Unit,FilesystemError]
```

**Parameters**

- `file: Path` — destination file.
- `data: Bytes` — complete replacement contents, at most 32 MiB.

**Returns:** `Result[Unit,FilesystemError]`.

Uses atomic replacement so readers do not observe an incrementally written destination. Atomic visibility does not promise persistence after a crash.

**Errors:** Returns `FilesystemError`; see the error categories below.

## list_directory()

```panack
list_directory(path: Path): Result[[Path], FilesystemError]
```

**Parameters**

- `path: Path` — directory to enumerate.

**Returns:** `Result[[Path],FilesystemError]`, immediate relative child names.

Excludes `.` and `..`. Orders names lexicographically by unsigned native bytes. Join each name to its parent before accessing it. Fails without a partial list beyond 65,536 entries or 16 MiB of names. Enumeration is not a snapshot against concurrent changes.

**Errors:** Returns `FilesystemError`; see the error categories below.

## create_directory()

```panack
create_directory(path: Path): Result[Unit, FilesystemError]
```

**Parameters**

- `path: Path` — single directory to create.

**Returns:** `Result[Unit,FilesystemError]`.

Creates one level; it does not create missing ancestors. Fails if the entry already exists. Permissions are subject to the host umask.

**Errors:** Returns `FilesystemError`; see the error categories below.

## remove_file()

```panack
remove_file(path: Path): Result[Unit, FilesystemError]
```

**Parameters**

- `path: Path` — file or symbolic link to unlink.

**Returns:** `Result[Unit,FilesystemError]`.

Removes that entry. Does not recursively remove directories.

**Errors:** Returns `FilesystemError`; see the error categories below.

## remove_directory()

```panack
remove_directory(path: Path): Result[Unit, FilesystemError]
```

**Parameters**

- `path: Path` — empty directory to remove.

**Returns:** `Result[Unit,FilesystemError]`.

Refuses a nonempty directory. It does not recursively delete contents.

**Errors:** Returns `FilesystemError`; see the error categories below.

## create_temp_file()

```panack
create_temp_file(parent: Path): Result[Path,FilesystemError]
```

**Parameters**

- `parent: Path` — existing parent directory.

**Returns:** `Result[Path,FilesystemError]`, the already-created file.

Atomically chooses a unique name and creates a file with permissions 0600 subject to umask. The caller owns cleanup; this is not merely a name reservation.

**Errors:** Returns `FilesystemError`; see the error categories below.

## create_temp_directory()

```panack
create_temp_directory(parent: Path): Result[Path,FilesystemError]
```

**Parameters**

- `parent: Path` — existing parent directory.

**Returns:** `Result[Path,FilesystemError]`, the already-created directory.

Atomically chooses a unique name and creates a directory with permissions 0700 subject to umask. The caller must remove its contents and directory.

**Errors:** Returns `FilesystemError`; see the error categories below.

## directories_overlap()

```panack
directories_overlap(left: Path, right: Path): Result[Bool,FilesystemError]
```

**Parameters**

- `left: Path` — first directory.
- `right: Path` — second directory.

**Returns:** `Result[Bool,FilesystemError]`.

Checks physical directory overlap rather than comparing path spellings. The result describes that operation, not a permanent guarantee against later changes.

**Errors:** Returns `FilesystemError`; see the error categories below.

## Paths, cancellation and ownership

Construct paths using [the path module](/reference/stdlib-path/). Ordinary paths do not confine access: relative paths, `..` and symlinks follow host rules. Use [confined reads](/reference/stdlib-filesystem-confined/) when access must remain under a root. Async operations run on bounded workers. Cancelling a wait does not undo an already-started filesystem side effect. Temporary paths do not gain automatic cleanup.

## FileMetadata

```panack
record FileMetadata { kind: FileKind, size: Nat }
enum FileKind { RegularFile, Directory, SymbolicLink, OtherFile }
```


## FilesystemError

```panack
record FilesystemError { operation: FilesystemOperation, kind: FilesystemErrorKind, native: HostError }
```

`operation` records the requested operation and its paths/bounds. Missing entries, permissions, existing destinations, wrong entry types and exceeded limits have distinct categories. Unknown host codes remain `OtherFailure`. Use `problem.kind` for control flow and `problem.render()` for a human-readable explanation. The `native` field preserves the original failure. Host-backed native errors contain `operation: Str`, `code: Str` and `native_code: Nat`; a zero native number means no host error number was supplied.

```panack
enum FilesystemErrorKind {
  NotFound,
  PermissionDenied,
  AlreadyExists,
  NotDirectory,
  IsDirectory,
  NotRegularFile,
  DirectoryNotEmpty,
  SymlinkRejected,
  OutputLimitExceeded,
  LimitExceeded,
  InvalidArgument,
  InvalidPath,
  InvalidParent,
  InvalidStage,
  StageBusy,
  ParentChanged,
  StageChanged,
  DestinationConflict,
  PublicationFailed,
  CleanupFailed,
  StageCreationFailed,
  StageOpenFailed,
  FilesystemFailure,
  IOFailure,
  ResourceLimit,
  OutOfMemory,
  Cancelled,
  UnsupportedHost,
  OtherFailure
}
```


## Example and compatibility

[The temporary-note program](/playbook/async-stdlib/#complete-example-async-temporary-note) preserves both the primary failure and a cleanup failure. `temp_file` and `temp_directory` remain compatibility names for the canonical creation operations.

