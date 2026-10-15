import { useEffect, useId, useRef, useState } from 'react';

import { mapPeriods, type MapPeriod } from '../../model/map-period-filter';

export function MapPeriodFilter({
  value,
  onChange,
}: {
  value: MapPeriod;
  onChange(value: MapPeriod): void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const explanationId = useId();
  const selected = mapPeriods.find((option) => option.value === value)!;

  useEffect(() => {
    if (!open) return;

    const close = () => {
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        close();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div ref={container} className="relative flex items-center gap-1.5">
      <button
        ref={trigger}
        type="button"
        aria-label={value === 'all' ? '기간' : `기간: ${selected.label}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={explanationId}
        onClick={() => setOpen(!open)}
        className={`ui-control flex h-[27px] w-[60px] items-center justify-center gap-1 rounded-[20px] border border-solid bg-floating px-1 py-[5px] text-[12px]/[15px] font-semibold backdrop-blur-[8px] ${value === 'all' ? 'border-[rgba(200,210,220,0.6)] text-text' : 'border-brand text-brand'}`}
      >
        {value === 'all' ? '기간' : selected.label.replace('최근 ', '')}
        <span aria-hidden="true" className="text-[8px]/[10px] text-muted">
          ▼
        </span>
      </button>
      <span id={explanationId} className="sr-only">
        발행일 기준
      </span>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="기간 선택"
          className="ui-dropdown-enter absolute top-full left-0 mt-2 min-w-36 rounded-xl border border-solid border-border bg-white p-1.5 shadow-floating"
        >
          <p className="m-0 px-3 py-2 text-xs text-muted">발행일 기준</p>
          {mapPeriods.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                trigger.current?.focus({ preventScroll: true });
              }}
              className={`ui-control block w-full border-0 rounded-lg px-3 py-2 text-left text-xs font-semibold ${value === option.value ? 'bg-brand/5 text-brand' : 'bg-transparent text-text'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
