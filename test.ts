import {
  assertBasicAuth,
  html,
  HttpError,
  redirect,
  type Route,
  route,
} from "./mod.ts";
import { assertEquals } from "@std/assert/equals";
import { assertInstanceOf } from "@std/assert/instance-of";
import { assertThrows } from "@std/assert/throws";
import { assertIsError } from "@std/assert/is-error";

Deno.test("HttpError", async (t) => {
  await t.step("initialises with correct defaults", () => {
    const error = new HttpError(500);
    assertInstanceOf(error, Error);
    assertEquals(error.name, "HttpError");
    assertEquals(error.status, 500);
    assertEquals(error.message, "Internal Server Error");
    assertEquals(error.cause, undefined);
    assertEquals(error.init, undefined);
  });

  await t.step("initialises with custom properties", () => {
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
});

Deno.test("route()", async (t) => {
  const routes = [
    {
      pattern: new URLPattern({ pathname: "/test" }),
      handler: () => new Response("I'm a static route"),
    },
    {
      pattern: new URLPattern({ pathname: "/foo/:bar" }),
      handlers: {
        POST: (_request, match) => new Response(match.pathname.groups.bar),
      },
    },
    {
      pattern: new URLPattern({ pathname: "/throws" }),
      handler: () => {
        throw new HttpError(400, "Bad Request", {
          cause: { foo: "bar" },
        });
      },
    },
  ] as Route[];

  await t.step("routes static route with single handler", async () => {
    const request = new Request("http://localhost/test");
    const response = route(routes, request);
    assertInstanceOf(response, Response);
    assertEquals(response.status, 200);
    assertEquals(await response.text(), "I'm a static route");
  });

  await t.step(
    "route() routes dynamic route with multiple handlers",
    async () => {
      const request = new Request("http://localhost/foo/123", {
        method: "POST",
      });
      const response = route(routes, request);
      assertInstanceOf(response, Response);
      assertEquals(response.status, 200);
      assertEquals(await response.text(), "123");
    },
  );

  await t.step(
    'throws HTTP 404 "Not Found" error if no route matches the request URL',
    () => {
      const request = new Request("http://localhost/nonexistent");
      const error = assertThrows(
        () => route(routes, request),
        HttpError,
        "Not Found",
      );
      assertEquals(error.status, 404);
      assertEquals(error.cause, request);
    },
  );

  await t.step(
    'throws HTTP 405 "Method Not Allowed" error if a route matches the request URL but does not have a handler for the request method',
    () => {
      const request = new Request("http://localhost/foo/123", {
        method: "GET",
      });
      const error = assertThrows(
        () => route(routes, request),
        HttpError,
        "Method Not Allowed",
      );
      assertEquals(error.status, 405);
      assertEquals(error.cause, request);
    },
  );

  await t.step(
    "throws error thrown in handler",
    () => {
      const request = new Request("http://localhost/throws");
      const error = assertThrows(
        () => route(routes, request),
        HttpError,
        "Bad Request",
      );
      assertEquals(error.status, 400);
      // @ts-ignore It's fine
      assertEquals(error.cause?.foo, "bar");
    },
  );
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

Deno.test("assertBasicAuth()", async (t) => {
  await t.step("throws with missing `Authorization` header", () => {
    const error = assertThrows(
      () =>
        assertBasicAuth(null, {
          realm: "Protected",
          username: "admin",
          password: "password",
        }),
      HttpError,
      "Missing `Authorization` header",
    );
    assertEquals(error.status, 401);
    assertEquals(
      // @ts-ignore It's fine
      error.init?.headers?.["WWW-Authenticate"],
      'Basic realm="Protected"',
    );
  });

  await t.step("throws with malformed `Authorization` header", () => {
    const error = assertThrows(
      () =>
        assertBasicAuth("malformed", {
          realm: "Protected",
          username: "admin",
          password: "password",
        }),
      HttpError,
      "Malformed `Authorization` header",
    );
    assertEquals(error.status, 400);
  });

  await t.step("throws with non-base64 encoded `Authorization` header", () => {
    const error = assertThrows(
      () =>
        assertBasicAuth("Basic not-base64", {
          realm: "Protected",
          username: "admin",
          password: "password",
        }),
      HttpError,
      "Malformed `Authorization` header",
    );
    assertEquals(error.status, 400);
    assertIsError(error.cause, DOMException);
    assertEquals(error.cause.name, "InvalidCharacterError");
  });

  await t.step("throws with no username/password colon separator", () => {
    const error = assertThrows(
      () =>
        assertBasicAuth(`Basic ${btoa("adminpassword")}`, {
          realm: "Protected",
          username: "admin",
          password: "password",
        }),
      HttpError,
      "Malformed `Authorization` header",
    );
    assertEquals(error.status, 400);
  });

  await t.step("throws with incorrect username", () => {
    const error = assertThrows(
      () =>
        assertBasicAuth(`Basic ${btoa("wrong-username:password")}`, {
          realm: "Admin tools",
          username: "admin",
          password: "password",
        }),
      HttpError,
      "Incorrect credentials",
    );
    assertEquals(error.status, 401);
    assertEquals(
      // @ts-ignore It's fine
      error.init?.headers?.["WWW-Authenticate"],
      `Basic realm="Admin tools"`,
    );
  });

  await t.step("throws with incorrect password", () => {
    const error = assertThrows(
      () =>
        assertBasicAuth(`Basic ${btoa("admin:wrong-password")}`, {
          realm: "Admin tools",
          username: "admin",
          password: "password",
        }),
      HttpError,
      "Incorrect credentials",
    );
    assertEquals(error.status, 401);
    assertEquals(
      // @ts-ignore It's fine
      error.init?.headers?.["WWW-Authenticate"],
      `Basic realm="Admin tools"`,
    );
  });

  await t.step("doesn't throw with correct request", () => {
    assertBasicAuth(`Basic ${btoa("admin:password")}`, {
      realm: "Admin tools",
      username: "admin",
      password: "password",
    });
  });

  await t.step("doesn't throw with colon in password", () => {
    assertBasicAuth(`Basic ${btoa("admin:pass:word")}`, {
      realm: "Admin tools",
      username: "admin",
      password: "pass:word",
    });
  });
});

Deno.test("redirect()", () => {
  const response = redirect("/new-location", 301);
  assertInstanceOf(response, Response);
  assertEquals(response.status, 301);
  assertEquals(response.headers.get("Location"), "/new-location");
});
