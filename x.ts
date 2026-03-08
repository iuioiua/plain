type Matcher = (path: string) => boolean;
type Handler = (request: Request) => Response | Promise<Response>;

export type Route = {
  matcher: Matcher;
  handler: Handler;
};

export function findHandler(
  routes: Route[],
  pathname: string,
): Handler | undefined {
  return routes.find((route) => route.matcher(pathname))?.handler;
}
