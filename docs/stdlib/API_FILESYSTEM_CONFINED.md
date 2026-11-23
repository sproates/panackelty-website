# Confined filesystem reads

Read beneath a designated root without allowing the requested path to escape it.

## Import

```panack
import stdlib/filesystem/confined as confined
```
For an async function, select the async module instead:

```panack
import stdlib/filesystem/confined/async as confined
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## root_identity()

```panack
root_identity(root: Path): Result[FilesystemRootIdentity,FilesystemError]
```

**Parameters**

- `root: Path` — existing root directory.

**Returns:** `Result[FilesystemRootIdentity,FilesystemError]`.

Reports the physical root device and inode. No descriptor stays open between calls. Compare this identity with each read when replacement of the root must be detected.

**Errors:** Invalid roots and filesystem failures are returned as `FilesystemError`.

## read()

```panack
read(root: Path, relative: Path, limit: Nat): Result[FilesystemRootRead,FilesystemError]
```

**Parameters**

- `root: Path` — root directory.
- `relative: Path` — relative file path beneath the root.
- `limit: Nat` — maximum bytes, at most 16 MiB.

**Returns:** `Result[FilesystemRootRead,FilesystemError]`, containing root identity and file bytes.

Opens the root and resolves the regular file beneath its held descriptor. Relative symlinks may be followed only while remaining beneath the root. Absolute links and parent escapes are rejected. Paths are bounded to 4096 bytes, walking to 256 directory levels and 40 symlink expansions. The read is confined, but is not a snapshot against concurrent edits.

**Errors:** Escapes, invalid paths, symlink loops, nonregular files, exceeded bounds and host failures return `FilesystemError`.

## read_link()

```panack
read_link(root: Path, relative: Path): Result[Bytes,FilesystemError]
```

**Parameters**

- `root: Path` — root directory.
- `relative: Path` — relative path of the symlink.

**Returns:** `Result[Bytes,FilesystemError]`, native target bytes.

Reads the final link without following its target. Rejects absolute/parent-traversing input paths and symlinked ancestors. Targets above 4096 bytes fail. It does not promise that the link will remain unchanged.

**Errors:** Missing paths, a final entry that is not a symlink, unsafe ancestors and oversized targets fail.

## Returned records

```panack
record FilesystemRootIdentity { device: Nat, inode: Nat }
record FilesystemRootRead { identity: FilesystemRootIdentity, contents: Bytes }
```

`identity` identifies the root opened for that read. `contents` is the complete bounded file content. [FilesystemError fields and categories](/reference/stdlib-filesystem/#filesystemerror) apply to all three operations. The older `read_beneath` export retains its compatibility `HostError` result.

## Example

[The publication example](/playbook/async-input-and-files/#complete-example-async-publish-note) reads the published file through this confined interface.

