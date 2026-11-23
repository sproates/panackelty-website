# Directory staging

Build an unpublished directory tree and publish it with an explicit replacement policy.

## Import

```panack
import stdlib/filesystem/staging as staging
```
For an async function, select the async module instead:

```panack
import stdlib/filesystem/staging/async as staging
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## create()

```panack
create(parent: Path): Result[DirectoryStage,FilesystemError]
```

**Parameters**

- `parent: Path` — existing parent of the stage and eventual destination.

**Returns:** `Result[DirectoryStage,FilesystemError]`.

Creates an invocation-owned stage. At most 64 stages may be allocated per invocation; slots are not reused. Cancellation before the result is handed back discards the undisclosed stage.

**Errors:** Stage creation, parent validation and resource errors are reported.

## path()

```panack
path(stage: DirectoryStage): Result[Path,FilesystemError]
```

**Parameters**

- `stage: DirectoryStage` — live stage.

**Returns:** `Result[Path,FilesystemError]`.

Validates the parent identity and returns a snapshot of the stage path. This neither transfers ownership nor promises future path stability.

**Errors:** Invalid/consumed stages, busy stages and changed parents fail.

## create_directory()

```panack
create_directory(stage: DirectoryStage, relative: Path): Result[Unit,FilesystemError]
```

**Parameters**

- `stage: DirectoryStage` — live stage.
- `relative: Path` — relative destination inside the stage.

**Returns:** `Result[Unit,FilesystemError]`.

Creates a directory beneath the stage, without permitting parent traversal or symlinked ancestors. Failure or cancellation may leave a partial change; no rollback is promised.

**Errors:** Unsafe paths, existing entries, busy/invalid stages and filesystem failures are reported.

## write_chunk()

```panack
write_chunk(stage: DirectoryStage, relative: Path, data: Bytes, offset: Nat): Result[Unit,FilesystemError]
```

**Parameters**

- `stage: DirectoryStage` — live stage.
- `relative: Path` — file path inside the stage.
- `data: Bytes` — bytes to write, at most 65,536 bytes per call.
- `offset: Nat` — byte offset, at most 256 MiB.

**Returns:** `Result[Unit,FilesystemError]`.

Writes a chunk under the retained stage. The stage remains owned afterwards. A failed or cancelled operation may have written some data.

**Errors:** Unsafe paths, invalid/busy stages, invalid bounds and host failures are reported.

## create_symlink()

```panack
create_symlink(stage: DirectoryStage, relative: Path, target: Path): Result[Unit,FilesystemError]
```

**Parameters**

- `stage: DirectoryStage` — live stage.
- `relative: Path` — link location beneath the stage.
- `target: Path` — native target, at most 4096 bytes.

**Returns:** `Result[Unit,FilesystemError]`.

Exclusively creates the link; existing entries are not overwritten. Does not open the target. Absolute, dangling or escaping targets require the caller’s own policy: the generic staging operation does not make the link target confined.

**Errors:** Unsafe link locations, symlinked ancestors, oversized targets and filesystem failures are reported.

## publish()

```panack
publish(stage: DirectoryStage, name: Path, mode: PublishMode): Result[Unit,FilesystemError]
```

**Parameters**

- `stage: DirectoryStage` — completed live stage.
- `name: Path` — destination child name under the original parent.
- `mode: PublishMode` — `CreateOnly()` or `ReplaceExisting()`.

**Returns:** `Result[Unit,FilesystemError]`.

`CreateOnly` refuses an existing destination. `ReplaceExisting` uses the supported replacement operation. A successful publication consumes the stage and all aliases, even if its awaiting task was cancelled after commit. A pre-commit failure leaves the stage usable. Publication does not promise crash durability. Old-generation cleanup is separate from successful publication.

**Errors:** Invalid destination, destination conflict, changed parent/stage or pre-commit publication failure are reported.

## discard()

```panack
discard(stage: DirectoryStage): Result[Unit,FilesystemError]
```

**Parameters**

- `stage: DirectoryStage` — unpublished live stage.

**Returns:** `Result[Unit,FilesystemError]`.

Recursively removes unpublished content and consumes the stage on success. A cleanup failure retains ownership so cleanup can be retried or the remaining path reported.

**Errors:** Invalid/busy stages and cleanup failures are reported.

## Ownership and errors

`DirectoryStage` is opaque. Copies refer to the same resource; only one operation may use it at a time. Consumption invalidates every copy. Invocation shutdown removes unpublished content after outstanding workers finish; it does not remove the published destination.

```panack
enum PublishMode { CreateOnly, ReplaceExisting }
```

All operations return [FilesystemError](/reference/stdlib-filesystem/#filesystemerror). In particular, inspect `StageBusy`, `InvalidStage`, `ParentChanged`, `DestinationConflict`, `PublicationFailed` and `CleanupFailed` rather than parsing rendered prose.

## Example

[Build, publish and read a note](/playbook/async-input-and-files/#complete-example-async-publish-note), with explicit error handling and cleanup.

