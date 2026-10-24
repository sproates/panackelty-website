---
title: Bringing packages to Panackelty
status: draft
summary: How package management is taking shape, why I've made these choices, and what I had to rethink along the way.
tags:
  - packages
  - tooling
  - alpha.15
---

In the [HTTP service article](/articles/building-a-small-http-service-in-panackelty/), we pointed a project at the HTTP package sitting beside it. That works quite nicely when the code is already on your machine. But what happens when the package lives in another repository? Or someone sends you an archive? How can you be sure you get the same code next time?

That's the next bit I'm working on: package management for Panackelty.

It's planned for alpha.15 and isn't in the alpha.14 release. As I write this, local directories, local archives and HTTPS archives have working dependency workflows in development. The tool can also acquire an exact Git snapshot, but connecting that to dependency declarations and the lockfile is still to come. So this is a look at the work in progress, including a few things I had to go back and rethink.

## Start with the code you already have

The first version will support four places to get a package: a local directory, a local `.tar.gz` archive, an HTTPS archive URL, or a Git repository. A Git dependency will also be able to select a package inside a larger repository.

There's no central registry in this work. There isn't a package publishing service or a system for running dependency build scripts either. Those would bring quite a lot of extra decisions with them. For now, the useful thing is being able to take some Panackelty source, declare where it comes from, and use it reliably.

Dependencies stay in `panack.json`, so you can edit them directly. A local directory stays where you put it. The tool doesn't copy it somewhere else and then leave you wondering which copy you're editing.

That matters when you're working on an app and a library together. Change the library's source and the app sees the change. The lock records the package identity and manifest, but deliberately doesn't freeze every source file in a live directory. Archives and Git snapshots are different: those are meant to represent particular content.

## Making sure we don’t go fishing around for dependencies on the quiet

One decision I've made quite firmly is that checking or compiling a project won't quietly fetch dependencies.

The dependency workflow has three explicit operations:

- `panack deps lock` establishes the dependency graph and writes a missing lockfile. With a current lock, it's a no-op.
- `panack deps update` deliberately changes the locked choices. It can update selected dependencies as well as the whole graph.
- `panack deps restore` prepares the sources recorded in the lock, without choosing newer versions or rewriting it.

These commands take `--project panack.json` to select the project. They're development commands for the upcoming release, not instructions for the current alpha.14 download.

The lockfile, `panack.lock.json`, records the complete dependency graph. An archive gets a hash of its exact compressed bytes. A Git branch or tag will resolve to a full commit ID when you lock or update it. Moving the tag later won't silently change what restore means.

Then `check`, `compile` and `run` use the sources already prepared for the project. If something is missing or stale, they tell you which dependency operation is needed. The dependency preparation step doesn't use the network or repair the cache behind your back. A program you run can, of course, use its own network capabilities.

I think that makes the behaviour much easier to follow. Asking whether my program is valid shouldn't also mean asking a server whether there's something newer today.

Offline restore follows the same idea. A locked local archive can be unpacked without an existing cache. A remote dependency needs an already verified local copy. If that copy isn't there, offline means restore fails, rather than having a quick look online anyway.

## A package tool written in Panackelty

The package tool is itself written in Panackelty. It owns the manifests, dependency graph, lockfiles, archive rules and cache decisions.

It's also built separately from the compiler. That distinction turned out to matter rather a lot. Changing how the tool handles an archive shouldn't mean rebuilding the compiler or refreshing its bootstrap seed.

The tool passes the compiler a temporary description of the resolved project: which packages exist, where their sources are, what they export and which dependencies belong to each package. The compiler still checks that description before using it. It doesn't need to know how an archive was downloaded or how a Git ref was selected.

I've tested that separation by changing package-tool behaviour and checking that the tool changes while the compiler artifact and seed stay the same. It's a more useful check than simply putting the files in a different directory and calling them independent.

There are native libraries underneath. I've used zlib for gzip, the existing libcurl transport for HTTPS, and OpenSSL for SHA-256. Panackelty decides what a valid package is and what to do with it; these libraries provide the lower-level operations.

## Redoing a bad approach

The first archive implementation had defects in nested-directory extraction and the ordering used to calculate a source-tree digest. I reverted it to the accepted design baseline and reconsidered the implementation before continuing.

Neither problem was something to brush past. Packages have nested source directories. And if I'm going to use a digest to decide whether two source trees are the same, its ordering rules have to be precise and consistent.

The replacement made the boundaries explicit: package policy in Panackelty, a separately built tool, and small native operations where the language needed them. I started by proving that the tool could hand a working local project to the compiler, then added the lock and archive workflow around it.

I also added fixtures with independently calculated hashes, nested paths, empty directories and mixed-case filenames. That last one is quite easy to miss: sorting names for a digest and checking whether names collide on a filesystem are different jobs. The digest uses the original UTF-8 path bytes in a defined order. Collision checking has its own rules.

