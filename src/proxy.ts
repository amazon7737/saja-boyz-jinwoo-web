import { NextResponse, type NextRequest } from 'next/server';

import { fetchArticleList } from '@/features/article-list/api/fetch-articles';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/article-document/') ||
    /^\/_next\/data\/[^/]+\/article-document(?:\/|\.json$)/.test(pathname) ||
    pathname === '/archive-document' ||
    /^\/_next\/data\/[^/]+\/archive-document(?:\/|\.json$)/.test(pathname)
  )
    return new Response(null, { status: 404 });
  if (
    request.headers.get('rsc') === '1' ||
    !['GET', 'HEAD'].includes(request.method)
  )
    return NextResponse.next();

  if (pathname === '/archive') {
    const input = request.nextUrl.searchParams.get('page') ?? '1';
    const page = Number(input);
    const offset = (page - 1) * 20;

    if (
      !/^[1-9]\d*$/.test(input) ||
      !Number.isSafeInteger(page) ||
      !Number.isSafeInteger(offset)
    )
      return NextResponse.next();

    const result = await fetchArticleList(
      undefined,
      offset,
      'recent',
      undefined,
      undefined,
      1,
    );

    if (result) return NextResponse.next();

    const unavailable = new URL(request.url);

    unavailable.pathname = '/archive-document';

    return NextResponse.rewrite(unavailable);
  }

  const match = pathname.match(/^\/incidents\/([^/]+)$/);

  if (!match) return NextResponse.next();
  // skipProxyUrlNormalize preserves the server origin in request.url.
  // NextURL normalizes loopback hosts and can turn this into an external rewrite.
  const next = new URL(request.url);

  next.pathname = '/article-document/' + match[1];

  return NextResponse.rewrite(next);
}

export const config = {
  matcher: [
    '/incidents/:id',
    '/article-document/:id',
    '/archive',
    '/archive-document',
    '/_next/data/:path*',
  ],
};
