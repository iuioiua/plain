import { html, HttpError, type Route, route } from "@iuioiua/plain";
import { assertEquals } from "@std/assert/equals";
import { assertInstanceOf } from "@std/assert/instance-of";
import { assertThrows } from "@std/assert/throws";

Deno.test("HttpError", async (t) => {
  await t.step("defaults", () => {
    const error = new HttpError(500);
    assertInstanceOf(error, Error);
    assertEquals(error.name, "HttpError");
    assertEquals(error.status, 500);
    assertEquals(error.message, "Internal Server Error");
    assertEquals(error.cause, undefined);
  });

  await t.step("user-defined properties", () => {
    const error = new HttpError(404, "Not Found", { cause: { foo: "bar" } });
    assertInstanceOf(error, Error);
    assertEquals(error.name, "HttpError");
    assertEquals(error.status, 404);
    assertEquals(error.message, "Not Found");
    // @ts-ignore It's fine
    assertEquals(error.cause?.foo, "bar");
  });
});

Deno.test("route()", async (t) => {
  await t.step("static route", async () => {
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

  await t.step("dynamic route", async () => {
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

  await t.step("no matching URL", () => {
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

  await t.step("no matching method", () => {
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

  await t.step("throws error thrown in handler", () => {
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
