import {
  type ErrorStatus,
  type InformationalStatus,
  type RedirectStatus,
  STATUS_TEXT,
} from "@std/http/status";
import type { Method } from "@std/http/unstable-method";

export type Handler = (
  request: Request,
  match: URLPatternResult,
) => Response | Promise<Response>;

/**
 * A route definition that associates a URL pattern with HTTP method handlers.
 *
 * Routes are used with the {@link route} function to match incoming HTTP requests
 * against URL patterns and dispatch them to the appropriate handler functions.
 *
 * @example
 * ```ts
 * const routes: Route[] = [
 *   {
 *     pattern: new URLPattern({ pathname: "/users/:id" }),
 *     handlers: {
 *       GET: (request, match) => {
 *         const userId = match.pathname.groups.id;
 *         return new Response(`User ID: ${userId}`);
 *       },
 *       DELETE: () => new Response(null, { status: 204 }),
 *     },
 *   },
 * ];
 * ```
 */
export interface Route {
  pattern: URLPattern;
  handlers: { [method in Method]?: Handler };
}

export interface HttpErrorOptions extends ErrorOptions {
  init?: ResponseInit;
}

/**
 * An error class for representing HTTP errors with status codes.
 *
 * `HttpError` extends the standard `Error` class to include HTTP-specific
 * properties such as status codes and optional response initialization options.
 * It's commonly used in route handlers to signal HTTP errors that should be
 * returned to the client.
 *
 * @example
 * ```ts
 * // Throw a 404 error
 * throw new HttpError(404);
 *
 * // Throw a 401 error with custom message
 * throw new HttpError(401, "Unauthorized access");
 *
 * // Throw a 403 error with custom headers
 * throw new HttpError(403, "Forbidden", {
 *   init: { headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' } },
 * });
 * ```
 */
export class HttpError extends Error {
  status: InformationalStatus | RedirectStatus | ErrorStatus;
  init?: ResponseInit;

  constructor(
    status: InformationalStatus | RedirectStatus | ErrorStatus,
    message: string = STATUS_TEXT[status],
    options?: HttpErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.status = status;
    this.init = options?.init;
  }
}

function toHttpErrorCode(error: unknown): ErrorStatus {
  if (
    error instanceof SyntaxError ||
    error instanceof RangeError ||
    error instanceof URIError ||
    error instanceof EvalError ||
    error instanceof Deno.errors.AddrNotAvailable
  ) return 400;
  if (error instanceof Deno.errors.PermissionDenied) return 403;
  if (error instanceof Deno.errors.NotFound) return 404;
  if (error instanceof Deno.errors.AlreadyExists) return 409;
  if (error instanceof Deno.errors.InvalidData) return 422;
  if (
    error instanceof Deno.errors.ConnectionRefused ||
    error instanceof Deno.errors.ConnectionReset ||
    error instanceof Deno.errors.Http ||
    error instanceof Deno.errors.UnexpectedEof
  ) return 502;
  if (error instanceof Deno.errors.Busy) return 503;
  if (error instanceof Deno.errors.TimedOut) return 504;
  return 500;
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  const status = toHttpErrorCode(error);
  return new HttpError(
    status,
    error instanceof Error ? error.message : undefined,
    { cause: error },
  );
}

/**
 * Routes an incoming HTTP request to the appropriate handler based on URL patterns and HTTP methods.
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
 * @example
 * ```ts
 * const routes: Route[] = [
 *   {
 *     pattern: new URLPattern({ pathname: "/" }),
 *     handlers: {
 *       GET: () => new Response("Hello, world!"),
 *     },
 *   },
 *   {
 *     pattern: new URLPattern({ pathname: "/users/:id" }),
 *     handlers: {
 *       GET: (request, match) => {
 *         const userId = match.pathname.groups.id;
 *         return new Response(`User ${userId}`);
 *       },
 *     },
 *   },
 * ];
 *
 * Deno.serve((request) => route(routes, request));
 * ```
 */
export function route(
  routes: Route[],
  request: Request,
): ReturnType<Handler> {
  for (const { pattern, handlers } of routes) {
    const match = pattern.exec(request.url);
    if (!match) continue;

    const handler = handlers[request.method as Method];
    if (!handler) throw new HttpError(405, undefined, { cause: request });

    return handler(request, match);
  }
  throw new HttpError(404, undefined, { cause: request });
}

/**
 * A template literal tag function for creating HTML strings with interpolated values.
 *
 * This function processes template literals and safely interpolates values into the
 * HTML string. It concatenates the template strings with the interpolated values,
 * treating `undefined` values as empty strings.
 *
 * @param strings - The template string array containing the static parts of the template
 * @param values - The values to be interpolated into the template
 * @returns The resulting HTML string with interpolated values
 *
 * @example
 * ```ts
 * const name = "Alice";
 * const color = "blue";
 * const htmlContent = html`
 *   <div>
 *     <h1>Hello, ${name}!</h1>
 *     <p style="color: ${color};">Welcome to our site.</p>
 *   </div>
 * `;
 *
 * // Returns:
 * // <div>
 * //   <h1>Hello, Alice!</h1>
 * //   <p style="color: blue;">Welcome to our site.</p>
 * // </div>
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
