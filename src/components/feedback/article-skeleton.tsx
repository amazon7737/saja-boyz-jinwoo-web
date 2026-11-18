type SkeletonVariant = 'list' | 'search' | 'detail';

export function ArticleSkeleton({
  label,
  variant = 'list',
  initial = false,
  fillViewport = initial,
  count = 2,
}: {
  label: string;
  variant?: SkeletonVariant;
  initial?: boolean;
  fillViewport?: boolean;
  count?: number;
}) {
  const viewportLimit =
    variant === 'list'
      ? 'max-h-[max(0px,calc(100dvh-200px))]'
      : initial
        ? 'max-h-[max(0px,calc(100dvh-110px))]'
        : 'max-h-[max(0px,calc(100dvh-90px))]';

  return (
    <div
      role="status"
      aria-busy="true"
      className={
        variant === 'list' ? (initial ? 'py-2' : 'pt-1 pb-2') : undefined
      }
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="ui-skeleton-pulse">
        {variant === 'detail' ? (
          <div className="flex flex-col gap-4 bg-surface">
            <div className="flex flex-col gap-2">
              <div className="h-6 w-3/4 rounded bg-border" />
              <div className="h-4 w-1/3 rounded bg-border" />
            </div>
            <div className="h-[140px] rounded-lg bg-border" />
            <div className="h-4 w-24 rounded bg-border" />
            <div className="flex flex-col gap-2">
              <div className="mb-2 h-5 w-20 rounded bg-border" />
              {[0, 1, 2, 3].map((line) => (
                <div key={line} className="h-5 rounded bg-border last:w-2/3" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {initial && variant === 'search' && (
              <div className="mb-3 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="size-9 shrink-0 rounded-xl bg-border" />
                  <div className="h-[37px] flex-1 rounded-card bg-border" />
                </div>
                <div className="h-[18px] w-24 rounded bg-border" />
              </div>
            )}
            <div
              data-skeleton-cards=""
              className={`flex flex-col ${variant === 'search' ? 'gap-2' : 'gap-3'} ${fillViewport ? `overflow-hidden ${viewportLimit}` : ''}`}
            >
              {Array.from({ length: fillViewport ? 32 : count }, (_, card) => (
                <div
                  key={card}
                  className={`flex gap-3 border border-solid border-border bg-surface ${variant === 'search' ? 'rounded-xl p-3.5' : 'min-h-[120px] rounded-card p-3'}`}
                >
                  {variant === 'list' && (
                    <div className="size-20 shrink-0 rounded-lg bg-border" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="h-5 w-3/4 rounded bg-border" />
                    <div className="h-[18px] rounded bg-border" />
                    {variant === 'list' && (
                      <div className="h-[18px] w-2/3 rounded bg-border" />
                    )}
                    <div className="h-4 w-1/3 rounded bg-border" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
