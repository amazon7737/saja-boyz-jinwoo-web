'use client';

import { useEffect, useRef } from 'react';

export function ReportImagePreview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const element = image.current;

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
      element.hidden = true;
      element.removeAttribute('src');
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    // 로컬 blob URL은 클라이언트에서 생성하므로 Next 이미지 최적화를 사용하지 않는다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={image}
      hidden
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
      alt=""
      width={76}
      height={76}
      className="size-[76px] shrink-0 rounded-lg object-cover"
    />
  );
}
