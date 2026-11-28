---
title: A status endpoint with something to report
summary: A working alpha.16 service brings the async clock, closures and explicit State together to report its uptime and request count.
status: draft
previewOrder: 1
tags:
  - standard library
  - language design
  - HTTP
---

An HTTP endpoint that reports a service's uptime and request count sounds quite unremarkable. That's part of why I like it as an example.

It needs to read the clock, retain a startup time and share a counter between calls. Those are ordinary things for a service to do, and they give the new async APIs, closures and State a useful job together.

There is now a [complete example in the alpha.16 source](https://github.com/sproates/panackelty/tree/v0.1.0-alpha.16/examples/network/http_state_closure). Here's how it works.

## Read the clock at startup

The example selects the async versions of the modules:

```panack
import stdlib/time/async as time
import stdlib/state/async as state
```

Inside async startup code, `await time.now()` reads the monotonic clock. A monotonic clock is for measuring elapsed time; it isn't the time of day. The result is either an instant or a clock error.

The service checks that result before starting. If the clock isn't available, startup reports the problem and exits. Otherwise, it retains the instant as `started` and creates a shared request counter:

```panack
requests = await state.create[Nat](0)
```

That line belongs inside the successful startup branch, rather than at the top level of the file. The counter starts again at zero whenever the program restarts.

## Give the handler its context

The following is the route-registration part of the complete program. `server` has already been created, and `started` and `requests` come from startup:

```panack
server.get("/status", async (request: http.Request, response: http.ResponseWriter): Result[Unit,Str] => {
  total = await state.update(requests, (current: Nat) => current + 1)
  reading: Result[Instant,time.ClockError] = await time.now()
  match reading {
    Error(problem) => {
      response.status(503)
      response.send("Requests counted: ${total}; uptime unavailable: the clock could not be read.")
      Ok(())
    },
    Ok(now) => {
      elapsed = now.difference(started)
      seconds = elapsed.as_seconds()
      response.send("Requests counted: ${total}; uptime: ${seconds} seconds")
      Ok(())
    }
  }
})
```

The outer anonymous function is the async request handler. Its closure retains the startup instant and the handle to the counter. The request and response writer arrive as parameters; the handler doesn't capture those resources from elsewhere.

The small inner function describes the counter update. It takes the current count and returns the next one. The State API commits that change as one operation, so two requests can't both read the same count and overwrite each other's increment.

The handler then reads the clock again and measures the difference from startup. The response contains the count and elapsed seconds. Panackelty's exact numeric representation means the duration may be fractional; the example doesn't round it for display.

## What does the counter actually count?

It counts committed increments in the `/status` handler. It doesn't count requests for other routes or requests rejected before entering that handler.

The increment happens before the clock read. If the clock read fails, the response is HTTP 503 and that request is still counted. If a response fails after the increment has committed, the increment isn't undone either.

That's a small distinction, but it matters. “Requests handled” could sound like a count of successfully delivered responses, so the example says “Requests counted”. The code and the description need to agree about what the number means.

## Run the example

With alpha.16 installed, get the matching source and run the project:

```sh
git clone --depth 1 --branch v0.1.0-alpha.16 https://github.com/sproates/panackelty.git panack-alpha16
cd panack-alpha16
panack run --project examples/network/http_state_closure/panack.json 8082
```

In another terminal:

```sh
curl http://127.0.0.1:8082/status
```

Run the request again and the count increases. The server binds to loopback, so this example is local to your machine. Ctrl-C stops it. Git is used here to obtain the example source; it isn't a runtime dependency of the service.

HTTP services need the native toolchain. The browser playground can't open a listening socket, but its shared-counter example lets you try the closure and State part without installing anything.

There's also an [equivalent version with an explicit context parameter](https://github.com/sproates/panackelty/tree/v0.1.0-alpha.16/examples/network/http_state_contextual). Closures aren't mandatory. I want the language to support both approaches so the program can use whichever makes the ownership and flow easiest to understand.
