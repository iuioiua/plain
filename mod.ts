import {
  type ErrorStatus,
  type InformationalStatus,
  type RedirectStatus,
  STATUS_TEXT,
} from "@std/http/status";
import type { Method } from "@std/http/unstable-method";

/**
 * HTTP request handler.
 */
export type Handler = (
  request: Request,
  match: URLPatternResult,
) => Response | Promise<Response>;

/**
 * A route definition that associates a URL pattern with HTTP method handlers.
 *
 * Routes are used with the {@link route} function to match incoming HTTP
 * requests against URL patterns and dispatch them to the appropriate handler
 * functions.
 *
 * @example Route with handlers for multiple methods
 * ```ts
 * import type { Route } from "@iuioiua/plain";
 *
 * const route = {
 *   pattern: new URLPattern({ pathname: "/users/:id" }),
 *   handlers: {
 *     GET: (request, match) => {
 *       const userId = match.pathname.groups.id;
 *       return new Response(`User ID: ${userId}`);
 *     },
 *     DELETE: () => new Response(null, { status: 204 }),
 *   },
 * } satisfies Route;
 * ```
 *
 * @example Route with a single handler for all methods
 * ```ts
 * import type { Route } from "@iuioiua/plain";
 *
 * const route = {
 *   pattern: new URLPattern({ pathname: "/status" }),
 *   handler: () => new Response("OK"),
 * } satisfies Route;
 * ```
 */
export type Route = {
  pattern: URLPattern;
  handler: Handler;
} | {
  pattern: URLPattern;
  handlers: { [method in Method]?: Handler };
};

/**
 * Options for {@linkcode HttpError}.
 */
export interface HttpErrorOptions extends ErrorOptions {
  /**
   * Configuration options for the HTTP response associated with this error.
   */
  init?: ResponseInit;
}

/**
 * An error class for representing HTTP errors with status codes.
 *
 * Extends the standard {@linkcode Error} class to include HTTP-specific
 * properties such as status codes and optional response initialization options.
 * It's commonly used in route handlers to signal HTTP errors that should be
 * returned to the client.
 *
 * @param message - Optional error message. Defaults to the standard status text for the given status code
 * @param options - Optional error options including cause and response init configuration
 *
 * @example Usage without custom message or options
 * ```ts
 * import { HttpError } from "@iuioiua/plain";
 * import { assertEquals, assertInstanceOf } from "@std/assert";
 *
 * try {
 *   throw new HttpError(404);
 * } catch (error) {
 *   assertInstanceOf(error, HttpError);
 *   assertEquals(error.status, 404);
 *   assertEquals(error.message, "Not Found");
 * }
 * ```
 *
 * @example Usage with custom message
 * ```ts
 * import { HttpError } from "@iuioiua/plain";
 * import { assertEquals, assertInstanceOf } from "@std/assert";
 *
 * try {
 *   throw new HttpError(500, "Something went wrong");
 * } catch (error) {
 *   assertInstanceOf(error, HttpError);
 *   assertEquals(error.status, 500);
 *   assertEquals(error.message, "Something went wrong");
 * }
 * ```
 *
 * @example Usage with response init options
 * ```ts
 * import { HttpError } from "@iuioiua/plain";
 * import { assertEquals, assertInstanceOf } from "@std/assert";
 *
 * try {
 *   throw new HttpError(403, "Forbidden", {
 *     init: { headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' } },
 *   });
 * } catch (error) {
 *   assertInstanceOf(error, HttpError);
 *   assertEquals(error.status, 403);
 *   assertEquals(error.message, "Forbidden");
 *   assertEquals(
 *     // @ts-ignore It's fine
 *     error.init?.headers?.["WWW-Authenticate"],
 *     'Basic realm="Secure Area"',
 *   );
 * }
 * ```
 *
 * @example Usage with cause
 * ```ts
 * import { HttpError } from "@iuioiua/plain";
 * import { assertEquals, assertInstanceOf } from "@std/assert";
 *
 * try {
 *   throw new HttpError(500, "Internal Server Error", {
 *     cause: new Error("Database connection failed"),
 *   });
 * } catch (error) {
 *   assertInstanceOf(error, HttpError);
 *   assertEquals(error.status, 500);
 *   assertEquals(error.message, "Internal Server Error");
 *   assertInstanceOf(error.cause, Error);
 *   assertEquals(error.cause?.message, "Database connection failed");
 * }
 * ```
 */
