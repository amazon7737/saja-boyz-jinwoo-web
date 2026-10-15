'use client';

import Image from 'next/image';
import { useState } from 'react';

export function ArticleImage({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="col-start-1 row-span-4 row-start-1 grid size-20 place-items-center self-start rounded-lg bg-background text-[12px]/[normal] text-muted">
        이미지 없음
      </span>
    );
  }

  return (
    <figure className="col-start-1 row-span-4 row-start-1 m-0 flex w-20 flex-col gap-1 self-start text-[11px]/[13px] text-muted">
      <Image
        className="block size-20 rounded-lg object-cover"
        src={src}
        alt=""
        width={80}
        height={80}
        unoptimized
        onError={() => setFailed(true)}
      />
      <figcaption>AI 생성 이미지</figcaption>
    </figure>
  );
}
