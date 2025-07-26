# plain

Plain, boring utilities for creating web apps.

```ts
import { createHandler, html, HttpError, type Routes } from "@iuioiua/plain";

const routes: Routes = {
  "GET /": () =>
    new Response(
      html`
        <h1>Hello, world!</h1>
      `,
      { headers: { "Content-Type": "text/html" } },
    ),
  "POST /unauthorized": () => {
    throw new HttpError(401);
  },
};
const handler = createHandler(routes);

export default {
  fetch: handler,
};
```