export class HttpError extends Error {
  /**
   * The HTTP status code (e.g., 404, 500, 403)
   */
  status: InformationalStatus | RedirectStatus | ErrorStatus;
  /**
   * Configuration options for the HTTP response associated with this error.
   */
  init: ResponseInit;

  /**
   * Constructs a new {@link HttpError} instance.
   *
   * Extends the standard {@linkcode Error} class to include HTTP-specific
   * properties such as status codes and optional response initialization options.
   * It's commonly used in route handlers to signal HTTP errors that should be
   * returned to the client.
   *
   * @param status - The HTTP status code (e.g., 404, 500, 403)
   * @param message - Optional error message. Defaults to the standard status text for the given status code
   * @param options - Optional error options including cause and response init configuration
   *
   * @example Usage without custom message or options
   * ```ts
   * import { HttpError } from "@iuioiua/plain";
   * import { assertEquals, assertInstanceOf } from "@std/assert";
   *
   * try {
   *   throw new HttpError(404);
   * } catch (error) {
   *   assertInstanceOf(error, HttpError);
   *   assertEquals(error.status, 404);
   *   assertEquals(error.message, "Not Found");
   * }
   * ```
   *
   * @example Usage with custom message
   * ```ts
   * import { HttpError } from "@iuioiua/plain";
   * import { assertEquals, assertInstanceOf } from "@std/assert";
   *
   * try {
   *   throw new HttpError(500, "Something went wrong");
   * } catch (error) {
   *   assertInstanceOf(error, HttpError);
   *   assertEquals(error.status, 500);
   *   assertEquals(error.message, "Something went wrong");
   * }
   * ```
   *
   * @example Usage with response init options
   * ```ts
   * import { HttpError } from "@iuioiua/plain";
   * import { assertEquals, assertInstanceOf } from "@std/assert";
   *
   * try {
   *   throw new HttpError(403, "Forbidden", {
   *     init: { headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' } },
   *   });
   * } catch (error) {
   *   assertInstanceOf(error, HttpError);
   *   assertEquals(error.status, 403);
   *   assertEquals(error.message, "Forbidden");
   *   assertEquals(
   *     // @ts-ignore It's fine
   *     error.init?.headers?.["WWW-Authenticate"],
   *     'Basic realm="Secure Area"',
   *   );
   * }
   * ```
   *
   * @example Usage with cause
   * ```ts
   * import { HttpError } from "@iuioiua/plain";
   * import { assertEquals, assertInstanceOf } from "@std/assert";
   *
   * try {
   *   throw new HttpError(500, "Internal Server Error", {
   *     cause: new Error("Database connection failed"),
   *   });
   * } catch (error) {
   *   assertInstanceOf(error, HttpError);
   *   assertEquals(error.status, 500);
   *   assertEquals(error.message, "Internal Server Error");
   *   assertInstanceOf(error.cause, Error);
   *   assertEquals(error.cause?.message, "Database connection failed");
   * }
   * ```
   */
  constructor(
    status: InformationalStatus | RedirectStatus | ErrorStatus,
    message: string = STATUS_TEXT[status],
    options?: HttpErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.status = status;
    this.init = { status, statusText: message, ...options?.init };
  }
}

