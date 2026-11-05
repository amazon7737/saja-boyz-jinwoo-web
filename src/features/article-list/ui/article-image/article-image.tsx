'use client';

import Image from 'next/image';

import {
  ImageLoading,
  useImageLoading,
} from '@/components/feedback/image-loading';

export function ArticleImage({
  src,
  showAiCaption = false,
  wide = false,
}: {
  src: string | null;
  showAiCaption?: boolean;
  wide?: boolean;
}) {
  const { status, attachImage, onLoad, onError } = useImageLoading(src);

  if (!src || status === 'failed') {
    return (
      <span
        className={
          wide
            ? 'grid h-[140px] w-full place-items-center rounded-lg bg-background text-[12px]/[normal] text-muted'
            : 'col-start-1 row-span-4 row-start-1 grid size-20 place-items-center self-start rounded-lg bg-background text-[12px]/[normal] text-muted'
        }
      >
        이미지 없음
      </span>
    );
  }

  return (
    <figure
      className={
        wide
          ? 'm-0 w-full text-[10px]/[15px] text-muted'
          : 'col-start-1 row-span-4 row-start-1 m-0 w-20 self-start text-[11px]/[13px] text-muted'
      }
    >
      <div className={wide ? 'relative h-[140px] w-full' : 'relative size-20'}>
        {status === 'loading' && <ImageLoading />}
        <Image
          key={src}
          className={
            wide
              ? 'relative block h-[140px] w-full rounded-lg object-cover'
              : 'relative block size-20 rounded-lg object-cover'
          }
          src={src}
          alt=""
          width={wide ? 361 : 80}
          height={wide ? 140 : 80}
          unoptimized
          ref={attachImage}
          onLoad={onLoad}
          onError={onError}
        />
      </div>
      {showAiCaption && (
        <figcaption
          className={
            wide
              ? 'mt-1 text-[10px]/[15px] text-muted'
              : 'mt-1 text-[9px]/3 text-muted'
          }
        >
          AI로 생성된 이미지입니다.
        </figcaption>
      )}
    </figure>
  );
}
