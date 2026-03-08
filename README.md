# plain

[![CI](https://github.com/iuioiua/plain/actions/workflows/ci.yml/badge.svg)](https://github.com/iuioiua/plain/actions/workflows/ci.yml)
[![JSR](https://jsr.io/badges/@iuioiua/plain)](https://jsr.io/@iuioiua/plain)

Plain, boring, framework-less utilities for creating web apps.

```ts ignore
import {
  type Handler,
  html,
  HttpError,
  type Route,
  route,
} from "@iuioiua/plain";

const routes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/" }),
    handlers: {
      GET() {
        return new Response("Welcome home!");
      },
    },
  },
  {
    pattern: new URLPattern({ pathname: "/user/:userId" }),
    handlers: {
      GET(_request, match) {
        return new Response(
          html`
            <h1>Hello, ${match.pathname.groups.userId}!</h1>
          `,
          { headers: { "Content-Type": "text/html" } },
        );
      },
    },
  },
];

export const handler: Handler = async (request) => {
  try {
    return await route(routes, request);
  } catch (error) {
    if (error instanceof HttpError) {
      return new Response(error.message, { status: error.status });
    }
    throw error;
  }
};
```
