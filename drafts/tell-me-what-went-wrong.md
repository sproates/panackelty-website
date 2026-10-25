---
title: Tell me what went wrong
status: draft
summary: The work behind Panackelty's package errors, and why telling you how to recover matters as much as rejecting the problem.
tags:
  - packages
  - tooling
  - errors
  - alpha.15
---

I've spent quite a bit of the recent package work looking at what happens when things go wrong.

In the [previous article](/articles/bringing-packages-to-panackelty/), I wrote about getting packages safely onto your machine. But refusing a broken archive is only part of the job. If the message leaves you wondering what broke and what you're supposed to do about it, there's still work to do.

I wasn't happy with where the messages had got to. Some explanations were too general, and some useful information was getting lost before it reached the terminal.

I wanted better than that.

The examples below come from tests of the upcoming alpha.15 package work. They're real output, with project paths simplified to `my-app`, and temporary directories, test-server ports and generated commits replaced by placeholders. This work isn't in the released alpha.14, and there are still diagnostics to finish.

## Show me the actual problem

You try to run your program, but one of its dependencies isn't on your machine. Here's what Panackelty tells you:

```text
panack: error[PKG_CACHE_MISSING]: Cannot build this project because dependency 'lib' (package 'demo.library') is missing locally.

  Project: <workspace>/my-app/panack.json
  Lockfile: <workspace>/my-app/panack.lock.json
  Source archive: <workspace>/library.tar.gz
  Missing directory: <workspace>/my-app/.panack_modules/demo.library

The lockfile records this dependency, but Panack cannot find its local files.

Restore the packages identified by the lockfile by running:

  panack deps restore --project '<workspace>/my-app/panack.json'

Running this command will restore the local packages without changing the lockfile.

An internet connection is needed if remote packages must be downloaded.
```

That's useful straight away. It names the missing dependency and shows where its files should be.

Then it gives you the command to restore them. You don't have to go looking up which command you need or work out which project it should apply to.

It also explains that restoring those files won't change the lockfile, and that downloading remote packages needs an internet connection.

## Tell me whose problem it is

A package can be perfectly valid for another tool and still use something Panackelty doesn't support. Git submodules are an example:

```text
panack: error[PKG_GIT_SUBMODULE]: Cannot prepare the Git package because the repository contains a submodule.

  Project: <workspace>/my-app/panack.json
  Repository: https://localhost:<port>/repo.git
  Dependency name: library
  Requested commit: <locked-commit>
  Submodule path: submodule

A submodule refers to another Git repository. Panack does not fetch submodule contents for packages.

If you maintain this package, provide the required files without a submodule or declare the other package as a dependency in panack.json. Otherwise, ask the package maintainer for a compatible package.
```

I'm quite pleased with this one.

It names the repository, commit and submodule path. Then it explains what a submodule is and why the package can't be prepared.

The advice also depends on whether you maintain the package. If you do, there are changes you can make. If you're just trying to use it, you need a compatible package from its maintainer.

That's much more useful than telling everyone to go and restructure somebody else's repository.

## A suggested fix needs some care

Suppose the local copy of a cached package has changed. Panackelty can spot that its checksum no longer matches the lockfile and suggest restoring it.

But what if those changes were yours?

Here's the recovery part of that message. I've left out the initial error and path details in this excerpt:

```text
Save any edits you want to keep elsewhere before restoring these files.

To restore the local package files to the contents identified by the lockfile, run:

  panack deps restore --project '<workspace>/my-app/panack.json'

Running this command will replace the local copy without changing the lockfile.

Panack will check the restored package checksums against the lockfile before using the packages.

An internet connection is needed if remote packages must be downloaded.
```

Before giving you a command that replaces files, it tells you to save any edits you want to keep.

Then it explains what the command changes and what it doesn't. The local copy gets replaced. The lockfile stays as it is.

That distinction is worth the extra lines. Restoring the content you've already selected and updating the project to accept different content are separate decisions. The error message needs to respect that.

## Keep the useful detail

Here's an archive that ends before its contents and end marker are complete:

```text
panack: error[PKG_ARCHIVE_INCOMPLETE]: Cannot unpack the archive because the archive ended before its contents and end marker were complete.

  Project: <workspace>/my-app/panack.json
  Source archive: <workspace>/source.tar.gz
  Dependency name: lib

Panack has stopped extraction.

Obtain a valid copy of the archive and retry your command. If a fresh copy produces the same error, ask the package maintainer to recreate the archive. A replacement must still match the checksums in an existing lockfile.
```

That gives me something to work with. It says which archive, which dependency and which project are involved, then explains that extraction has stopped.

It also tells me what to try next. Get a valid copy. If that still fails, the maintainer may need to recreate it.

The last sentence matters too: a replacement still has to match the existing lockfile. I don't want an error message casually encouraging someone to accept different package contents just to make the error go away.

These details have to survive the trip through the code. If the archive reader knows the input was incomplete, that shouldn't become a vague cache error by the time the command reports it.

So part of this work was preserving the cause through the layers, not just rewriting the sentence at the end.

## Don't make up a reason

There's another side to useful errors: knowing when there isn't enough information to explain the cause.

This test makes an HTTPS connection fail certificate verification. The current HTTP API doesn't give the package tool enough detail to identify that specific cause, so the output says so:

```text
panack: error[PKG_HTTPS_CONNECTION]: Cannot download the archive because Panack could not establish a secure HTTPS connection to the archive server.

  Project: <workspace>/my-app/panack.json
  Package: test.archive
  Source archive: https://localhost:<port>/lib.tar.gz
  Dependency name: lib

The HTTP API has not provided enough detail for Panack to identify the cause.

Check whether the archive URL is accessible over HTTPS from the same environment. If you manage the server, check its HTTPS configuration and certificate; otherwise, report the failure to the server administrator.
```

It would be easy to write something more confident. It would also be wrong for other failures that arrive through the same API result.

The message says what Panackelty knows, gives you the relevant URL and suggests where to investigate. It doesn't tell you to disable certificate checks.

I'd rather have that honesty than a plausible explanation that sends me off fixing the wrong thing. Preserving more detail from the HTTP API is separate follow-up work.

## Does the advice actually work?

The tests don't stop at checking that an error was printed.

For the cache-recovery examples, they execute the suggested commands and then run the recovered program. They check that it prints `42` and that repairing the cache hasn't changed the lockfile.

There are exact transcript checks as well, so a change to the wording is visible. The [diagnostic examples](https://github.com/sproates/panackelty/blob/next/docs/design/PACKAGE_DIAGNOSTIC_EXAMPLES.md) are checked against those transcripts rather than being a set of nicer messages written just for documentation.

That still doesn't tell me whether the explanation is any good.

A test can pass with a message that's accurate and unhelpful. I still need to read it as someone trying to get their program working, without all the implementation detail already in my head. That's why this needed more than one pass.

## This is part of using the language

There's good precedent for putting this effort into diagnostics. Elm's [Compiler Errors for Humans](https://elm-lang.org/news/compiler-errors-for-humans) describes reducing the work a programmer has to do to understand an error. Rust also has [detailed guidance on explanations and suggestions](https://rustc-dev-guide.rust-lang.org/diagnostics.html).

Those are mostly compiler examples. I want the same care in the tools around Panackelty as well.

You might spend only a moment reading a successful package command. When it fails, the message is what you have to work with. That's where the tool either helps you along or leaves you digging through its internals.

I'm really pleased with how these messages are turning out. They explain the problem, give you the details that matter, and take some care over what they're asking you to do next.

There's more to finish, but this is the sort of developer experience I want Panackelty to have.
