import { type ErrorStatus, isStatus, STATUS_TEXT } from "@std/http/status";
import type { Method } from "@std/http/unstable-method";

export { isStatus };

export type Handler = (
  request: Request,
  match: URLPatternResult,
) => Response | Promise<Response>;
export interface Route {
  pattern: URLPattern;
  handlers: { [method in Method]?: Handler };
}

export class HttpError extends Error {
  status: ErrorStatus;

  constructor(
    status: ErrorStatus,
    message: string = STATUS_TEXT[status],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.status = status;
  }
}

function toHttpErrorCode(error: Error): ErrorStatus {
  if (
    error instanceof SyntaxError || error instanceof TypeError ||
    error instanceof RangeError || error instanceof URIError ||
    error instanceof EvalError || error instanceof Deno.errors.AddrNotAvailable
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

export function toHttpError(error: Error): HttpError {
  if (error instanceof HttpError) return error;
  const status = toHttpErrorCode(error);
  return new HttpError(status, error.message, { cause: error });
}

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

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return strings.reduce(
    (result, str, i) => result + str + (values[i] ?? ""),
    "",
  );
}
