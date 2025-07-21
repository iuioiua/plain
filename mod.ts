import { type ErrorStatus, STATUS_TEXT } from "@std/http/status";

export type Handler = (request: Request) => Response | Promise<Response>;
export interface Routes {
  [path: string]: {
    [method: string]: Handler;
  };
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

export function createHandler(routes: Routes): Handler {
  const internalRoutes: [URLPattern, Map<string, Handler>][] = Object.entries(
    routes,
  ).map(([pathname, methods]) => [
    new URLPattern({ pathname }),
    new Map(Object.entries(methods)),
  ]);

  return (request) => {
    const methodHandlers = internalRoutes.find(([pattern]) =>
      pattern.test(request.url)
    );
    if (!methodHandlers) {
      throw new HttpError(404, undefined, { cause: request });
    }
    const handler = methodHandlers[1].get(request.method);
    if (!handler) {
      throw new HttpError(405, undefined, { cause: request });
    }
    return handler(request);
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
