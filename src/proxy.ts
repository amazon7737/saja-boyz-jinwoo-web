import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/article-document/') ||
    /^\/_next\/data\/[^/]+\/article-document(?:\/|\.json$)/.test(pathname)
  )
    return new Response(null, { status: 404 });
  if (
    request.headers.get('rsc') === '1' ||
    !['GET', 'HEAD'].includes(request.method)
  )
    return NextResponse.next();
  const match = pathname.match(/^\/incidents\/([^/]+)$/);

  if (!match) return NextResponse.next();
  // skipProxyUrlNormalize preserves the server origin in request.url.
  // NextURL normalizes loopback hosts and can turn this into an external rewrite.
  const next = new URL(request.url);

  next.pathname = '/article-document/' + match[1];

  return NextResponse.rewrite(next);
}

export const config = {
  matcher: ['/incidents/:id', '/article-document/:id', '/_next/data/:path*'],
};
