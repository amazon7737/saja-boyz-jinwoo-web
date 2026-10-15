import { useEffect, useId, useRef, useState } from 'react';

const filters = {
  category: {
    label: '카테고리',
    explanation: '분류 정보 미제공',
    options: ['사회', '안보', '정치', '국제'],
  },
  status: {
    label: '상태',
    explanation: '상태 정보 미제공',
    options: ['진행 중', '공론화 성공', '종결'],
  },
};

export function MapUnavailableFilter({ kind }: { kind: keyof typeof filters }) {
  const { label, explanation, options } = filters[kind];
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const explanationId = useId();

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }

    function onPointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        close();
    }

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={`ui-control flex h-[27px] items-center justify-center gap-1 rounded-[20px] border border-solid border-[rgba(200,210,220,0.6)] bg-floating px-[11px] py-[5px] text-[12px]/[15px] font-semibold whitespace-nowrap text-text backdrop-blur-[8px] ${kind === 'category' ? 'w-[82px]' : 'w-[60px]'}`}
      >
        {label}
        <span aria-hidden="true" className="text-[8px]/[10px] text-muted">
          ▼
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={`${label} 선택`}
          aria-describedby={explanationId}
          className={`ui-dropdown-enter absolute top-full z-10 mt-2 w-40 overflow-hidden rounded-[14px] bg-white/97 shadow-[0px_8px_32px_rgba(0,0,0,0.14)] backdrop-blur-[20px] ${kind === 'category' ? 'left-0' : 'left-[min(0px,calc(100vw_-_394px))]'}`}
        >
          {['전체', ...options].map((option, index) => (
            <button
              key={option}
              type="button"
              aria-label={option}
              disabled={index > 0}
              aria-pressed={index === 0}
              aria-describedby={index > 0 ? explanationId : undefined}
              onClick={close}
              className={`ui-control flex h-[46px] w-full items-center gap-2.5 border-0 border-b border-solid border-black/4 px-4 py-3 text-left text-sm leading-[21px] text-muted ${index === 0 ? 'bg-muted/7 font-semibold' : 'cursor-not-allowed bg-transparent'}`}
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-[4px] ${index === 0 ? 'bg-muted' : 'bg-slate-300'}`}
              />
              {option}
              {index === 0 && (
                <span aria-hidden="true" className="ml-auto">
                  ✓
                </span>
              )}
            </button>
          ))}
          <p id={explanationId} className="m-0 px-4 py-2 text-xs text-muted">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
