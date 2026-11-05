'use client';

import { useEffect, useRef } from 'react';

export function ReportVideoPreview({ file }: { file: File }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = video.current;

    if (!element || typeof URL.createObjectURL !== 'function') return;
    let url: string;

    try {
      url = URL.createObjectURL(file);
    } catch {
      return;
    }

    element.src = url;
    element.hidden = false;

    return () => {
      if (!element.paused) element.pause();
      element.hidden = true;
      element.removeAttribute('src');
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <video
      ref={video}
      hidden
      muted
      playsInline
      controls
      preload="metadata"
      aria-label={`${file.name} 미리보기`}
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
      className="size-[76px] shrink-0 rounded-lg bg-background object-cover"
    />
  );
}
