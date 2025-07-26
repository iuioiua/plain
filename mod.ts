import { type ErrorStatus, STATUS_TEXT } from "@std/http/status";

export type Handler = (request: Request) => Response | Promise<Response>;
export type Routes = Record<string, Handler>;

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

export function createHandler(routes: Routes): Handler {
  const routeMap = Object.entries(routes).map(([methodPath, handler]) => {
    const [method, pathname] = methodPath.split(" ");
    const pattern = new URLPattern({ pathname });
    return { method, pattern, handler };
  });
  return (request) => {
    const route = routeMap.find(({ pattern }) => pattern.test(request.url));
    if (!route) throw new HttpError(404, undefined, { cause: request });
    if (route.method !== request.method) {
      throw new HttpError(405, undefined, { cause: request });
    }
    return route.handler(request);
  };
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
