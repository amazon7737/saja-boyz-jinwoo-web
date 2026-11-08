import { Analytics } from '@vercel/analytics/next';
import type { AppProps } from 'next/app';

import '@/app/globals.css';
import { AppShell } from '@/components/layout/app-shell/app-shell';
import { SearchPromptProvider } from '@/features/search/model/use-rolling-search-prompt';

export default function MyApp({ Component, pageProps, router }: AppProps) {
  const isNotFound = pageProps.result?.status === 'not-found';

  const content = (
    <AppShell
      backgroundPath={
        isNotFound ? '/__missing-article' : router.asPath.split('?')[0]
      }
    >
      <Component {...pageProps} />
    </AppShell>
  );

  return (
    <>
      <Analytics />
      {isNotFound ? (
        <SearchPromptProvider>{content}</SearchPromptProvider>
      ) : (
        content
      )}
    </>
  );
}
