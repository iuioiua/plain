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

export function route(
  routes: Route[],
  request: Request,
): ReturnType<Handler> {
  const route = routes.find(({ pattern }) => pattern.test(request.url));
  if (!route) {
    throw new HttpError(404, undefined, { cause: request });
  }
  const handler = route.handlers[request.method as Method];
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
