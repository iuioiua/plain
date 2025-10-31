import { type ErrorStatus, STATUS_TEXT } from "@std/http/status";
import type { Method } from "@std/http/unstable-method";

export type Handler = (request: Request) => Response | Promise<Response>;
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

function toHttpErrorCode(error: Error): ErrorStatus | 499 {
  if (error instanceof SyntaxError) return 400;
  if (error instanceof TypeError) return 400;
  if (error instanceof RangeError) return 400;
  if (error instanceof URIError) return 400;
  if (error instanceof EvalError) return 400;

  if (error instanceof Deno.errors.NotFound) return 404;
  if (error instanceof Deno.errors.PermissionDenied) return 403;
  if (error instanceof Deno.errors.AlreadyExists) return 409;
  if (error instanceof Deno.errors.InvalidData) return 422;
  if (error instanceof Deno.errors.Busy) return 503;
  if (error instanceof Deno.errors.TimedOut) return 504;
  if (error instanceof Deno.errors.Interrupted) return 499;
  if (error instanceof Deno.errors.ConnectionRefused) return 502;
  if (error instanceof Deno.errors.ConnectionReset) return 502;
  if (error instanceof Deno.errors.ConnectionAborted) return 499;
  if (error instanceof Deno.errors.BrokenPipe) return 499;
  if (error instanceof Deno.errors.AddrNotAvailable) return 400;
  if (error instanceof Deno.errors.Http) return 502;
  if (error instanceof Deno.errors.UnexpectedEof) return 502;

  return 500;
}

export function toHttpError(error: Error): HttpError {
  if (error instanceof HttpError) return error;
  const status = toHttpErrorCode(error) as ErrorStatus;
  return new HttpError(status, error.message, { cause: error });
}

export function route(
  routes: Route[],
  request: Request,
): ReturnType<Handler> {
  const match = routes.find(({ pattern }) => pattern.test(request.url));
  if (!match) {
    throw new HttpError(404, undefined, { cause: request });
  }
  const handler = match.handlers[request.method as Method];
  if (!handler) {
    throw new HttpError(405, undefined, { cause: request });
  }
  return handler(request);
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
