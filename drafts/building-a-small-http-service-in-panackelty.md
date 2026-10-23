---
title: Building a small HTTP service in Panackelty
status: draft
tags:
  - HTTP
  - practical examples
  - alpha.14
---

Seeing a site hosted by a service built in Panackelty felt like a great achievement. There was something quite different about opening a page in a browser and knowing that a programme written in this language was serving it. It made the progress feel tangible.

A useful way to see how far Panackelty has come is to build something with it. With alpha.14, we can write a small HTTP service with named routes, typed application settings, request headers and bodies, and explicit responses. The compiler checks how those pieces fit together, and the runtime keeps the service listening for requests.

In the [previous article](/articles/giving-panackelty-methods-a-proper-home/), I described the work to give methods a proper home. The HTTP API puts that work to use. Calls such as `server.get(...)`, `request.header(...)` and `response.send(...)` belong to their respective types, with signatures the compiler can check.

Let's use them to build a service we can actually talk to.

## A service with something to show

Our service will greet a caller, report that it is running, and echo a request body. It will also return a useful 404 response when a request doesn't match a route.

The greeting and service name belong to the application. We'll pass them to the server as a typed context, so every handler receives the same configuration without looking it up in a global variable.

Use the native [alpha.14 release](/get-started/) for your machine. Unpack it and open a terminal in the extracted `panackelty` directory, alongside `bin`, `packages` and `examples`. This example uses native networking; it won't run in the browser playground.

Check the compiler:

```sh
./bin/panack --version
```

It should report `0.1.0-alpha.14`. Create a directory for the service:

```sh
mkdir -p demo-service/src
```

Save this as `demo-service/panack.json`:

```json
{
  "schema": 1,
  "package": "demo.http_service",
  "version": "0.1.0",
  "language": "modules-v1",
  "toolchain": "0.1.0-alpha.14",
  "source": "src",
  "entry": "main.panack",
  "exports": {},
  "dependencies": {
    "http": { "path": "../packages/http" }
  }
}
```

The manifest points to our source and the HTTP package bundled with the release. The dependency path is relative to the manifest, so keep `demo-service` beside `packages` for these instructions.

## The complete programme

Save the following as `demo-service/src/main.panack`:

```panack
import http/server as http
import stdlib/async_host as host

record AppContext {
  greeting: Str,
  service_name: Str
}

async home(context: AppContext, request: http.Request, response: http.ResponseWriter): Result[Unit,Str] {
  caller = match request.header("X-Caller") {
    Some(value) => value,
    None() => "visitor"
  }
  response.send(context.greeting + ", ${caller}!\n")
  Ok(())
}

async health(context: AppContext, request: http.Request, response: http.ResponseWriter): Result[Unit,Str] {
  response.header("X-Service", context.service_name)
  response.send("OK\n")
  Ok(())
}

async echo(context: AppContext, request: http.Request, response: http.ResponseWriter): Result[Unit,Str] {
  response.send_bytes(request.body)
  Ok(())
}

async not_found(context: AppContext, request: http.Request, response: http.ResponseWriter): Result[Unit,Str] {
  response.status(404)
  response.send("No route for " + request.path + "\n")
  Ok(())
}

async main(): Unit {
  context = AppContext("Hello from Panackelty", "article-demo")
  server = http.create_bound_contextual_server("127.0.0.1", 8080, context)
  server.get("/", @home)
  server.get("/health", @health)
  server.post("/echo", @echo)
  server.fallback(@not_found)

  match await server.listen() {
    Ok(done) => {
      ignored = await host.stdout("Listening on http://127.0.0.1:8080/")
      ()
    },
    Error(problem) => {
      ignored = await host.stderr(problem.message)
      await host.exit(1)
    }
  }
}
```

Run it from the extracted release directory:

```sh
./bin/panack run --project demo-service/panack.json
```

Once it prints the listening address, leave that terminal running and open another for the requests below. If port 8080 is already in use, change it in the programme and the request URLs.

## Talk to the service

Start with a request that has no caller header:

