import { createHandler, html, HttpError, type Routes } from "@iuioiua/plain";
import { assertEquals } from "@std/assert/equals";
import { assertInstanceOf } from "@std/assert/instance-of";
import { assertThrows } from "@std/assert/throws";

Deno.test("HttpError - defaults", () => {
  const error = new HttpError(500);
  assertInstanceOf(error, Error);
  assertEquals(error.name, "HttpError");
  assertEquals(error.status, 500);
  assertEquals(error.message, "Internal Server Error");
  assertEquals(error.cause, undefined);
});

Deno.test("HttpError - user-defined properties", () => {
  const error = new HttpError(404, "Not Found", { cause: { foo: "bar" } });
  assertInstanceOf(error, Error);
  assertEquals(error.name, "HttpError");
  assertEquals(error.status, 404);
  assertEquals(error.message, "Not Found");
  // @ts-ignore It's fine
  assertEquals(error.cause?.foo, "bar");
});

const routes: Routes = {
  "/test": {
    GET: () => new Response("I'm a static route"),
  },
  "/foo/:bar": {
    POST: () => new Response("I'm a dynamic route"),
  },
  "/throws": {
    GET: () => {
      throw new HttpError(404, "I'm a 404 message", { cause: { foo: "bar" } });
    },
  },
  "/error": {
    PUT: () => {
      throw new SyntaxError("This is an error");
    },
  },
};
const handler = createHandler(routes);

Deno.test("route() - static route", async () => {
  const request = new Request("http://localhost/test");
  const response = handler(request);
  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "I'm a static route");
});

Deno.test("route() - dynamic route", async () => {
  const request = new Request("http://localhost/foo/123", { method: "POST" });
  const response = handler(request);
  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "I'm a dynamic route");
});

Deno.test("route() - non-matching URL", () => {
  const request = new Request("http://localhost/nonexistent");
  const error = assertThrows(
    () => handler(request),
    HttpError,
    "Not Found",
  );
  assertEquals(error.status, 404);
  assertEquals(error.cause, request);
});

Deno.test("route() - non-matching method", () => {
  const request = new Request("http://localhost/test", { method: "POST" });
  const error = assertThrows(
    () => handler(request),
    HttpError,
    "Method Not Allowed",
  );
  assertEquals(error.status, 405);
  assertEquals(error.cause, request);
});

Deno.test("route() - handler throws HttpError", () => {
  const request = new Request("http://localhost/throws");
  const error = assertThrows(
    () => handler(request),
    HttpError,
    "I'm a 404 message",
  );
  assertEquals(error.status, 404);
  // @ts-ignore It's fine
  assertEquals(error.cause?.foo, "bar");
});

Deno.test("html()", () => {
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
