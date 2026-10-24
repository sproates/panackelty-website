---
title: Bringing packages to Panackelty
status: draft
summary: How package management is taking shape, the choices I've made, and a few things that needed another go.
tags:
  - packages
  - tooling
  - alpha.15
---

In the [HTTP service article](/articles/building-a-small-http-service-in-panackelty/), we pointed a project at the HTTP package sitting beside it. Nice and simple, provided the code is already on your machine. But I'd like to be able to put a library in another repository and use it from there, or give someone an archive without making them sort out where everything belongs.

That's what I'm working on now: package management for Panackelty. It's planned for alpha.15, so you won't find it in the current alpha.14 download.

Quite a bit works already in development. Local directories, local archives and HTTPS archives have working dependency workflows. The tool can fetch an exact Git snapshot too, although connecting that to dependency declarations and the lockfile is still ahead. It hasn't all gone smoothly, and some of the more useful decisions came from things that didn't work out.

## Start with the code you already have

I've kept the first version to four sources: local directories, local `.tar.gz` archives, HTTPS archives and Git repositories. Git will also let you pick a package from a subdirectory, because a repository might contain several of them.

No central registry for now. Getting source from those places and using it reliably is enough to be getting on with, without also building a publishing service. Dependency build scripts and native-library management aren't part of this work either.

The declarations stay in `panack.json`, where you can edit them yourself. And a local directory stays where you put it. If you're working on an app and a library together, you can change the library's source and the app sees it straight away. There's no second copy tucked away somewhere that you have to remember to refresh.

That does mean a local directory is deliberately live. The lock records its package identity and manifest, but doesn't freeze all its source files. Archives and Git snapshots have a different job: they represent particular content that I want to be able to get back to.

## Making sure we don’t go fishing around for dependencies on the quiet

If I ask Panackelty to check my program, I want it to check my program. I don't want that to quietly turn into downloading dependencies or deciding to use newer ones.

So there are three separate commands:

- `panack deps lock` works out the dependencies and writes a missing lockfile. If the lock is already current, it leaves it alone.
- `panack deps update` changes those choices deliberately, either for selected dependencies or for the whole graph.
- `panack deps restore` prepares the sources recorded in the lock. It doesn't choose newer versions or rewrite the lockfile.

They take `--project panack.json` to select the project.

The lockfile is `panack.lock.json`. It records the whole dependency graph, including dependencies of dependencies. Archives are pinned by a hash of their exact compressed bytes, and a Git branch or tag will be resolved to a full commit ID when you lock or update it. Someone moving a tag afterwards shouldn't change what you get when you restore.

Then `check`, `compile` and `run` use what's already been prepared. Missing dependency? Stale lock? Tell me what I need to do. Don't fix it behind my back. This applies to preparing dependencies, of course; a program you run can still use its own network capabilities.

Offline restore means offline too. It can unpack a locked local archive, but a remote dependency needs a verified copy in the local cache. If that isn't there, restore fails. It doesn't have a quick look online just in case.

## A package tool written in Panackelty

The package tool is written in Panackelty, and it's built separately from the compiler. I can change package handling without rebuilding the compiler or refreshing its bootstrap seed. I've tested that by changing the tool's behaviour and checking that the compiler artifact and seed remain unchanged.

The compiler gets a temporary description of the project: the packages, their source locations, exports and dependencies. It checks that description before using it, but doesn't need to know how a download happened or which Git ref someone originally asked for.

There are native libraries doing some of the work underneath. Gzip uses zlib, HTTPS uses the existing libcurl transport, and SHA-256 uses OpenSSL. The manifests, locks, archive rules and decisions about the cache are Panackelty code. Getting that split right took a bit of work.

## Redoing a bad approach

The first archive implementation got nested-directory extraction wrong. It also had a problem with the ordering used to calculate the source-tree digest, which is the hash used to check the unpacked content.

So I reverted it.

Those are fairly basic things to need from a package tool. Source files live in nested directories, and a hash is only useful for comparing trees if the same tree is always described the same way. I went back to the agreed design and started again with a clearer split between the package code, compiler and native operations.

This time I first proved that the separate tool could hand a working local project to the compiler. Then I built the lock and archive workflow around that, with test data covering nested paths, empty directories and independently calculated hashes. Mixed-case filenames got their own attention too: the order used for hashing isn't the same thing as deciding whether two names collide on a filesystem. The digest keeps the original UTF-8 bytes and sorts them in a defined order.

