# Filesystem test helpers

Create owned test workspaces and discover immediate directory fixtures.

## Import

```panack
import stdlib/testing/filesystem as fixtures
```
For an async function, select the async module instead:

```panack
import stdlib/testing/filesystem/async as fixtures
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## create_workspace()

```panack
create_workspace(parent: Path): Result[TestWorkspace,HostError]
```

**Parameters**

- `parent: Path` — existing parent directory.

**Returns:** `Result[TestWorkspace,HostError]`.

Creates a unique temporary directory. `TestWorkspace { root: Path }` identifies the caller-owned directory; remove test-created files before removing the workspace.

**Errors:** Native creation failures are retained as `HostError`.

## discover_fixtures()

```panack
discover_fixtures(root: Path): Result[[Path],HostError]
```

**Parameters**

- `root: Path` — directory containing fixture directories.

**Returns:** `Result[[Path],HostError]`.

Returns immediate directory children in native-byte sorted order. Returned paths are joined to the supplied root. Symlinks are not followed. A filesystem error fails discovery without a partial result.

**Errors:** Enumeration, metadata or invalid-join failures are retained.

## remove_empty()

```panack
remove_empty(workspace: TestWorkspace): Result[Unit,HostError]
```

**Parameters**

- `workspace: TestWorkspace` — owned workspace to remove.

**Returns:** `Result[Unit,HostError]`.

Removes only an empty workspace. Refuses to silently discard remaining fixtures or output.

**Errors:** A nonempty, missing or inaccessible directory returns a host error.

## HostError

```panack
record HostError { operation: Str, code: Str, native_code: Nat }
```

These test helpers retain the compatibility error type. Inspect `code`; `native_code` is platform-specific diagnostic detail. They do not return `FilesystemError`.

