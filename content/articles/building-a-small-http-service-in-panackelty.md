---
title: Building a small HTTP service in Panackelty
summary: Build a service, try the bundled web server, and see how I use it to preview these articles.
status: published
date: 2026-10-23
tags:
  - HTTP
  - tooling
  - types
  - alpha.14
---

Seeing a site running on a server written in Panackelty felt like a great achievement. Open a browser, load a page, and there it is. A program written in this language is actually serving the site. I'm really pleased with how far it's come.

With alpha.14, there's enough here to build a small HTTP service and give it a proper try. We can register routes, share settings between handlers, read headers and bodies, and decide what to send back. So let's do that.

If you read the [previous article](/articles/giving-panackelty-methods-a-proper-home/), this is where the method work starts to pay off. We can write `server.get(...)`, `request.header(...)` and `response.send(...)`, and the compiler knows which type each method belongs to and what arguments it expects.

## Let's build one

We'll keep it small: a greeting, a health endpoint and an echo route that sends back whatever we give it. If we ask for something that isn't there, we'll get a 404.

We'll also give the server a greeting and a name. Those go into an `AppContext` record, which the server passes to each handler. No global variable needed.

Grab the native [alpha.14 release](/get-started/) for your machine, unpack it and open a terminal in the extracted `panackelty` directory. You should see `bin`, `packages` and `examples`. You'll need the native release for this one; the browser playground doesn't support networking.

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

This tells Panackelty where our code lives and where to find the bundled HTTP package. Keep `demo-service` beside `packages`, because that `../packages/http` path is relative to the manifest.

## The complete program

Here's the whole thing. Save it as `demo-service/src/main.panack`, then we'll run it and look at what the handlers do:

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

Once you see the listening address, leave that terminal alone and open another to send some requests. If something else is using port 8080, pick another port and change it in both the program and the URLs below.

## Let's send it something

First, just ask for the home page:

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

The handler asks for `X-Caller`, but it can't assume we sent one. That's why `request.header` gives us an `Option[Str]`: either `Some(value)` or `None()`. We match on that, use `"visitor"` if there's no header, and put the greeting together. `response.send` sends it as text, with `text/plain; charset=utf-8` as the default content type.

I like how straightforward that is. A missing header is something we expect and handle, so we just give it a default.

Now try the health endpoint. The `-i` lets us see the response headers too:

```sh
curl -i http://127.0.0.1:8080/health
```

You'll get `200 OK`, the header `X-Service: article-demo`, and `OK` in the body. That service name came from our `AppContext`. It's a very simple health check: it tells us the server can answer, but it isn't checking a database or anything else behind it.

Finally, send a body:

```sh
curl -i --data-binary 'A small service, written in Panackelty.' http://127.0.0.1:8080/echo
```

And back it comes, with status 200 and content type `application/octet-stream`. The echo handler uses `send_bytes`, so it doesn't need to know whether the body contains text. It just sends the bytes back. There are `put` and `delete` methods for registering those routes too.

## Why does a handler return `Ok(())`?

You might have noticed that each handler sends a response and then returns `Ok(())`. Its return type is:

```panack
Result[Unit,Str]
```

We've already set the response body with `response.send(...)`. The `Ok(())` tells the framework that the handler finished successfully. There's no extra value to hand back, so we return the `Unit` value, `()`. I've written a bit more about this in [What is Unit in Panackelty?](/articles/what-is-unit-in-panackelty/).

So a 404 response can still end in `Ok(())`. The handler did its job: someone asked for a route that doesn't exist, and we told them. Try it:

```sh
curl -i http://127.0.0.1:8080/missing
```

The response has status 404 and the body:

```text
No route for /missing
```

The compiler checks the handlers too. We gave `create_bound_contextual_server` an `AppContext`, so it expects each handler to take that context, a request and a response writer. Give it a function with the wrong signature and the compiler will complain.

Don't need shared settings? Use `create_bound_server` instead. Its handlers just take the request and response writer.

## Getting it running, and stopping it again

