import { html, HttpError, type Route, route } from "@iuioiua/plain";
import { assertEquals } from "@std/assert/equals";
import { assertInstanceOf } from "@std/assert/instance-of";
import { assertThrows } from "@std/assert/throws";

Deno.test("HttpError initialises with correct defaults", () => {
  const error = new HttpError(500);
  assertInstanceOf(error, Error);
  assertEquals(error.name, "HttpError");
  assertEquals(error.status, 500);
  assertEquals(error.message, "Internal Server Error");
  assertEquals(error.cause, undefined);
  assertEquals(error.init, undefined);
});

Deno.test("HttpError initialises with custom properties", () => {
  const error = new HttpError(401, "Unauthorized", {
    cause: new Error("Underlying error"),
    init: { headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' } },
  });
  assertInstanceOf(error, Error);
  assertEquals(error.name, "HttpError");
  assertEquals(error.status, 401);
  assertEquals(error.message, "Unauthorized");
  assertInstanceOf(error.cause, Error);
  assertEquals(error.cause?.message, "Underlying error");
  assertEquals(
    // @ts-ignore It's fine
    error.init?.headers?.["WWW-Authenticate"],
    'Basic realm="Secure Area"',
  );
});

Deno.test("route() routes static route", async () => {
  const routes = [
    {
      pattern: new URLPattern({ pathname: "/test" }),
      handlers: {
        GET: () => new Response("I'm a static route"),
      },
    },
  ];
  const request = new Request("http://localhost/test");
  const response = route(routes, request);
  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "I'm a static route");
});

Deno.test("route() routes dynamic route", async () => {
  const routes: Route[] = [
    {
      pattern: new URLPattern({ pathname: "/foo/:bar" }),
      handlers: {
        GET: () => new Response("I'm a dynamic route"),
        POST: (_request, match) => new Response(match.pathname.groups.bar),
      },
    },
  ];
  const request = new Request("http://localhost/foo/123", { method: "POST" });
  const response = route(routes, request);
  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "123");
});

Deno.test('route() throws HTTP 404 "Not Found" error if no route matches the request URL', () => {
  const routes: Route[] = [
    {
      pattern: new URLPattern({ pathname: "/test" }),
      handlers: {
        GET: () => new Response("I'm a static route"),
      },
    },
  ];
  const request = new Request("http://localhost/nonexistent");
  const error = assertThrows(
    () => route(routes, request),
    HttpError,
    "Not Found",
  );
  assertEquals(error.status, 404);
  assertEquals(error.cause, request);
});

Deno.test('route() throws HTTP 405 "Method Not Allowed" error if a route matches the request URL but does not have a handler for the request method', () => {
  const routes: Route[] = [
    {
      pattern: new URLPattern({ pathname: "/test" }),
      handlers: {
        GET: () => new Response("I'm a static route"),
      },
    },
  ];
  const request = new Request("http://localhost/test", { method: "POST" });
  const error = assertThrows(
    () => route(routes, request),
    HttpError,
    "Method Not Allowed",
  );
  assertEquals(error.status, 405);
  assertEquals(error.cause, request);
});

Deno.test("route() throws error thrown in handler", () => {
  const routes: Route[] = [
    {
      pattern: new URLPattern({ pathname: "/throws" }),
      handlers: {
        GET: () => {
          throw new HttpError(404, "I'm a 404 message", {
            cause: { foo: "bar" },
          });
        },
      },
    },
  ];
  const request = new Request("http://localhost/throws");
  const error = assertThrows(
    () => route(routes, request),
    HttpError,
    "I'm a 404 message",
  );
  assertEquals(error.status, 404);
  // @ts-ignore It's fine
  assertEquals(error.cause?.foo, "bar");
});

Deno.test("route() routes route with single handler", async () => {
  const routes: Route[] = [
    {
      pattern: new URLPattern({ pathname: "/single" }),
      handler: () => new Response("Single handler response"),
    },
  ];
  const request = new Request("http://localhost/single");
  const response = route(routes, request);
  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "Single handler response");
});

Deno.test("html() returns HTML string with interpolated values", () => {
  const a = "red";
  const b = "blue";
  const result = html`
    <span style="color: ${a};">${b}</span>
  `;
  assertEquals(
    result,
    `
    <span style="color: red;">blue</span>
  `,
  );
});
