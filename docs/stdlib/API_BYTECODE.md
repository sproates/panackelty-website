# Nested bytecode execution

Execute bytecode synchronously in a nested VM. This is not an operating-system subprocess.

## Import

```panack
import stdlib/runtime/bytecode as bytecode
```
## run()

```panack
run(data: Bytes, arguments: [Str]): Void
```

**Parameters**

- `data: Bytes` — compiled Panack bytecode.
- `arguments: [Str]` — arguments for the nested invocation.

**Returns:** `Void`.

Runs the nested bytecode through the VM. This is an ordinary effectful call: it is not allowed as an async handler operation. For operating-system programs, use `process.run`.

**Errors:** Bytecode verification and VM failures are runtime diagnostics, not a `Result` returned by this API.