The [revert](https://github.com/sproates/panackelty/pull/573) is in the history. It withdrew an unreleased implementation, and the replacement had to earn its way back through the tests.

## Writing it myself still needs to be practical

Hashing gave me another fairly direct lesson.

The initial pure-Panackelty SHA-256 implementation took 35.05 seconds for a 64 KiB test on the development Mac. The OpenSSL-backed version completed the same program in 0.11 seconds and produced the same hash. Those measurements include constructing the input buffer; they aren't a general benchmark of the language or every package operation.

But they were enough to make the decision. Package verification needs to be something you can use routinely, and spending that long on such a small input wasn't going to work.

So I changed the boundary. OpenSSL performs the hashing through a generic, bounded byte-stream interface. Panackelty still constructs the canonical input and decides which paths and bytes belong in it. The native code doesn't know about package names or lockfiles.

There's more performance work ahead. An archive with thousands of tiny entries puts pressure on collection operations, and the Git implementation has per-file process overhead to consider. Using a fast hash doesn't make those costs disappear.

## An archive isn't just a bag of files

An archive can contain paths that try to escape the destination, conflicting filenames, or much more expanded data than its download size suggests. A failed extraction can also leave a directory that looks usable even though it only contains half a package.

The tool unpacks into a private staging directory, validates the result, and only then publishes the cache entry. The filesystem operations use confined directory handles and refuse to follow links during file creation. Checking a path as a string and then writing through it wouldn't be enough if the filesystem changed between those operations.

The initial limits are 64 MiB compressed, 256 MiB expanded, and 16,384 filesystem entries per archive. I've kept support to a defined tar subset, with regular files and directories; unsupported archive features are rejected. These are deliberate limits on what the tool promises to handle.

Replacing one cache entry is atomic. Replacing every dependency and the lockfile together isn't one giant filesystem transaction, though. If publication fails partway through an update, an explicit restore may be needed before the project can compile. The checks prevent a half-prepared state from being treated as ready.

That's a limitation worth stating plainly rather than hiding behind the word “atomic”.

## The HTTP work came back into play

HTTPS archives reuse the HTTP work from the last article, but I couldn't just feed a package download through the existing buffered client. Its body limit was 1 MiB, while the package contract allowed compressed archives up to 64 MiB.

I proved that mismatch with a small command-line probe, then added bounded streaming through the existing transport. Chunks now flow through the HTTP framing, gzip decoder and archive reader without collecting the whole expanded archive in memory.

The tests include an incompressible 2 MiB archive, so they actually cross the old limit. They also record requests. When I say checking a prepared project makes no requests, there's a test watching for them; I'm not assuming that because the command happened to succeed.

Changed remote bytes are another case I've tested. Restore rejects an archive that no longer matches its locked hash. Accepting new content is an update decision.

## Git has more going on than you might expect

Git support uses the installed Git executable, but I don't want fetching a package to inherit arbitrary behaviour from someone's machine or from the repository.

Git configuration can rewrite URLs, invoke credential helpers and apply filters. Even checking out a file can change its bytes through line-ending conversion or attributes. That's awkward when the whole point is to obtain an exact source snapshot.

The acquisition work uses an isolated environment and a private repository, with hooks, helpers and external protocols disabled. It reads the exact commit's tree and raw blobs instead of running a normal checkout. Submodules and Git LFS content are rejected for this first implementation.

That exposed a missing general capability too: disabling Git's configuration files didn't remove Git settings inherited through the process environment. I added an explicit isolated-process operation so the child receives exactly the environment the caller supplies. The Git policy stays in Panackelty.

For repositories containing several packages, the design uses one shared snapshot for the locked commit. Two dependencies that reach the same sibling package should arrive at the same physical package, not separate copies. Paths must remain inside the snapshot, and a package still can't use a symlink to read a sibling's private source. It needs a declared dependency.

The snapshot acquisition is working, but wiring it into those package relationships is still ahead. There's a limitation in acquisition too: the expanded tree is bounded, but Git's fetched pack doesn't yet have a byte quota. I shouldn't describe that as a fully bounded download.

## What still needs finishing

The next work connects Git snapshots to manifests, locks and shared package graphs, then tests the remote-source workflows together. After that comes final installation, help, diagnostics and acceptance across the supported native platforms.

The [package-management contract](https://github.com/sproates/panackelty/blob/next/docs/design/PACKAGE_MANAGEMENT_CONTRACT.md) and [implementation notes](https://github.com/sproates/panackelty/blob/next/docs/design/PACKAGE_MANAGEMENT_IMPLEMENTATION.md) go into the details. The [local dependency acceptance record](https://github.com/sproates/panackelty/blob/next/docs/design/PACKAGE_LOCAL_ACCEPTANCE.md) includes the hashing measurements and their limits.

What I'm looking forward to is taking the sort of small service we built in the last article, putting its reusable bits in another project, and having a straightforward way to bring them back in. There's quite a lot underneath that simple workflow. Getting those details right is the work now.
