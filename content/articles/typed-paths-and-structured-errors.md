---
title: Building a terminal tool with typed paths and structured errors
status: published
date: 2026-10-13
publishedAt: 2026-10-13T21:01:16+02:00
tags:
  - types
  - host APIs
  - terminal tools
---

Filenames are less tidy than they look. A path may contain spaces, quotes, control characters or bytes that aren't valid UTF-8. If a terminal tool treats every path as an ordinary string, those details can get lost or end up changing how its output appears.

I want to build a small directory lister that keeps the path values intact until it is time to display them. It will accept one directory and print its immediate children, one per line. The filesystem call can fail, so the program must also decide what to do with that result.

The command will look like this:

```text
dir-list DIRECTORY
```

For an ordinary directory, the output might be:

```text
articles
content
index.html
scripts
```

The interesting part is not the number of lines. It is how we get from native filesystem names to terminal text without pretending that every filename is well-behaved UTF-8.

## Keep the path as a path

The command-line argument starts as a `Str`, because that is how terminal arguments arrive. `path.from_text` checks whether the text can be represented as a `Path` and returns `Result[Path, PathError]`:

```panackelty
match path.from_text(arguments[0]) {
  Error(path_error) => {
    host.stderr("the directory name cannot be used as a path")
    host.exit(1)
  },
  Ok(directory) => list_directory(directory)
}
```

That conversion is a local check. It doesn't ask the filesystem whether the path exists or whether the program can read it. Those questions belong to the operation that actually lists the directory.

Once we have a `Path`, we can pass it to the filesystem API without converting it back to text. That matters because filesystem names aren't guaranteed to be UTF-8. The `Path` value preserves the host representation, including names that ordinary Panackelty text can't represent directly.

## Let the filesystem return a result

The directory operation returns `Result[[Path], HostError]`: either a list of child paths or a structured error describing the failed host operation.

```panackelty
match filesystem.list_directory(directory) {
  Error(error) => {
    host.stderr("cannot list directory: " + error.code)
    host.exit(1)
  },
  Ok(entries) => show_entries(entries)
}
```

The error has more information than a message string. Its `operation` says which host service failed, `code` is a portable category such as `not_found` or `permission_denied`, and `native_code` preserves the operating system's error number for diagnosis. The portable code is the one to use for decisions that need to work across systems; native numbers vary.

The returned paths are immediate children, not a recursive walk. They are relative names in deterministic native-byte order. The API doesn't follow directory entries to inspect their type or size; this command only lists their names.

## Turn each path into safe display text

We have an array of `Path` values. To print them, we need to turn each one into text. `path.display` does that without assuming the native bytes are valid UTF-8. Its result is ASCII text; it escapes backslashes, control characters and non-ASCII bytes as `\xhh` sequences.

That means a filename containing a newline stays on one output line, and a name made from bytes that aren't valid UTF-8 still has a readable representation. We can define that transformation as a pure function:

```panackelty
pure display_entry(entry: Path): Str {
  path.display(entry)
}
```

The function doesn't read the filesystem. It receives a path value and returns its display form. The same path always gives the same text.

## Build the output with a map and a reduce

First, `map` converts every path into its display text. Then `reduce` joins those strings with newlines. Both operations take a function as an argument. The `@` means “pass this function itself”; `@display_entry` doesn't call `display_entry` there. `map` calls it for each path, while `reduce` calls `append_line` with the text built so far and the next entry.

```panackelty
pure append_line(output: Str, entry: Str): Str {
  if len(output) == 0 {
    entry
  } else {
    output + "\n" + entry
  }
}

pure render_entries(entries: [Path]): Str {
  entries.map(@display_entry).reduce("", @append_line)
}
```

The empty string is the starting value for the reduction. For an empty directory, `render_entries` returns an empty string; the caller can choose to print a clearer message instead. For a non-empty directory, the first entry becomes the output and each later entry is appended after one newline.

This keeps the example easy to follow, but it builds the output by adding each entry to the text already assembled. Depending on how strings are implemented, that can mean copying more and more text as the listing grows. Panackelty doesn't currently have a `Str.join` operation. For a very large listing, writing each displayed path to stdout separately would avoid building one combined string, though the output code would then handle each line in turn.

This is the part I wanted to show as pure code. The functions describe the transformation from path values to terminal-ready text. They don't need a mutable cursor, counters or a loop that mixes formatting with host access. Panackelty's array operations make the steps explicit: map each entry, then combine the results.

## Keep terminal output at the edge

The code that calls the filesystem handles its `Result`, then decides what the user should see:

```panackelty
show_entries(entries: [Path]): Void {
  if len(entries) == 0 {
    host.stdout("(empty directory)")
  } else {
    host.stdout(render_entries(entries))
  }
}
```

`host.stdout` adds the final newline. `render_entries` only joins entries between themselves, so it doesn't need to know how the terminal writes lines.

## The complete command

Here is the full program. The effectful parts are at the boundary: read the arguments, convert the directory name, ask the filesystem for entries, and write to the terminal. The path-to-text conversion and output construction are pure.

```panackelty
import stdlib/filesystem as filesystem
import stdlib/host as host
import stdlib/path as path

pure display_entry(entry: Path): Str {
  path.display(entry)
}

pure append_line(output: Str, entry: Str): Str {
  if len(output) == 0 {
    entry
  } else {
    output + "\n" + entry
  }
}

pure render_entries(entries: [Path]): Str {
  entries.map(@display_entry).reduce("", @append_line)
}

show_entries(entries: [Path]): Void {
  if len(entries) == 0 {
    host.stdout("(empty directory)")
  } else {
    host.stdout(render_entries(entries))
  }
}

list_directory(directory: Path): Void {
  match filesystem.list_directory(directory) {
    Error(error) => {
      host.stderr("cannot list directory: " + error.code)
      host.exit(1)
    },
    Ok(entries) => show_entries(entries)
  }
}

main(): Void {
  arguments = host.arguments()
  if len(arguments) != 1 {
    host.stderr("usage: dir-list DIRECTORY")
    host.exit(2)
  }

  match path.from_text(arguments[0]) {
    Error(path_error) => {
      host.stderr("the directory name cannot be used as a path")
      host.exit(1)
    },
    Ok(directory) => list_directory(directory)
  }
}
```

There are two distinct errors. `path.from_text` can reject text that can't be represented as a `Path`. If that succeeds, `filesystem.list_directory` can still fail because the directory is missing, access is denied, or another host problem occurs. Each operation returns the error type that belongs to that boundary, and the program handles it there.

`Path` is not a security guarantee. It doesn't establish that a path stays beneath a chosen directory, resolve it to a canonical identity or prevent the filesystem changing between operations. This program only lists one directory, so it doesn't need to make those claims.

Purity doesn't mean avoiding every effect in a program. Listing a real directory necessarily asks the host to do something. The point is that the conversion and formatting don't need to repeat that effect or hide it inside a helper. They work with the values the filesystem returned, which makes them predictable and easy to check on their own.

For the current namespace-based API contracts, see the [typed filesystem section of the specification](https://github.com/sproates/panackelty/blob/next/SPEC.md#typed-filesystem-process-and-sleep-apis) and the [standard library module guide](https://github.com/sproates/panackelty/blob/next/src/stdlib/README.md). The [host capabilities functional case](https://github.com/sproates/panackelty/blob/next/tests/functional/cases/host_capabilities/main.panack) is a larger executable example of Panackelty's host operations.
