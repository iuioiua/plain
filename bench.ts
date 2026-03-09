import { type Route, route } from "./mod.ts";
import findMyWay from "find-my-way";

function noop() {}

const routes = [
  { method: "GET", path: "/user" },
  { method: "GET", path: "/user/comments" },
  { method: "GET", path: "/user/avatar" },
  { method: "GET", path: "/user/lookup/username/:username" },
  { method: "GET", path: "/user/lookup/email/:address" },
  { method: "GET", path: "/event/:id" },
  { method: "GET", path: "/event/:id/comments" },
  { method: "POST", path: "/event/:id/comment" },
  { method: "GET", path: "/map/:location/events" },
  { method: "GET", path: "/status" },
  { method: "GET", path: "/very/deeply/nested/route/hello/there" },
  { method: "GET", path: "/static/*" },
];

const benchmarks = [
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
];

const plainRoutes: Route[] = routes.map(({ method, path }) => ({
  pattern: new URLPattern({ pathname: path }),
  handlers: { [method]: noop },
}));

const findMyWayRouter = findMyWay();
for (const route of routes) {
  // @ts-ignore It's fine
  findMyWayRouter.on(route.method, route.path, noop);
}

for (const benchmark of benchmarks) {
  const request = new Request(`http://localhost${benchmark.path}`, {
    method: benchmark.method,
  });
  const { pathname } = new URL(request.url);

  Deno.bench("@iuioiua/plain", { group: benchmark.name }, () => {
    // @ts-ignore It's fine
    route(plainRoutes, request);
  });

  Deno.bench("find-my-way", { group: benchmark.name }, () => {
    // @ts-ignore It's fine
    findMyWayRouter.find(benchmark.method, pathname);
  });
}
