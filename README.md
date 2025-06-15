# plain

Plain, boring utilities for creating web apps.

```ts
import { html, HttpError, route } from "@iuioiua/plain";

const routes = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/" }),
    handler: () =>
      new Response(
        html`
          <h1>Hello, world!</h1>
        `,
        { headers: { "Content-Type": "text/html" } },
      ),
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/unauthorized" }),
    handler: () => {
      throw new HttpError(401);
    },
  },
];

export default {
  fetch: (request: Request) => route(routes, request),
};
```
