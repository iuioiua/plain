import { type ErrorStatus, STATUS_TEXT } from "@std/http/status";

export interface Route {
  pattern: URLPattern;
  method: Request["method"];
  handler: (request: Request) => Response | Promise<Response>;
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

export async function route(
  routes: Route[],
  request: Request,
): Promise<Response> {
  const found = routes.find((route) => route.pattern.test(request.url));
  if (!found) throw new HttpError(404, undefined, { cause: request });
  if (request.method !== found.method) {
    throw new HttpError(405, undefined, { cause: request });
  }
  try {
    return await found.handler(request);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, undefined, { cause: error });
  }
}

function syntax(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce(
    (result, str, i) => result + str + (values[i] ?? ""),
    "",
  );
}

export const html = syntax;
export const css = syntax;
