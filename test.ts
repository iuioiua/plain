import { html, HttpError, type Route, route, serveFile } from "@iuioiua/plain";
import {
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { eTag } from "@std/http/etag";

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

const routes: Route[] = [
  {
    pattern: new URLPattern({ pathname: "/test" }),
    handlers: {
      GET: () => new Response("I'm a static route"),
    },
  },
  {
    pattern: new URLPattern({ pathname: "/foo/:bar" }),
    handlers: {
      GET: () => new Response("I'm a dynamic route"),
      POST: () => new Response("I'm a dynamic route: POST"),
    },
  },
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
  {
    pattern: new URLPattern({ pathname: "/error" }),
    handlers: {
      PUT: () => {
        throw new SyntaxError("This is an error");
      },
    },
  },
];

Deno.test("route() - static route", async () => {
  const request = new Request("http://localhost/test");
  const response = route(routes, request);
  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "I'm a static route");
});

Deno.test("route() - dynamic route", async () => {
  const request = new Request("http://localhost/foo/123", { method: "POST" });
  const response = route(routes, request);
  assertInstanceOf(response, Response);
  assertEquals(response.status, 200);
  assertEquals(await response.text(), "I'm a dynamic route: POST");
});

Deno.test("route() - non-matching URL", () => {
  const request = new Request("http://localhost/nonexistent");
  const error = assertThrows(
    () => route(routes, request),
    HttpError,
    "Not Found",
  );
  assertEquals(error.status, 404);
  assertEquals(error.cause, request);
});

Deno.test("route() - non-matching method", () => {
  const request = new Request("http://localhost/test", { method: "POST" });
  const error = assertThrows(
    () => route(routes, request),
    HttpError,
    "Method Not Allowed",
  );
  assertEquals(error.status, 405);
  assertEquals(error.cause, request);
});

Deno.test("route() - handler throws HttpError", () => {
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

Deno.test("serveFile() - GET request", async () => {
  const filePath = "./README.md";
  const content = await Deno.readTextFile(filePath);
  const fileInfo = await Deno.stat(filePath);
  const response = await serveFile(
    new Request("http://localhost/README.md"),
    filePath,
  );
  assertEquals(response.status, 200);
  assertEquals(await response.text(), content);
  assertEquals(response.headers.get("accept-ranges"), "none");
  assertEquals(response.headers.get("content-length"), `${content.length}`);
  assertEquals(
    response.headers.get("content-type"),
    "text/markdown; charset=UTF-8",
  );
  assertEquals(
    response.headers.get("etag"),
    await eTag(await Deno.stat("./README.md")),
  );
  assertEquals(
    response.headers.get("last-modified"),
    fileInfo.mtime!.toUTCString(),
  );
});

Deno.test("serveFile() - HEAD request", async () => {
  const filePath = "./README.md";
  const content = await Deno.readTextFile(filePath);
  const fileInfo = await Deno.stat(filePath);
  const response = await serveFile(
    new Request("http://localhost/README.md", { method: "HEAD" }),
    filePath,
  );
  assertEquals(response.status, 200);
  assertEquals(response.body, null);
  assertEquals(response.headers.get("accept-ranges"), "none");
  assertEquals(response.headers.get("content-length"), `${content.length}`);
  assertEquals(
    response.headers.get("content-type"),
    "text/markdown; charset=UTF-8",
  );
  assertEquals(response.headers.get("etag"), await eTag(fileInfo));
  assertEquals(
    response.headers.get("last-modified"),
    fileInfo.mtime!.toUTCString(),
  );
});

Deno.test("serveFile() - honors `If-None-Match` request header", async () => {
  const filePath = "./README.md";
  const content = await Deno.readTextFile(filePath);
  const fileInfo = await Deno.stat(filePath);
  const firstResponse = await serveFile(
    new Request("http://localhost/README.md"),
    filePath,
  );
  await firstResponse.body?.cancel();

  const etag = firstResponse.headers.get("etag");
  assertEquals(etag, await eTag(fileInfo));

  const cachedResponse = await serveFile(
    new Request("http://localhost/README.md", {
      headers: { "If-None-Match": etag! },
    }),
    filePath,
  );
  assertEquals(cachedResponse.status, 304);
  assertEquals(cachedResponse.body, null);
  assertEquals(cachedResponse.headers.get("etag"), etag);
  assertEquals(
    cachedResponse.headers.get("last-modified"),
    fileInfo.mtime!.toUTCString(),
  );
  assertEquals(
    cachedResponse.headers.get("content-length"),
    `${content.length}`,
  );
});

Deno.test("serveFile() - file not found", async () => {
  const filePath = "./NON_EXISTENT_FILE.md";
  const error = await assertRejects(
    () =>
      serveFile(new Request("http://localhost/NON_EXISTENT_FILE.md"), filePath),
    HttpError,
    "Not Found",
  );
  console.error(error);
  assertEquals(error.status, 404);
});
