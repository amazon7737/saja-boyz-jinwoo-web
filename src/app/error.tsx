'use client';

import { useEffect } from 'react';

import {
  FeatureError,
  featureErrorMessages,
} from '../components/errors/model/feature-error';

export default function RouteError({
  error,
  reset,
  retry,
}: {
  error: unknown;
  reset: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    if (error instanceof FeatureError) {
      console.error('기능 오류:', error.reason);
    }
  }, [error]);

  return (
    <div role="alert">
      {error instanceof FeatureError
        ? featureErrorMessages[error.reason]
        : '화면을 표시하지 못했어요'}
      <button type="button" onClick={retry ?? reset}>
        다시 시도
      </button>
    </div>
  );
}
