'use client';

import { ErrorBoundary } from '@suspensive/react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { FeatureError, featureErrorMessages } from '../model/feature-error';

// Keep the approved boundary module contract while the class lives in a neutral model.
export { FeatureError } from '../model/feature-error';

export function FeatureErrorBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ErrorBoundary
      resetKeys={[pathname]}
      fallback={({ reset }) => (
        <div role="alert">
          화면을 표시하지 못했어요
          <button type="button" onClick={reset}>
            다시 시도
          </button>
        </div>
      )}
    >
      <ErrorBoundary
        resetKeys={[pathname]}
        shouldCatch={FeatureError}
        fallback={({ error, reset }) => (
          <div role="alert">
            {featureErrorMessages[error.reason]}
            <button type="button" onClick={reset}>
              다시 시도
            </button>
          </div>
        )}
        onError={(error) => console.error('기능 오류:', error.reason)}
      >
        {children}
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