/**
 * Routes an incoming HTTP request to the appropriate handler based on URL
 * patterns and HTTP methods.
 *
 * This function iterates through the provided routes, matching the request URL against
 * each route's pattern. When a match is found, it invokes the corresponding handler for
 * the request's HTTP method. If no matching route or method is found, it throws an
 * {@link HttpError} with the appropriate status code (404 for no route match, 405 for
 * no method match).
 *
 * @param routes - An array of route definitions to match against
 * @param request - The incoming HTTP request to route
 * @returns The response from the matched handler, or a Promise that resolves to a response
 * @throws {HttpError} Throws a 404 error if no matching route is found, or a 405 error
 * if the route matches but the HTTP method is not supported
 *
 * @example Usage
 * ```ts ignore
 * import { route, HttpError } from "@iuioiua/plain";
 *
 * const routes: Route[] = [
 *   // Static route
 *   {
 *     pattern: new URLPattern({ pathname: "/" }),
 *     handlers: {
 *       GET: () => new Response("Hello, world!"),
 *     },
 *   },
 *   // Dynamic route with URL parameters
 *   {
 *     pattern: new URLPattern({ pathname: "/users/:id" }),
 *     handlers: {
 *       GET: (request, match) => {
 *         const userId = match.pathname.groups.id;
 *         return new Response(`User ${userId}`);
 *       },
 *     },
 *   },
 *   // Route with a single handler for all methods
 *   {
 *     pattern: new URLPattern({ pathname: "/status" }),
 *     handler: () => new Response("OK"),
 *   },
 * ];
 *
 * export default {
 *   fetch(request: Request) {
 *     try {
 *       return route(routes, request);
 *     } catch (error) {
 *       if (error instanceof HttpError) {
 *         return new Response(error.message, { status: error.status, ...error.init });
 *       }
 *       return new Response("Internal Server Error", { status: 500 });
 *     }
 *   },
 * } satisfies Deno.ServeDefaultHandler;
 * ```
 */
export function route(
  routes: Route[],
  request: Request,
): ReturnType<Handler> {
  for (const route of routes) {
    const match = route.pattern.exec(request.url);
    if (!match) continue;

    const handler = "handler" in route
      ? route.handler
      : route.handlers[request.method as Method];
    if (!handler) throw new HttpError(405, undefined);

    return handler(request, match);
  }
  throw new HttpError(404, undefined);
}

/**
 * A template literal tag function for creating HTML strings with interpolated
 * values.
 *
 * This function processes template literals and concatenates them with
 * interpolated values. Values are inserted as-is without any HTML escaping or
 * sanitization. Undefined values are treated as empty strings.
 *
 * [!WARNING]
 * **Security Warning**: This function does NOT escape HTML. When interpolating
 * user-provided data, you must manually escape it to prevent XSS (Cross-Site
 * Scripting) attacks. Only usethis function with trusted data or data that has
 * been properly sanitized.
 *
 * @param strings - The template string array containing the static parts of the template
 * @param values - The values to be interpolated into the template
 * @returns The resulting HTML string with interpolated values
 *
 * @example Usage with trusted content
 * ```ts
 * import { html } from "@iuioiua/plain";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const name = "Alice";
 * const color = "blue";
 * const htmlContent = html`
 *   <div>
 *     <h1>Hello, ${name}!</h1>
 *     <p style="color: ${color};">Welcome to our site.</p>
 *   </div>
 * `;
 *
 * assertEquals(htmlContent, `
 *   <div>
 *     <h1>Hello, Alice!</h1>
 *     <p style="color: blue;">Welcome to our site.</p>
 *   </div>
 * `);
 * ```
 *
 * @example Usage with untrusted content that needs to be escaped
 * ```ts
 * import { html } from "@iuioiua/plain";
 * import { assertEquals } from "@std/assert/equals";
 * import { escape } from "@std/html/entities";
 *
 * // WARNING: This is vulnerable to XSS attacks!
 * const userInput = '<script>alert("XSS")</script>';
 * const unsafeHtml = html`<div>${userInput}</div>`;
 *
 * const safeHtml = html`<div>${escape(userInput)}</div>`;
 *
 * assertEquals(unsafeHtml, '<div><script>alert("XSS")</script></div>');
 * assertEquals(safeHtml, "<div>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</div>");
 * ```
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce(
    (result, str, i) => result + str + (values[i] ?? ""),
    "",
  );
}

const encoder = new TextEncoder();

function timingSafeEqual(
  a: Uint8Array,
  b: Uint8Array,
): boolean {
  // Start with the XOR of the lengths so length differences affect the result
  let result = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const va = i < a.length ? a[i] : 0;
    const vb = i < b.length ? b[i] : 0;
    result |= va ^ vb;
  }
  return result === 0;
}

/**
 * Configuration parameters for {@linkcode assertBasicAuth}.
 */
