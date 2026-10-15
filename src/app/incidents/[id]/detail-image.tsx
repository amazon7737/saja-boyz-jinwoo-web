'use client';

import Image from 'next/image';
import { useState } from 'react';

export function DetailImage({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <p className="m-0 grid h-[190px] w-full place-items-center rounded-[14px] bg-background text-sm text-muted">
        이미지 없음
      </p>
    );
  }

  return (
    <figure className="m-0">
      <Image
        src={src}
        alt=""
        width={720}
        height={380}
        unoptimized
        className="block h-[190px] w-full rounded-[14px] object-cover"
        onError={() => setFailed(true)}
      />
      <figcaption className="mt-2 text-[11px]/4 text-muted">
        AI 생성 이미지
      </figcaption>
    </figure>
  );
}
