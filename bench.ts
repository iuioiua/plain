import { createHandler, type Routes } from "@iuioiua/plain";

const routes: Routes = {
  "/user": {
    GET: () => new Response("User route"),
  },
  "/user/comments": {
    GET: () => new Response("User comments"),
  },
  "/user/avatar": {
    GET: () => new Response("User avatar"),
  },
  "/user/lookup/username/:username": {
    GET: () => new Response("User lookup by username"),
  },
  "/user/lookup/email/:address": {
    GET: () => new Response("User lookup by email"),
  },
  "/event/:id": {
    GET: () => new Response("Event details"),
  },
  "/event/:id/comments": {
    GET: () => new Response("Event comments"),
  },
  "/event/:id/comment": {
    POST: () => new Response("Post event comment"),
  },
  "/map/:location/events": {
    GET: () => new Response("Events at location"),
  },
  "/status": {
    GET: () => new Response("Status OK"),
  },
  "/very/deeply/nested/route/hello/there": {
    GET: () => new Response("Hello from nested route"),
  },
  "/static/*": {
    GET: () => new Response("Static file response"),
  },
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