Once `await server.listen()` succeeds, we're ready to take requests. The listener keeps the process running even after `main` has finished. We don't have to write a loop just to keep it alive.

Of course, starting a server can fail. Something else might already be using the port. That's why we match on the result: print the listening address if it worked, or print the error and exit with status 1 if it didn't.

For now, Ctrl-C is enough to stop our example. If your program needs to stop the server itself, there's `await server.close()`, which stops taking new work and gives active handlers and response writes up to a second to finish. Or use `await server.destroy()` to cancel active work straight away. Both return a result that you'll need to handle.

## Panackelty comes with a web server

And here's a bit I'm particularly pleased with: you don't even have to write the server yourself. `panack-http-server` comes in the release, right alongside `panack`. It's a working static file server, written in Panackelty using the HTTP framework we've just tried.

It ships with the language, and you can use it straight away. Unpack Panackelty, point the tool at a folder, and you've got a site you can open in a browser. I think that's pretty cool.

Let's try it. From the extracted release directory, create a folder called `demo-site`:

```sh
mkdir -p demo-site
```

Save this as `demo-site/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Served by Panackelty</title>
</head>
<body>
  <h1>Hello from Panackelty</h1>
  <p>This page is being served by a program written in Panackelty.</p>
</body>
</html>
```

Now start the server:

```sh
./bin/panack-http-server --root ./demo-site --port 8084 --no-cache --noindex
```

Open `http://127.0.0.1:8084/` in your browser. That's it. Your page, served by Panackelty. Change a bit of the HTML, save it and refresh the page. The server reads the file again on the next request, so there's no need to restart it. You do still have to refresh the browser yourself.

You can add stylesheets, images and other files to the folder too. The server supplies their content types, looks for `index.html` when you ask for a directory, and returns 404 for files that aren't there. It keeps requests inside the folder you chose and doesn't list the directory contents.

### Try it on your phone

Want to see it on your phone? Stop the server with Ctrl-C and run it again with `--host 0.0.0.0`:

```sh
./bin/panack-http-server --root ./demo-site --host 0.0.0.0 --port 8084 --no-cache --noindex
```

Connect your phone to the same network and open your computer's LAN address on port 8084, something like `http://192.168.1.10:8084/`. Use your own computer's address there. Don't put `0.0.0.0` in the browser; that tells the server where to listen. The connection also needs to be allowed through your firewall and network.

Other devices that can reach the computer can now read those files. The `--no-cache` and `--noindex` options ask browsers not to cache responses and search engines not to index the site. They don't make it private. Ctrl-C stops the server when you're done.

### I'm using it for these articles

This is how I preview articles while I'm writing them. Generate the HTML, serve it with `panack-http-server`, then have a look in the browser and on my phone. Once I'm happy with it, I publish the static HTML. No CMS needed.

While I was writing this article, I used that very tool to serve previews of it. So the HTTP API we're looking at here was also helping me put the article together. That's quite satisfying.

There are limits to bear in mind. The static server's whole response, headers included, has to fit in 1 MiB; larger files get a 503. There's no TLS, compression or range support yet. It's useful for small sites and previews, and the [static serving playbook](/playbook/http-server/#serve-a-directory) goes into more detail if you'd like to use it in your own app.

## There's more to do, but this works

A lot of the recent language work comes together in this little service. Records give us our settings, the method system gives the API its shape, and the compiler checks that the handlers fit. Then the runtime keeps it all running while requests come in. We can spend our time writing what the service does.

It is still alpha software. The server currently allows 16 open connections and four active requests. Request and response headers are limited to 16 KiB each, and each body to 1 MiB, held in memory in full. A connection gets ten seconds from acceptance to finishing its response, then closes. TLS, streaming, WebSocket, middleware and HTTP/2 aren't there yet.

The service we wrote binds to `127.0.0.1`, so you can only reach it from the same machine. It's a good place to experiment and get a feel for the API.

If you want to take it further, the [HTTP Server Reference](/reference/http-server/) covers the API and its limits, and the [playbook](/playbook/http-server/) has more examples. Or just add another route and try it. You've got a working server to build on.