```sh
curl http://127.0.0.1:8080/
```

The response body is:

```text
Hello from Panackelty, visitor!
```

Now tell it who's calling:

```sh
curl -H 'X-Caller: Ada' http://127.0.0.1:8080/
```

```text
Hello from Panackelty, Ada!
```

There are several language features working together in that short handler. `request.header` returns `Option[Str]` because a header may be absent. The `match` handles both possibilities and produces a string. Interpolation combines that string with our application greeting, and `response.send` builds a text response with the default content type `text/plain; charset=utf-8`.

The missing header is an ordinary case that we handle directly. We don't need a null check or an exception to supply a default.

Next, inspect the health response, including its headers:

```sh
curl -i http://127.0.0.1:8080/health
```

You'll see status `200 OK`, an `X-Service: article-demo` header and the body `OK`. The header comes from our typed application context. This endpoint only confirms that the service can answer a request; it doesn't check a database or any other dependency.

Finally, send a body:

```sh
curl -i --data-binary 'A small service, written in Panackelty.' http://127.0.0.1:8080/echo
```

The response has status 200 and returns the supplied bytes with content type `application/octet-stream`. `send_bytes` lets us preserve the body as bytes, without assuming that it contains text. The server also exposes `put` and `delete` route registration methods when those operations are needed.

## The types describe the agreement

Look at the handler's result type:

```panack
Result[Unit,Str]
```

The HTTP response and the handler result serve different purposes. `response.send(...)` sets the body that the caller will receive. `Ok(())` tells the framework that the handler completed successfully. The `Unit` value means there isn't another application value to return on that successful path.

That distinction lets our fallback deliberately send a 404 and still return `Ok(())`: it successfully handled a request for a route that doesn't exist.

```sh
curl -i http://127.0.0.1:8080/missing
```

The response has status 404 and the body:

```text
No route for /missing
```

The context is checked too. Passing `AppContext` to `create_bound_contextual_server` establishes the context type for this server. Its route methods expect asynchronous handlers taking that context, a request and a response writer. A handler with an incompatible signature is a compiler error.

For a service that doesn't need shared settings, `create_bound_server` provides the simpler form whose handlers take just the request and response writer. The API gives us a choice without making every application invent its own configuration plumbing.

## Starting is an operation that can fail

`await server.listen()` returns when the listener is ready. The registered listener keeps the process alive after `main` finishes, so we don't need to write a loop to keep accepting requests.

Readiness isn't guaranteed. Another process may already own the port, for example. Our `match` handles the startup result, prints the supplied error message and exits with status 1 if the listener can't start. It only prints the listening message on success.

For this example, press Ctrl-C to stop the process. Applications that manage their own listener lifetime can use `await server.close()` or `await server.destroy()`, handling their results as well. `close` stops accepting new work and gives active handlers and response writes up to one second to finish; `destroy` cancels active work immediately.

## What this says about Panackelty

The service is small, but it depends on quite a lot of the language working together: imported packages, records, generic context types, checked function references, type-owned methods, sum types, interpolation and asynchronous execution.

We can now use those features through a library API to build a programme that keeps running and responds to other programmes. The compiler checks the handler contracts, the HTTP package supplies routing and response handling, and the runtime owns the listener's execution. Application code can concentrate on what each request should do.

There are still clear limits. Alpha.14 allows up to 16 open connections and four active requests, with 16 KiB limits for request and response headers and 1 MiB limits for each body. Bodies are held in memory in full. Each connection has ten seconds from acceptance to completing its response, and closes after that response. The server doesn't yet provide TLS, streaming, WebSocket, middleware or HTTP/2.

Our example binds to `127.0.0.1`, so it is reachable only from the same machine. Those limits make this a useful service to experiment with locally, rather than a claim that every web application can move to Panackelty today.

The [HTTP Server Reference](/reference/http-server/) describes the API and its limits, and the [HTTP server playbook](/playbook/http-server/) includes more examples, including static file serving and listener lifecycle management. A useful next step with this programme is to add a route of your own. The manifest, context, routing and error handling are already in place.
