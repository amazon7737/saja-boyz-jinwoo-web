'use client';

import { useRef, useState } from 'react';

export function DetailShare({ id, title }: { id: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const sharing = useRef(false);

  async function share() {
    if (sharing.current) return;
    sharing.current = true;
    setCopied(false);
    setManualUrl('');
    const url = `${window.location.origin}/incidents/${id}`;

    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title, url });

          return;
        } catch (error) {
          if (
            error !== null &&
            typeof error === 'object' &&
            'name' in error &&
            error.name === 'AbortError'
          ) {
            return;
          }
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        setManualUrl(url);
      }
    } finally {
      sharing.current = false;
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={share}
        className="min-h-12 w-full cursor-pointer rounded-card border border-solid border-brand bg-surface px-4 py-3 font-bold text-brand hover:bg-background"
      >
        기사 공유하기
      </button>
      {copied && (
        <p role="status" className="mb-0 text-sm text-muted">
          링크를 복사했어요
        </p>
      )}
      {manualUrl && (
        <div>
          <p className="text-sm text-muted">아래 링크를 직접 복사해 주세요.</p>
          <input
            aria-label="공유 링크"
            value={manualUrl}
            readOnly
            className="w-full rounded-lg border border-solid border-border bg-background p-3 text-sm text-text"
          />
        </div>
      )}
    </div>
  );
}
