import {
  html,
  HttpError,
  type Route,
  route,
  toHttpError,
} from "@iuioiua/plain";
import { assertEquals } from "@std/assert/equals";
import { assertInstanceOf } from "@std/assert/instance-of";
import { assertThrows } from "@std/assert/throws";
import type { ErrorStatus } from "@std/http/status";

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
    // @ts-ignore It's fine
    assertEquals(error.cause?.foo, "bar");
    assertEquals(
      // @ts-ignore It's fine
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

// deno-lint-ignore no-explicit-any
function testToHttpError(constructor: any, status: ErrorStatus) {
  const message = crypto.randomUUID();
  const error = new constructor(message);
  const httpError = toHttpError(error);
  assertEquals(httpError.status, status);
  assertEquals(httpError.message, message);
  assertEquals(httpError.name, "HttpError");
  assertEquals(httpError.cause, error);
}

Deno.test("toHttpError()", async (t) => {
  await t.step("converts `SyntaxError`", () => {
    testToHttpError(SyntaxError, 400);
  });

  await t.step("converts `TypeError`", () => {
    testToHttpError(TypeError, 500);
  });

  await t.step("converts `RangeError`", () => {
    testToHttpError(RangeError, 400);
  });

  await t.step("converts `URIError`", () => {
    testToHttpError(URIError, 400);
  });

  await t.step("converts `EvalError`", () => {
    testToHttpError(EvalError, 400);
  });

  await t.step("converts `Deno.errors.AddrNotAvailable`", () => {
    testToHttpError(Deno.errors.AddrNotAvailable, 400);
  });

  await t.step("converts `Deno.errors.PermissionDenied`", () => {
    testToHttpError(Deno.errors.PermissionDenied, 403);
  });

  await t.step("converts `Deno.errors.NotFound`", () => {
    testToHttpError(Deno.errors.NotFound, 404);
  });

  await t.step("converts `Deno.errors.AlreadyExists`", () => {
    testToHttpError(Deno.errors.AlreadyExists, 409);
  });

  await t.step("converts `Deno.errors.InvalidData`", () => {
    testToHttpError(Deno.errors.InvalidData, 422);
  });

  await t.step("converts `Deno.errors.ConnectionRefused`", () => {
    testToHttpError(Deno.errors.ConnectionRefused, 502);
  });

  await t.step("converts `Deno.errors.ConnectionReset`", () => {
    testToHttpError(Deno.errors.ConnectionReset, 502);
  });

  await t.step("converts `Deno.errors.Http`", () => {
    testToHttpError(Deno.errors.Http, 502);
  });

  await t.step("converts `Deno.errors.UnexpectedEof`", () => {
    testToHttpError(Deno.errors.UnexpectedEof, 502);
  });

  await t.step("converts `Deno.errors.Busy`", () => {
    testToHttpError(Deno.errors.Busy, 503);
  });

  await t.step("converts `Deno.errors.TimedOut`", () => {
    testToHttpError(Deno.errors.TimedOut, 504);
  });

  await t.step("converts `Error`", () => {
    testToHttpError(Error, 500);
  });

  await t.step("converts `HttpError`", () => {
    const message = crypto.randomUUID();
    const error = new HttpError(418, message);
    const resultError = toHttpError(error);
    assertEquals(resultError, error);
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