The [revert is there in the history](https://github.com/sproates/panackelty/pull/573). None of that first attempt had been released, and keeping it just because I'd already done the work wouldn't have made it a better starting point.

## Writing it myself still needs to be practical

I initially had SHA-256 written in Panackelty too. On the development Mac, a test hashing 64 KiB took 35.05 seconds.

That's a long time to wait for 64 KiB.

The same program using OpenSSL took 0.11 seconds and produced the same hash. Both timings include constructing the input buffer, so this isn't a general benchmark of Panackelty, but it was enough to tell me that the original approach wasn't practical for routine package checks.

I changed it to use OpenSSL through a small interface that accepts chunks of bytes. Panackelty still decides which paths and content go into the hash and in what order. The native code just does the hashing; it knows nothing about packages or lockfiles.

There are other costs to look at. Thousands of tiny archive entries put pressure on collection operations, and the Git implementation starts processes to extract individual files. A fast hash doesn't fix either of those.

## An archive isn't just a bag of files

Unpacking sounds straightforward until a filename tries to escape the destination, two entries clash, or a small download expands into something enormous. Then there's the boring but quite likely case where something fails halfway through. I don't want half a package sitting in the cache looking ready to use.

The tool unpacks into a private staging directory and checks the result before making it available. Underneath, directory handles keep file creation inside the intended location without following links. Just checking a path as text wouldn't be enough: the filesystem could change between checking it and writing the file.

For this first version, archives are limited to 64 MiB compressed, 256 MiB expanded and 16,384 filesystem entries. There's a defined tar subset supporting regular files and directories. Unsupported features get an error.

One detail I don't want to gloss over: replacing an individual cache entry is atomic, but replacing a whole set of dependencies and the lockfile isn't one big transaction. If an update fails during that process, you may need to run restore before compiling. The checks stop the compiler treating that unfinished state as ready.

## The HTTP work came back into play

I'd already got an HTTP client, but it buffered responses and had a 1 MiB body limit. Package archives were allowed to be up to 64 MiB compressed. That wasn't going to fit.

A small command-line probe confirmed the problem. I added bounded streaming through the existing transport, so chunks can pass through the HTTP framing, gzip decoder and archive reader without holding the whole expanded archive in memory. The tests include an incompressible 2 MiB archive, which makes sure they're actually getting past the old limit.

They watch the requests as well. When I say checking a prepared project doesn't fetch anything, there's a test looking for exactly that. A successful run on its own wouldn't prove it hadn't contacted a server.

And if an archive at the same URL changes, restore rejects it because its bytes no longer match the locked hash. Accepting the new content needs an update.

## Git has more going on than you might expect

Using the installed Git executable saves implementing Git, but it brings some behaviour I definitely don't want happening during a package fetch. Configuration can rewrite URLs or invoke credential helpers. A checkout can apply filters or change line endings. I want the files from the selected commit, so having Git helpfully change them on the way out is a problem.

The tool uses an isolated environment and a private temporary repository, with hooks, helpers and external protocols disabled. It reads the commit's tree and raw file contents instead of doing a normal checkout. Submodules and Git LFS aren't supported in this first version.

Even turning off Git's configuration files wasn't enough. Git settings could still come in through the inherited process environment. I added a general isolated-process operation so the child gets exactly the environment it's given, rather than whatever happens to be set on the machine.

For repositories with several packages, the plan is to keep one shared snapshot of the locked commit. If two dependencies both need the same sibling package, they should find the same physical copy. Relative paths can find siblings inside that snapshot, but source loading still respects each package's own boundary. A symlink isn't a way to get at another package's private files.

The snapshot fetching works. Connecting it to those dependency relationships is still to do. And although the expanded tree has limits, Git's fetched pack doesn't yet have a byte quota, so there is still a limit missing on the download and temporary disk side.

## What still needs finishing

Next I need to connect Git snapshots to the manifests and locks, exercise the shared package graphs, and test the remote workflows together. Then there's the final installation work, help, diagnostics and checks across the supported native platforms before this is ready to release.

If you'd like the detail, there's a [package-management contract](https://github.com/sproates/panackelty/blob/next/docs/design/PACKAGE_MANAGEMENT_CONTRACT.md), some [implementation notes](https://github.com/sproates/panackelty/blob/next/docs/design/PACKAGE_MANAGEMENT_IMPLEMENTATION.md), and the [local dependency acceptance record](https://github.com/sproates/panackelty/blob/next/docs/design/PACKAGE_LOCAL_ACCEPTANCE.md), which includes those hashing measurements.

I'm looking forward to taking the little service from the last article, pulling some reusable code into its own project and bringing it back in as a dependency. It's quite a simple thing to want to do. There's a surprising amount to get right underneath it.
