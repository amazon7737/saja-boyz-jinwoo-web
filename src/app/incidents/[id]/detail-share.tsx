'use client';

import { useRef, useState } from 'react';

import { IconText } from '@/components/ui/icon-text/icon-text';

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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={share}
        className="ui-control inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-1 rounded-xl border-[1.5px] border-solid border-brand bg-surface px-4 py-3 text-[15px]/5 font-extrabold text-brand"
      >
        <IconText icon="link" size="action" spacing="comfortable">
          기사 공유하기
        </IconText>
      </button>
      {copied && (
        <p role="status" className="m-0 text-sm text-muted">
          링크를 복사했어요
        </p>
      )}
      {manualUrl && (
        <div className="flex flex-col gap-2">
          <p role="status" className="m-0 text-sm text-muted">
            아래 링크를 직접 복사해 주세요.
          </p>
          <input
            aria-label="공유 링크"
            value={manualUrl}
            readOnly
            className="w-full rounded-lg border border-solid border-border bg-background p-3 text-sm text-text outline-offset-0 focus-visible:border-transparent focus-visible:outline-[1px]"
          />
        </div>
      )}
    </div>
  );
}
