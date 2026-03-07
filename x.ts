type Matcher = (path: string) => boolean;
type Handler = (request: Request) => Response | Promise<Response>;

export type Route = {
  matcher: Matcher;
  handler: Handler;
};

export function findHandler(
  routes: Route[],
  request: Request,
): Handler | undefined {
  const { pathname } = new URL(request.url);
  return routes.find((route) => route.matcher(pathname))?.handler;
}
