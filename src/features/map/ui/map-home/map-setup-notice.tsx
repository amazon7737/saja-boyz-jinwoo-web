'use client';

export function MapSetupNotice() {
  return (
    <section
      aria-label="주변 지도"
      className="min-h-[320px] bg-background px-4 pt-26 pb-4"
    >
      <div role="alert" className="rounded-2xl bg-floating p-4 shadow-floating">
        <h1 className="mt-0 mb-3 text-2xl leading-[1.4]">
          지도 설정이 필요합니다
        </h1>
        <p className="text-muted leading-[1.7]">
          지도를 표시할 수 없습니다. 지도 설정은 관리자에게 문의해 주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-border px-4 py-2"
        >
          다시 시도
        </button>
      </div>
    </section>
  );
}
