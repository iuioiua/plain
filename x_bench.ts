import { findHandler, type Route } from "./x.ts";
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

const routes: Route[] = [
  {
    matcher: (path) => path === "/user",
    handler: () => new Response("User route"),
  },
  {
    matcher: (path) => path === "/user/comments",
    handler: () => new Response("User comments"),
  },
  {
    matcher: (path) => path === "/user/avatar",
    handler: () => new Response("User avatar"),
  },
  {
    matcher: (path) => !!path.match(/^\/user\/lookup\/username\/[^/]+$/),
    handler: () => new Response("User lookup by username"),
  },
  {
    matcher: (path) => !!path.match(/^\/user\/lookup\/email\/[^/]+$/),
    handler: () => new Response("User lookup by email"),
  },
  {
    matcher: (path) => !!path.match(/^\/event\/[^/]+$/),
    handler: () => new Response("Event details"),
  },
  {
    matcher: (path) => !!path.match(/^\/event\/[^/]+\/comments$/),
    handler: () => new Response("Event comments"),
  },
  {
    matcher: (path) => !!path.match(/^\/event\/[^/]+\/comment$/),
    handler: () => new Response("Post event comment"),
  },
  {
    matcher: (path) => !!path.match(/^\/map\/[^/]+\/events$/),
    handler: () => new Response("Events at location"),
  },
  {
    matcher: (path) => path === "/very/deeply/nested/route/hello/there",
    handler: () => new Response("Hello from nested route"),
  },
  {
    matcher: (path) => !!path.match(/^\/static\/.*$/),
    handler: () => new Response("Static file response"),
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
  Deno.bench("x", { group: name }, () => {
    findHandler(routes, pathname);
  });
  Deno.bench("hono", { group: name }, () => {
    // @ts-ignore It's fine
    findMyWayRouter.find(request.method, pathname);
  });
});
