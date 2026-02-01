# plain

[![CI](https://github.com/iuioiua/plain/actions/workflows/ci.yml/badge.svg)](https://github.com/iuioiua/plain/actions/workflows/ci.yml)
[![JSR](https://jsr.io/badges/@iuioiua/plain)](https://jsr.io/@iuioiua/plain)

Plain, boring, framework-less utilities for creating web apps.

```ts ignore
import { html, HttpError, type Route, route } from "@iuioiua/plain";

const routes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/" }),
    handlers: {
      GET() {
        return new Response(
          html`
            <h1>Hello, world!</h1>
          `,
          { headers: { "Content-Type": "text/html" } },
        );
      },
    },
  },
  {
    pattern: new URLPattern({ pathname: "/me" }),
    handlers: {
      POST() {
        throw new HttpError(401);
      },
    },
  },
];

Deno.serve((request) => route(routes, request));
```
