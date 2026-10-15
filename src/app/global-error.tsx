'use client';

import RouteError from './error';

export default function GlobalError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry?: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <RouteError error={error} reset={reset} retry={retry} />
      </body>
    </html>
  );
}
