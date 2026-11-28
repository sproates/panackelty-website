---
title: A status endpoint with something to report
summary: Build and run an alpha.16 HTTP service that combines an anonymous async handler, retained values and shared State to report its uptime and request count.
status: published
date: 2026-11-28
publishedAt: 2026-11-28T14:06:02.067Z
tags:
  - standard library
  - language design
  - HTTP
---

The previous articles looked at [closures](/articles/closures-without-hidden-mutation/) and [shared State](/articles/making-shared-state-explicit/) separately. Now I want to put them to work in a complete program.

The service will have one endpoint, `GET /status`. Each call returns the number of requests counted and how long the service has been running. The handler needs a fresh clock reading, a startup time that stays fixed, and a counter shared between calls.

That gives each feature a job. The anonymous function is the handler, its closure retains the startup time and counter handle, and State coordinates changes to the count. The async standard library supplies the clock and State operations.

## Get the project ready

Install [Panackelty alpha.16](/get-started/) or use an existing alpha.16 installation. This is a native HTTP service: the browser playground can't open a listening socket.

Check that your shell is using alpha.16:

```sh
panack --version
```

This should report `panack 0.1.0-alpha.16 (bytecode 9)`.

[Download the complete status-service project](/downloads/status-service-alpha16.zip) and extract it. The download includes the program, its manifest and lockfile, and the matching HTTP package. You don't need to create or copy any project files.

Extract the ZIP and open a terminal in its `status-service` directory. Alternatively, from the directory containing the downloaded ZIP, run:

```sh
unzip status-service-alpha16.zip
cd status-service
```

The installed alpha.16 toolchain provides the compiler and standard library. The project includes everything else it needs.

## Run it and make a request

From the extracted `status-service` directory, start the service:

```sh
panack run --project panack.json 8082
```

Leave that terminal running. In another terminal, make two requests:

```sh
curl -i --write-out '\n' http://127.0.0.1:8082/status
curl -i --write-out '\n' http://127.0.0.1:8082/status
```

Each response has HTTP status 200. The `-i` option prints the response headers, and `--write-out` adds a newline after each body. The two bodies will look like this:

```text
Requests counted: 1; uptime: 0.075402 seconds
Requests counted: 2; uptime: 0.088976 seconds
```

Your uptime values will differ. The count should increase each time the handler is called.

Now request a route that doesn't exist:

```sh
curl -i --write-out '\n' http://127.0.0.1:8082/missing
```

That returns 404. Call `/status` again and, assuming no other requests, the count is 3. The missing route didn't run the handler or update its counter.

The server binds to `127.0.0.1`, so only this machine can connect. Ctrl-C stops it. Start it again and the first `/status` request reports 1, with uptime measured from the new startup. If port 8082 is occupied, use another available port in both the run command and the URL.

## The complete program

This is `src/main.panack` in the download:

```panack
import http/server as http
import stdlib/time/async as time
import stdlib/state/async as state
import stdlib/host/async as host

async main(): Unit {
  arguments = await host.arguments()
  port = if arguments.len() == 0 { 8082 } else { arguments[0].parse_nat() }
  match await time.now() {
    Error(problem) => {
      reported = await host.stderr("Cannot start: the monotonic clock is unavailable.")
      await host.exit(1)
    },
    Ok(started) => {
      requests = await state.create[Nat](0)
      server = http.create_bound_server("127.0.0.1", port)
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
            seconds = elapsed.as_seconds().dec()
            response.send("Requests counted: ${total}; uptime: ${seconds} seconds")
            Ok(())
          }
        }
      })
      match await server.listen() {
        Ok(done) => (),
        Error(problem) => {
          reported = await host.stderr(problem.message)
          await host.exit(1)
        }
      }
    }
  }
}
```

## Capture what belongs to the service

`main` is async because startup uses async operations: reading the clock, creating State and running the server. The HTTP handler is async too, so each request can await the State update and a fresh clock reading.

Startup reads the monotonic clock with `await time.now()`. A monotonic clock measures elapsed time; it isn't a calendar date. If that first read fails, the program reports the problem and exits before starting the server.

On success, `started` holds the startup instant. `await state.create[Nat](0)` creates a counter initially containing zero. Both are created once, before registering the route.

The function passed to `server.get` is anonymous and explicitly async. It refers to `started` and `requests` from the enclosing code, so its closure retains those values for later requests.

The startup instant is immutable. The `requests` handle keeps referring to the same State cell, the shared storage holding the count. Updating that cell changes the count for subsequent requests; it doesn't reassign the captured handle.

The request and response writer are parameters supplied for each invocation. The closure doesn't capture either resource, or the server itself.

## Count, then read the clock

At the beginning of the handler, this update increments the shared counter:

```panack
total = await state.update(requests, (current: Nat) => current + 1)
```

The inner anonymous function is pure: it calculates the next count. The State operation commits the change and returns that new count as `total`.

Each update uses the current value supplied to its callback. Two completed increments can't overwrite each other by both calculating from the same old count.

The handler then gets a fresh clock reading. Subtracting the retained startup instant gives an elapsed duration, and `as_seconds()` expresses it as an exact fraction of a second. Calling `.dec()` converts that to decimal seconds for the response. This conversion is exact: the clock measures whole nanoseconds, so these values always have a finite decimal representation.

The async imports keep the familiar names: `time.now()`, `state.create()` and `state.update()`. Their calls use `await`. Registering the route happens before `await server.listen()` starts serving requests.

The handler returns `Result[Unit,Str]`. Here, `Ok(())` says the handler completed successfully, with no additional value to return. Sending an HTTP 503 response for a failed clock read is still a handled outcome: the program has deliberately sent an explanation to the caller.

## Be precise about what the number means

“Requests counted” means requests whose counter update completed in the `/status` handler. A missing route or a request rejected because the server is at capacity never reaches that update.

The increment happens before the clock read. If that read fails, the handler sends HTTP 503 with the count and an uptime-unavailable explanation. The request remains counted. A failure or cancellation after the update commits doesn't undo the increment either.

The count is kept in memory. Restarting the service creates a new State cell starting at zero.

## Try a change

Change the increment from `current + 1` to `current + 2`, stop the service and run it again. The first two counts will now be 2 and 4. Then restore the increment and change the route from `/status` to `/health`, updating the URL you request as well.

If you'd rather make the context an explicit parameter, there is a [named-handler example](https://github.com/sproates/panackelty/tree/v0.1.0-alpha.16/examples/network/http_state_contextual). State works with either approach. The closure version keeps the setup and the behaviour that uses it together, which I think makes this particular example easy to follow.
