type SkeletonVariant = 'list' | 'search' | 'detail';

export function ArticleSkeleton({
  label,
  variant = 'list',
  initial = false,
}: {
  label: string;
  variant?: SkeletonVariant;
  initial?: boolean;
}) {
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
          <div className="flex flex-col gap-4 bg-surface px-4 pb-6">
            <div className="-mx-4 flex min-h-12 items-center justify-between border-0 border-b border-solid border-border px-4">
              <div className="h-5 w-28 rounded bg-border" />
              <div className="size-6 rounded bg-border" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-[30px] w-3/4 rounded bg-border" />
              <div className="h-4 w-1/3 rounded bg-border" />
            </div>
            <div className="h-[190px] rounded-card bg-border" />
            <div className="h-4 w-24 rounded bg-border" />
            <div className="flex flex-col gap-2">
              <div className="mb-2 h-5 w-20 rounded bg-border" />
              {[0, 1, 2, 3].map((line) => (
                <div
                  key={line}
                  className="h-[22px] rounded bg-border last:w-2/3"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {initial && variant === 'search' && (
              <div className="mb-3 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="size-11 shrink-0 rounded-xl bg-border" />
                  <div className="h-[47px] flex-1 rounded-card bg-border" />
                </div>
                <div className="h-[18px] w-24 rounded bg-border" />
              </div>
            )}
            <div className="flex flex-col gap-3">
              {[0, 1].map((card) => (
                <div
                  key={card}
                  className="flex gap-3 rounded-card border border-solid border-border bg-surface p-3"
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
