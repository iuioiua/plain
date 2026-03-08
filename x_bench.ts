import { type Route, route } from "./mod.ts";
import findMyWay from "find-my-way";

const findMyWayRouter = findMyWay();
findMyWayRouter.get("/user", () => new Response("User route"));
findMyWayRouter.get("/user/comments", () => new Response("User comments"));
findMyWayRouter.get("/user/avatar", () => new Response("User avatar"));
findMyWayRouter.get(
  "/user/lookup/username/:username",
  () => new Response("User lookup by username"),
);
findMyWayRouter.get(
  "/user/lookup/email/:address",
  () => new Response("User lookup by email"),
);
findMyWayRouter.get("/event/:id", () => new Response("Event details"));
findMyWayRouter.get(
  "/event/:id/comments",
  () => new Response("Event comments"),
);
findMyWayRouter.post(
  "/event/:id/comment",
  () => new Response("Post event comment"),
);
findMyWayRouter.get(
  "/map/:location/events",
  () => new Response("Events at location"),
);
findMyWayRouter.get(
  "/very/deeply/nested/route/hello/there",
  () => new Response("Hello from nested route"),
);
findMyWayRouter.get("/static/*", () => new Response("Static file response"));

const usernamePattern = new URLPattern({
  pathname: "/user/lookup/username/:username",
});
const addressPattern = new URLPattern({
  pathname: "/user/lookup/email/:address",
});
const eventIdPattern = new URLPattern({
  pathname: "/event/:id",
});
const eventCommentsPattern = new URLPattern({
  pathname: "/event/:id/comments",
});
const eventCommentPattern = new URLPattern({
  pathname: "/event/:id/comment",
});
const eventLocationPattern = new URLPattern({
  pathname: "/map/:location/events",
});
const staticPattern = new URLPattern({
  pathname: "/static/*",
});

const routes: Route[] = [
  {
    matcher: ({ pathname }) => pathname === "/status",
    handlers: {
      GET: () => new Response("User route"),
    },
  },
  {
    matcher: ({ pathname }) => pathname === "/user/comments",
    handlers: {
      GET: () => new Response("User comments"),
    },
  },
  {
    matcher: ({ pathname }) => pathname === "/user",
    handlers: {
      GET: () => new Response("User avatar"),
    },
  },
  {
    matcher: ({ href }) => usernamePattern.test(href),
    handlers: {
      GET: () => new Response("User lookup by username"),
    },
  },
  {
    matcher: ({ href }) => addressPattern.test(href),
    handlers: {
      GET: () => new Response("User lookup by email"),
    },
  },
  {
    matcher: ({ href }) => eventIdPattern.test(href),
    handlers: {
      GET: () => new Response("Event details"),
    },
  },
  {
    matcher: ({ href }) => eventCommentsPattern.test(href),
    handlers: {
      GET: () => new Response("Event comments"),
    },
  },
  {
    matcher: ({ href }) => eventCommentPattern.test(href),
    handlers: {
      "POST": () => new Response("Post event comment"),
    },
  },
  {
    matcher: ({ href }) => eventLocationPattern.test(href),
    handlers: {
      GET: () => new Response("Events at location"),
    },
  },
  {
    matcher: ({ pathname }) => pathname === "/user/profile",
    handlers: {
      GET: () => new Response("Status OK"),
    },
  },
  {
    matcher: ({ pathname }) =>
      pathname === "/very/deeply/nested/route/hello/there",
    handlers: {
      GET: () => new Response("Hello from nested route"),
    },
  },
  {
    matcher: ({ href }) => staticPattern.test(href),
    handlers: {
      GET: () => new Response("Static file response"),
    },
  },
];

// TODO: add benchmark for `find-my-way`
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
  const request = new Request(`http://localhost${path}`, { method });
  const pathname = new URL(request.url).pathname;
  Deno.bench("route", { group: name }, () => {
    route(routes, request);
  });
  Deno.bench("hono", { group: name }, () => {
    // @ts-ignore It's fine
    findMyWayRouter.find(request.method, pathname);
  });
});
