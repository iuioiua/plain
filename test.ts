import { html, HttpError, type Route, route } from "@iuioiua/plain";
import { assertEquals } from "@std/assert/equals";
import { assertInstanceOf } from "@std/assert/instance-of";
import { assertRejects } from "@std/assert/rejects";
import { assertThrows } from "@std/assert/throws";

Deno.test("HttpError", async (t) => {
  await t.step("defaults", () => {
    const error = new HttpError(500);
    assertInstanceOf(error, Error);
    assertEquals(error.name, "HttpError");
    assertEquals(error.status, 500);
    assertEquals(error.message, "Internal Server Error");
    assertEquals(error.cause, undefined);
    assertEquals(error.init, undefined);
  });

  await t.step("user-defined properties", () => {
    const error = new HttpError(404, "Not Found", {
      cause: { foo: "bar" },
      init: { headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' } },
    });
    assertInstanceOf(error, Error);
    assertEquals(error.name, "HttpError");
    assertEquals(error.status, 404);
    assertEquals(error.message, "Not Found");
    assertEquals((error.cause as { foo: string })?.foo, "bar");
    assertEquals(
      error.init?.headers?.["WWW-Authenticate"],
      'Basic realm="Secure Area"',
    );
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
    const response = await route(routes, request);
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
    const response = await route(routes, request);
    assertInstanceOf(response, Response);
    assertEquals(response.status, 200);
    assertEquals(await response.text(), "123");
  });

  await t.step("no matching URL", async () => {
    const routes: Route[] = [
      {
        pattern: new URLPattern({ pathname: "/test" }),
        handlers: {
          GET: () => new Response("I'm a static route"),
        },
      },
    ];
    const request = new Request("http://localhost/nonexistent");
    const error = await assertRejects(
      () => route(routes, request),
      HttpError,
      "Not Found",
    );
    assertEquals(error.status, 404);
    assertEquals(error.cause, request);
  });

  await t.step("no matching method", async () => {
    const routes: Route[] = [
      {
        pattern: new URLPattern({ pathname: "/test" }),
        handlers: {
          GET: () => new Response("I'm a static route"),
        },
      },
    ];
    const request = new Request("http://localhost/test", { method: "POST" });
    const error = await assertRejects(
      () => route(routes, request),
      HttpError,
      "Method Not Allowed",
    );
    assertEquals(error.status, 405);
    assertEquals(error.cause, request);
  });

  await t.step("throws error thrown in handler", async () => {
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
    const error = await assertRejects(
      () => route(routes, request),
      HttpError,
      "I'm a 404 message",
    );
    assertEquals(error.status, 404);
    assertEquals((error.cause as { foo: string })?.foo, "bar");
  });

  await t.step("async handler", async () => {
    const routes: Route[] = [
      {
        pattern: new URLPattern({ pathname: "/async" }),
        handlers: {
          GET: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return new Response("Async response");
          },
        },
      },
    ];
    const request = new Request("http://localhost/async");
    const response = await route(routes, request);
    assertInstanceOf(response, Response);
    assertEquals(response.status, 200);
    assertEquals(await response.text(), "Async response");
  });

  await t.step("async handler throws error", async () => {
    const routes: Route[] = [
      {
        pattern: new URLPattern({ pathname: "/async-throws" }),
        handlers: {
          GET: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            throw new HttpError(500, "Async error");
          },
        },
      },
    ];
    const request = new Request("http://localhost/async-throws");
    const error = await assertRejects(
      () => route(routes, request),
      HttpError,
      "Async error",
    );
    assertEquals(error.status, 500);
  });

  await t.step("empty routes array", async () => {
    const routes: Route[] = [];
    const request = new Request("http://localhost/test");
    const error = await assertRejects(
      () => route(routes, request),
      HttpError,
      "Not Found",
    );
    assertEquals(error.status, 404);
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
