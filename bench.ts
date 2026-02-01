import { type Route, route } from "@iuioiua/plain";

const routes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/user" }),
    handlers: {
      GET: () => new Response("User route"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/user/comments" }),
    handlers: {
      GET: () => new Response("User comments"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/user/avatar" }),
    handlers: {
      GET: () => new Response("User avatar"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/user/lookup/username/:username" }),
    handlers: {
      GET: () => new Response("User lookup by username"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/user/lookup/email/:address" }),
    handlers: {
      GET: () => new Response("User lookup by email"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/event/:id" }),
    handlers: {
      GET: () => new Response("Event details"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/event/:id/comments" }),
    handlers: {
      GET: () => new Response("Event comments"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/event/:id/comment" }),
    handlers: {
      "POST": () => new Response("Post event comment"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/map/:location/events" }),
    handlers: {
      GET: () => new Response("Events at location"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/status" }),
    handlers: {
      GET: () => new Response("Status OK"),
    },
  },
  {
    pattern: new URLPattern({
      pathname: "/very/deeply/nested/route/hello/there",
    }),
    handlers: {
      GET: () => new Response("Hello from nested route"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/static/*" }),
    handlers: {
      GET: () => new Response("Static file response"),
    },
  },
];

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
  Deno.bench(name, async () => {
    const request = new Request(`http://localhost${path}`, { method });
    await route(routes, request);
  });
});
