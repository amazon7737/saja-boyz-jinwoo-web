const styles = `
  @font-face { font-family: Pretendard; src: url('/fonts/PretendardVariable.woff2') format('woff2'); font-weight: 100 900; font-display: swap; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f8fafc; color: #0f172a; font: 14px/1.5 Pretendard, system-ui, sans-serif; }
  a { color: inherit; text-decoration: none; }
  a:focus-visible { outline: 3px solid #e8192c; outline-offset: 4px; }
  .page { max-width: 640px; min-height: 100dvh; margin: 0 auto; background: #fff; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
  nav { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; }
  nav a { display: inline-flex; min-width: 44px; min-height: 44px; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; font-weight: 700; }
  .arrow { font-size: 20px; }
  main { padding: 16px; }
  .notice { display: flex; gap: 8px; border: 1px solid rgb(232 25 44 / 20%); border-radius: 16px; padding: 16px; box-shadow: 0 8px 24px rgb(0 0 0 / 7%); }
  .notice-icon { width: 20px; height: 20px; flex: none; color: #e8192c; }
  h1 { margin: 0; font-size: 14px; line-height: 20px; }
  .copy { margin-top: 8px; color: #64748b; line-height: 24px; }
  .copy p { margin: 0; }
  .copy p + p { margin-top: 8px; }
  .spinner { display: inline-flex; width: 16px; height: 16px; }
  .spinner[hidden] { display: none; }
  .spinner svg { width: 100%; height: 100%; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
  @media (prefers-reduced-motion: no-preference) { .spinner svg { animation: spin 1s linear infinite; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .retry { display: inline-flex; min-height: 44px; align-items: center; gap: 8px; margin-top: 12px; padding: 0 12px; color: #e8192c; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^[a-f0-9]{64}$/.test(id)) return new Response(null, { status: 404 });

  const body = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>기사를 불러오지 못했어요 · 흉흉 · 내 주변의 사건 사고</title><style>${styles}</style></head>
<body><div class="page"><nav aria-label="기사 상세 탐색"><a href="/incidents" aria-label="목록으로"><span aria-hidden="true" class="arrow">←</span> 사건 상세</a><a href="/" aria-label="지도로"><img src="/article-detail/header-close.svg" width="24" height="24" alt=""></a></nav>
<main><section class="notice" role="alert"><svg aria-hidden="true" class="notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 1v3m0 16v3M1 12h3m16 0h3"></path></svg><div><h1>이 소식을 다시 열어볼까요?</h1><div class="copy"><p><strong>기사를 불러오지 못했어요</strong></p><p>연결을 확인한 뒤 다시 눌러주세요.</p><a class="retry" href="/incidents/${id}" aria-label="다시 시도" aria-busy="false" data-detail-retry><span class="spinner" role="status" aria-busy="true" hidden><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity=".25"></circle><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path></svg><span class="sr-only">기사를 다시 불러오는 중이에요</span></span><span>다시 시도</span></a></div></div></section></main></div><script src="/article-detail/error-retry.js" defer></script></body></html>`;

  return new Response(body, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '60',
      'Content-Security-Policy':
        "default-src 'none'; img-src 'self'; font-src 'self'; style-src 'unsafe-inline'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const HEAD = GET;
