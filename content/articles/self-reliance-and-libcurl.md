---
title: Self-reliance is not starting from scratch
status: published
date: 2026-10-14
tags:
  - self-hosting
  - security
  - HTTP
---

Panackelty puts a lot of weight on being able to understand and rebuild its own tools. It would be easy to turn that into a rule: if we rely on another project, we haven't done the job ourselves.

I don't think that follows. Self-reliance should mean owning the decisions that define Panackelty and being able to explain how its tools behave. It doesn't mean writing a private version of every piece of infrastructure underneath them.

The alpha.13 HTTP client is a good example of where I think that line belongs.

## Some jobs are better left to a specialist

An HTTPS request involves more than sending a few bytes to a server. Before any HTTP message is exchanged, the client has to find the host, open a connection and establish an encrypted session. It also has to check that the server's certificate chains to something trusted and that the certificate is for the host we meant to contact. Encryption without those identity checks can leave us talking securely to the wrong server.

TLS and certificate handling have enough detail and edge cases that I don't want Panackelty to grow its own implementation simply to avoid a dependency. If we get that code wrong, the failure might be invisible: a request appears to work, but a hostile server can read or change the traffic.

## Keep the boundary clear

For the alpha.13 proof of concept, I'm using libcurl for DNS, connection setup and verified TLS. Its connect-only mode establishes the connection and then lets the application exchange raw bytes over it. The [libcurl documentation describes that mode](https://curl.se/libcurl/c/CURLOPT_CONNECT_ONLY.html).

Panackelty still owns quite a lot. Its package validates the URL, constructs the HTTP request, parses the response, applies size and time limits, and turns failures into Panackelty values. The VM talks to a private native adapter; Panackelty programs don't see libcurl handles, option names or error strings. If we replace the transport later, the package interface can stay the same.

That separation matters to me. The language and its package decide what an HTTP response means to a Panackelty program. libcurl supplies the lower-level networking and TLS machinery, where using an established implementation is more sensible than writing another one ourselves.

## A dependency still needs checking

Using libcurl doesn't make the HTTP client secure by itself. The program still has to configure certificate and host-name verification correctly. The [libcurl certificate guidance](https://curl.se/docs/sslcerts.html) explains why both checks matter and how its trust configuration affects them.

There is also a real question about this particular boundary. libcurl's [send and receive example](https://curl.se/libcurl/c/sendrecv.html) cautions against using its raw functions to implement a protocol it already supports, such as HTTP. Panackelty keeps its HTTP parser in the package so that the language owns its framing rules, limits and error values. That's a deliberate choice, but it also means we own a parser that has to reject malformed and ambiguous responses. The choice needs to earn its place through the implementation and its tests; it isn't automatically the safest design just because TLS comes from libcurl.

For that reason, the proof of concept needs to check more than a successful request. A trusted certificate should work; an untrusted certificate and a certificate for the wrong host should fail. Timeouts, oversized responses and malformed framing need clear outcomes too. And the dependency has to work in the native builds we support, with its version and build configuration understood. The browser and WASI builds don't support this client yet.

## What self-reliance means here

Panackelty doesn't become less self-reliant by using libcurl. It would become less dependable if it tried to own cryptography without a good reason or enough evidence that its implementation was safe.

For me, the useful test is whether I can explain the boundary: what Panackelty controls, what libcurl controls, which assumptions each side makes, and how we check that they fit together. If the alpha.13 work shows that this split creates more risk than it removes, then the split should change. Self-reliance isn't a reason to defend a design that doesn't work.
