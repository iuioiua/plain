import { createHandler, type Routes } from "@iuioiua/plain";

const routes: Routes = {
  "GET /user": () => new Response("User route"),
  "GET /user/comments": () => new Response("User comments"),
  "GET /user/avatar": () => new Response("User avatar"),
  "GET /user/lookup/username/:username": () =>
    new Response("User lookup by username"),
  "GET /user/lookup/email/:address": () => new Response("User lookup by email"),
  "GET /event/:id": () => new Response("Event details"),
  "GET /event/:id/comments": () => new Response("Event comments"),
  "POST /event/:id/comment": () => new Response("Post event comment"),
  "GET /map/:location/events": () => new Response("Events at location"),
  "GET /status": () => new Response("Status OK"),
  "GET /very/deeply/nested/route/hello/there": () =>
    new Response("Hello from nested route"),
  "GET /static/*": () => new Response("Static file response"),
};
const handler = createHandler(routes);

[
  {
    name: "short static",
    method: "GET",
    path: "/user",
  },
  {
    name: "static with same radix",
    method: "GET",
    path: "/user/comments",
  },
  {
    name: "dynamic route",
    method: "GET",
    path: "/user/lookup/username/hey",
  },
  {
    name: "mixed static dynamic",
    method: "GET",
    path: "/event/abcd1234/comments",
  },
  {
    name: "post",
    method: "POST",
    path: "/event/abcd1234/comment",
  },
  {
    name: "long static",
    method: "GET",
    path: "/very/deeply/nested/route/hello/there",
  },
  {
    name: "wildcard",
    method: "GET",
    path: "/static/index.html",
  },
].forEach(({ name, method, path }) => {
  Deno.bench(name, () => {
    const request = new Request(`http://localhost${path}`, { method });
    handler(request);
  });
});
