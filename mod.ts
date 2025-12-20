import { extname } from "@std/path/extname";
import { contentType } from "@std/media-types/content-type";
import { eTag, ifNoneMatch } from "@std/http/etag";
import { type ErrorStatus, STATUS_CODE, STATUS_TEXT } from "@std/http/status";
import { HEADER } from "@std/http/unstable-header";
import { METHOD, type Method } from "@std/http/unstable-method";
import { normalize } from "@std/path/posix/normalize";
import { join } from "@std/path/posix/join";

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

/**
 * Note: when catching an error, call `request.body?.cancel()` to close the body
 * stream.
 *
 * @param routes
 * @param request
 * @returns
 */
export function route(
  routes: Route[],
  request: Request,
): ReturnType<Handler> {
  const match = routes.find(({ pattern }) => pattern.test(request.url));
  if (!match) throw new HttpError(404, undefined, { cause: request });

  const handler = match.handlers[request.method as Method];
  if (!handler) throw new HttpError(405, undefined, { cause: request });

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

function isNotModified(
  request: Request,
  mtime: Deno.FileInfo["mtime"],
  etag?: string,
): boolean {
  if (!etag && !mtime) return false;

  const ifNoneMatchValue = request.headers.get(HEADER.IfNoneMatch);
  if (!ifNoneMatch(ifNoneMatchValue, etag)) return true;

  const ifModifiedSinceValue = request.headers.get(HEADER.IfModifiedSince);
  return Boolean(
    !ifNoneMatchValue &&
      mtime &&
      ifModifiedSinceValue &&
      mtime.getTime() < new Date(ifModifiedSinceValue).getTime() + 1_000,
  );
}

export async function serveFile(
  request: Request,
  filePath: string,
): Promise<Response> {
  const isGet = request.method === METHOD.Get;
  const isHead = request.method === METHOD.Head;
  if (!isGet && !isHead) throw new HttpError(405);

  const fileInfo = await Deno.stat(filePath);
  if (!fileInfo.isFile) throw new HttpError(404);

  const headers = new Headers({
    // Range requests are not supported
    [HEADER.AcceptRanges]: "none",
    [HEADER.ContentLength]: fileInfo.size.toString(),
  });

  const lastModified = fileInfo.mtime?.toUTCString();
  if (lastModified) headers.set(HEADER.LastModified, lastModified);

  const etag = await eTag(fileInfo);
  if (etag) headers.set(HEADER.ETag, etag);

  const contentTypeValue = contentType(extname(filePath));
  if (contentTypeValue) headers.set(HEADER.ContentType, contentTypeValue);

  if (isNotModified(request, fileInfo.mtime, etag)) {
    return new Response(null, {
      status: STATUS_CODE.NotModified,
      headers,
    });
  }

  if (isHead) return new Response(null, { headers });

  const file = await Deno.open(filePath);
  return new Response(file.readable, { headers });
}

/**
 * Does not support CORS
 *
 * @param request
 * @returns
 */
export function serveDir(
  request: Request,
  rootFilePath = ".",
): Response | Promise<Response> {
  const isGet = request.method === METHOD.Get;
  const isHead = request.method === METHOD.Head;
  if (!isGet && !isHead) throw new HttpError(405);

  const url = new URL(request.url);
  const normalizedPath = normalize(url.pathname);

  // Redirect paths like `/foo////bar` and `/foo/bar/////` to normalized paths
  if (normalizedPath !== url.pathname) {
    url.pathname = normalizedPath;
    return Response.redirect(url, 308);
  }

  // Redirect to path without trailing slash
  if (url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
    return Response.redirect(url, 308);
  }

  // Prevent path traversal by stripping any leading slashes and rejecting `..`
  const safePath = normalizedPath.replace(/^\/+/, "");
  if (safePath.startsWith("..") || safePath.includes("/..")) {
    throw new HttpError(403);
  }

  const filePath = join(rootFilePath, safePath);
  return serveFile(request, filePath);
}
