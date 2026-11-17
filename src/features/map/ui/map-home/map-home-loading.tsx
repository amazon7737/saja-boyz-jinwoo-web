import { LoadingSpinner } from '@/components/feedback/loading-spinner';

export function MapCarouselSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-map-carousel-skeleton=""
      className={`ui-skeleton-pulse flex gap-2.5 overflow-hidden ${className}`}
    >
      {[0, 1, 2, 3].map((card) => (
        <div
          key={card}
          data-map-skeleton-card=""
          className="flex h-[152px] w-[200px] shrink-0 flex-col gap-2 rounded-card bg-surface/90 p-3 [@media(max-height:550px)]:h-[62px]"
        >
          <span className="h-3 w-1/2 rounded bg-border" />
          <span className="h-4 rounded bg-border" />
          <span className="mt-auto h-20 rounded-lg bg-border [@media(max-height:550px)]:hidden" />
        </div>
      ))}
    </div>
  );
}

export function MapHomeLoading() {
  return (
    <section
      data-map-loading=""
      aria-label="주변 지도"
      className="relative h-dvh overflow-hidden bg-[#e7edea]"
    >
      <div role="status" aria-busy="true" className="h-full">
        <span className="sr-only">주변 기사를 지도에 불러오는 중이에요</span>
        <div
          aria-hidden="true"
          className="ui-skeleton-pulse absolute top-[calc(68px_+_env(safe-area-inset-top))] right-4 left-4 flex h-[30px] gap-1.5"
        >
          {[42, 60, 82, 60].map((width, index) => (
            <span
              key={index}
              className="h-[27px] rounded-pill bg-border"
              style={{ width }}
            />
          ))}
        </div>
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 text-muted"
        >
          <LoadingSpinner />
        </span>
        <MapCarouselSkeleton className="absolute right-0 bottom-[calc(86px_+_env(safe-area-inset-bottom))] left-4" />
      </div>
    </section>
  );
}
