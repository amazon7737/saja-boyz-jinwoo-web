'use client';

import Image from 'next/image';
import { useState } from 'react';

export function MapCarouselImage({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="relative m-0 h-20 w-full overflow-hidden rounded-lg bg-background [@media(max-height:550px)]:hidden">
      {src && !failed ? (
        <>
          <Image
            src={src}
            alt=""
            width={176}
            height={80}
            unoptimized
            onError={() => setFailed(true)}
            className="block h-20 w-full object-cover"
          />
          <figcaption className="absolute right-1 bottom-1 rounded bg-floating px-1 text-[10px]/4 text-muted">
            AI 생성 이미지
          </figcaption>
        </>
      ) : (
        <span className="grid h-full place-items-center text-[12px]/[normal] text-muted">
          이미지 없음
        </span>
      )}
    </figure>
  );
}
