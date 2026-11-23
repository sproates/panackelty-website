# Bytes

Construct empty bytes and take bounded slices. Byte values are distinct from text.

## Import

```panack
import stdlib/bytes as bytes
```
## empty()

```panack
pure empty(): Bytes
```

**Parameters**

None.

**Returns:** `Bytes`, an empty byte sequence.

Pure. Equivalent to constructing `bytes()`.

## slice()

```panack
pure slice(data: Bytes, start: Nat, end: Nat): Bytes
```

**Parameters**

- `data: Bytes` — source bytes.
- `start: Nat` — start offset, inclusive.
- `end: Nat` — end offset, exclusive.

**Returns:** `Bytes`, the selected slice.

Pure compatibility function. New code may use `data.slice(start,end)` with the same bounds contract.

**Errors:** Bounds must satisfy `start <= end <= data.len()`. Invalid bounds trap; this operation does not return a `Result`.

## Value methods

`data.len(): Nat` returns the byte count. `data.slice(start: Nat,end: Nat): Bytes` takes the same bounded half-open slice as the module function. `length()` remains the compatibility length name. UTF-8 decoding is a separate checked operation: [utf8.decode](/reference/stdlib-utf8/#decode).

