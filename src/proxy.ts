import { NextResponse, type NextRequest } from 'next/server';

// Next 16.3.8 renders a page-thrown 404 as an empty document without JS.
// A routing-level 404 has server HTML; keep this workaround off RSC navigation.
export async function proxy(request: NextRequest) {
  const next = () => NextResponse.next();
  const match = request.nextUrl.pathname.match(/^\/incidents\/([^/]+)$/);

  if (
    !match ||
    request.headers.get('rsc') === '1' ||
    (request.method !== 'GET' && request.method !== 'HEAD')
  )
    return next();

  const id = match[1];
  let missing = !/^[a-f0-9]{64}$/.test(id);
  let unavailable = false;

  if (!missing) {
    try {
      const base = new URL(process.env.NEWS_API_BASE_URL ?? '');

      if (
        (base.protocol !== 'https:' && base.protocol !== 'http:') ||
        base.username ||
        base.password
      ) {
        unavailable = true;
      } else {
        const response = await fetch(new URL('/news/' + id, base), {
          method: 'GET',
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        missing = response.status === 404;
        unavailable = !response.ok && !missing;
        await response.body?.cancel().catch(() => {});
      }
    } catch {
      unavailable = true;
    }
  }

  if (unavailable) {
    const fallback = request.nextUrl.clone();

    fallback.pathname = '/article-unavailable/' + id;
    fallback.search = '';

    return NextResponse.rewrite(fallback);
  }

  if (!missing) return next();

  const fallback = request.nextUrl.clone();

  fallback.pathname = '/__missing-article';
  fallback.search = '';
  const response = NextResponse.rewrite(fallback, {
    status: 404,
  });

  response.headers.set('Cache-Control', 'private, no-store');

  return response;
}

export const config = {
  matcher: ['/incidents/:id'],
};
