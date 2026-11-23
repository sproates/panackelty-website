# Environment

Read environment values captured for the current invocation.

## Import

```panack
import stdlib/environment as environment
```
For an async function, select the async module instead:

```panack
import stdlib/environment/async as environment
```
Await effectful operations. In the signatures below, an ordinary effectful function becomes `async` under the async import; parameter and result types stay the same. Pure functions and value methods remain ordinary calls. The two imports share their value and error types.

## get()

```panack
get(name: Str): Option[Str]
```

**Parameters**

- `name: Str` — the environment variable name.

**Returns:** `Option[Str]`: `Some(value)` when present, `None()` when absent.

The empty value `Some("")` is distinct from absence. This reads the invocation snapshot, not a live view of later host changes. With the async import use `await environment.get(name)`.

## Example

```panack
name = await environment.get("APP_NAME")
display_name = name.value_or("Panack service")
```
This fragment belongs inside an async function. It substitutes a default only when the variable is absent.

