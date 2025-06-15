import { css, html, HttpError, route } from "@iuioiua/plain";
import { assertEquals } from "@std/assert/equals";
import { assertInstanceOf } from "@std/assert/instance-of";
import { assertRejects } from "@std/assert/rejects";

Deno.test("HttpError", async (t) => {
  await t.step("should have the correct defaults", () => {
    const error = new HttpError(500);
    assertInstanceOf(error, Error);
    assertEquals(error.name, "HttpError");
    assertEquals(error.status, 500);
    assertEquals(error.message, "Internal Server Error");
    assertEquals(error.cause, undefined);
  });

  await t.step("should create the correct message and options", () => {
    const error = new HttpError(404, "Not Found", { cause: { foo: "bar" } });
    assertInstanceOf(error, Error);
    assertEquals(error.name, "HttpError");
    assertEquals(error.status, 404);
    assertEquals(error.message, "Not Found");
    // @ts-ignore It's fine
    assertEquals(error.cause?.foo, "bar");
  });
});

Deno.test("route", async (t) => {
  const routes = [
    {
      pattern: new URLPattern({ pathname: "/test" }),
      method: "GET",
      handler: () => new Response("I'm a static route"),
    },
    {
      pattern: new URLPattern({ pathname: "/foo/:bar" }),
      method: "POST",
      handler: () => new Response("I'm a dynamic route"),
    },
    {
      pattern: new URLPattern({ pathname: "/throws" }),
      method: "GET",
      handler: () => {
        throw new HttpError(404, "I'm a 404 message", {
          cause: { foo: "bar" },
        });
      },
    },
    {
      pattern: new URLPattern({ pathname: "/error" }),
      method: "PUT",
      handler: () => {
        throw new SyntaxError("This is an error");
      },
    },
  ];
  const info = {} as Deno.ServeHandlerInfo;

  await t.step(
    "should return the correct response for a static route",
    async () => {
      const request = new Request("http://localhost/test");
      const response = await route(routes, request, info);
      assertInstanceOf(response, Response);
      assertEquals(response.status, 200);
      assertEquals(await response.text(), "I'm a static route");
    },
  );

  await t.step(
    "should return the correct response for a dynamic route",
    async () => {
      const request = new Request("http://localhost/foo/123", {
        method: "POST",
      });
      const response = await route(routes, request, info);
      assertInstanceOf(response, Response);
      assertEquals(response.status, 200);
      assertEquals(await response.text(), "I'm a dynamic route");
    },
  );

  await t.step(
    "should throw HttpError 404 for route with non-matching URL",
    async () => {
      const request = new Request("http://localhost/nonexistent");
      const error = await assertRejects(
        () => route(routes, request, info),
        HttpError,
        "Not Found",
      );
      assertEquals(error.status, 404);
      assertEquals(error.cause, { request, info });
    },
  );

  await t.step(
    "should throw HttpError 405 for route with non-matching method",
    async () => {
      const request = new Request("http://localhost/test", { method: "POST" });
      const error = await assertRejects(
        () => route(routes, request, info),
        HttpError,
        "Method Not Allowed",
      );
      assertEquals(error.status, 405);
      assertEquals(error.cause, { request, info });
    },
  );

  await t.step(
    "should throw HttpError 404 for route with a 404 handler",
    async () => {
      const request = new Request("http://localhost/throws");
      const error = await assertRejects(
        () => route(routes, request, info),
        HttpError,
        "I'm a 404 message",
      );
      assertEquals(error.status, 404);
      // @ts-ignore It's fine
      assertEquals(error.cause?.foo, "bar");
    },
  );

  await t.step(
    "should throw HttpError 500 for route with an error in handler",
    async () => {
      const request = new Request("http://localhost/error", { method: "PUT" });
      const error = await assertRejects(
        () => route(routes, request, info),
        HttpError,
        "Internal Server Error",
      );
      assertEquals(error.status, 500);
      assertInstanceOf(error.cause, SyntaxError);
      assertEquals(error.cause.message, "This is an error");
    },
  );
});

Deno.test("syntax", async (t) => {
  await t.step("html", () => {
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

  await t.step("css", () => {
    const result = css`
      body {
        color: red;
      }
    `;
    assertEquals(
      result,
      `
      body {
        color: red;
      }
    `,
    );
  });
});