export interface AssertBasicAuthConfig {
  /**
   * Authentication parameter corresponding to the
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/WWW-Authenticate | realm}
   * directive in the
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/WWW-Authenticate | WWW-Authenticate}
   * header.
   */
  realm: string;
  /**
   * The expected username for basic authentication. This will be compared against the
   * username extracted from the `Authorization` header of the incoming request.
   */
  username: string;
  /**
   * The expected password for basic authentication. This will be compared against the
   * password extracted from the `Authorization` header of the incoming request.
   */
  password: string;
}

/**
 * Asserts that the provided
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Authorization | `Authorization` header}
 * contains valid
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication#basic_authentication_scheme | Basic Authentication}
 * credentials.
 *
 * @throws {HttpError} Throws a
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401 | HTTP 401}
 * error if the `Authorization` header is missing or contains incorrect
 * credentials, or a
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/400 | HTTP 400}
 * error if the header is malformed.
 *
 * @param authHeader - The value of the `Authorization` header from the incoming
 * request
 * @param config - Configuration options including the expected realm, username,
 * and password
 *
 * @example Usage
 * ```ts
 * import { assertBasicAuth, HttpError, type Route } from "@iuioiua/plain";
 *
 * function GET(request: Request): Response {
 *   try {
 *     assertBasicAuth(request.headers.get("Authorization"), {
 *       realm: "Admin tools",
 *       username: "admin",
 *       password: "password",
 *     });
 *     return new Response("Welcome, admin!");
 *   } catch (error) {
 *     if (error instanceof HttpError) {
 *       return new Response(error.message, {
 *         status: error.status,
 *         ...error.init
 *       });
 *     }
 *     return new Response("Internal Server Error", { status: 500 });
 *   }
 * }
 *
 * export const protectedRoute = {
 *   pattern: new URLPattern({ pathname: "/admin" }),
 *   handlers: { GET },
 * } satisfies Route;
 * ```
 */
export function assertBasicAuth(
  authHeader: string | null,
  config: AssertBasicAuthConfig,
) {
  const UNAUTHORIZED_ERROR_OPTIONS = {
    init: {
      headers: {
        "WWW-Authenticate": `Basic realm="${config.realm}"`,
      },
    },
  };

  if (!authHeader) {
    throw new HttpError(
      401,
      "Missing `Authorization` header",
      UNAUTHORIZED_ERROR_OPTIONS,
    );
  }

  const [scheme, encodedCredentials] = authHeader.split(" ");
  if (scheme.toLowerCase() !== "basic" || !encodedCredentials) {
    throw new HttpError(400, "Malformed `Authorization` header");
  }

  let credentials: string;
  try {
    // Decode base64 to raw bytes, then interpret as UTF-8 per RFC 7617 §2.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Window/atob#exceptions
    const binaryString = atob(encodedCredentials);
    const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    credentials = new TextDecoder().decode(bytes);
  } catch (error) {
    throw new HttpError(400, "Malformed `Authorization` header", {
      cause: error,
    });
  }
  if (!credentials.includes(":")) {
    throw new HttpError(400, "Malformed `Authorization` header");
  }
  const credentialsBytes = encoder.encode(credentials);
  const expectedCredentialsBytes = encoder.encode(
    `${config.username}:${config.password}`,
  );
  if (!timingSafeEqual(credentialsBytes, expectedCredentialsBytes)) {
    throw new HttpError(
      401,
      "Incorrect credentials",
      UNAUTHORIZED_ERROR_OPTIONS,
    );
  }
}

/**
 * Creates a {@linkcode Response} that redirects the client to a different URL
 * orrelative path.
 *
 * This is a more flexible alternative to {@linkcode Response.redirect}, which
 * only supports absolute URLs.
 *
 * @param location - The URL or relative path to redirect the client to
 * @param status - The HTTP status code for the redirection (default is 302)
 * @returns A response object representing the redirection
 *
 * @example Usage
 * ```ts
 * import { redirect, type Route } from "@iuioiua/plain";
 *
 * function GET(): Response {
 *   return redirect("/new-location");
 * }
 *
 * export const redirectRoute = {
 *   pattern: new URLPattern({ pathname: "/old-location" }),
 *   handlers: { GET },
 * } satisfies Route;
 * ```
 */
export function redirect(
  location: string,
  status: RedirectStatus = 302,
): Response {
  return new Response(null, {
    status,
    headers: { location },
  });
}
