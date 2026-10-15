import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { mapPeriods, type MapPeriod } from '../../model/map-period-filter';

export function MapAllFilters({
  value,
  onChange,
}: {
  value: MapPeriod;
  onChange(value: MapPeriod): void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="전체 필터"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(true)}
        className={`ui-control flex h-[30px] w-[42px] shrink-0 items-center justify-center rounded-[20px] border border-solid bg-floating px-[11px] py-[5px] backdrop-blur-[8px] ${value === 'all' ? 'border-[rgba(200,210,220,0.6)]' : 'border-brand'}`}
      >
        <Image
          src={
            value === 'all'
              ? '/filters/filter.svg'
              : '/filters/filter-active.svg'
          }
          alt=""
          width={18}
          height={18}
          className="block"
        />
      </button>
      {open && (
        <FilterSheet
          id={panelId}
          initialValue={value}
          onClose={close}
          onApply={onChange}
          restoreFocus={() => trigger.current?.focus({ preventScroll: true })}
        />
      )}
    </>
  );
}

function FilterSheet({
  id,
  initialValue,
  onClose,
  onApply,
  restoreFocus,
}: {
  id: string;
  initialValue: MapPeriod;
  onClose(): void;
  onApply(value: MapPeriod): void;
  restoreFocus(): void;
}) {
  const [draft, setDraft] = useState(initialValue);
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const callbacks = useRef({ onClose, restoreFocus });

  useEffect(() => {
    const { onClose, restoreFocus } = callbacks.current;
    const background = Array.from(document.body.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && node !== overlay.current,
    );
    const previous = background.map((node) => node.inert);
    const overflow = document.body.style.overflow;

    background.forEach((node) => (node.inert = true));
    document.body.style.overflow = 'hidden';
    const buttons = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled)',
        ) ?? [],
      );

    buttons()[0]?.focus({ preventScroll: true });

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }

      if (event.key === 'Tab') {
        const available = buttons();
        const first = available[0];
        const last = available[available.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', onKey, true);

    return () => {
      document.removeEventListener('keydown', onKey, true);
      background.forEach((node, index) => (node.inert = previous[index]));
      document.body.style.overflow = overflow;
      restoreFocus();
    };
  }, []);

  return createPortal(
    <div
      ref={overlay}
      className="ui-overlay-enter fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="전체 필터"
        className="ui-sheet-enter flex max-h-[90dvh] w-full max-w-[640px] flex-col gap-5 overflow-y-auto overscroll-contain rounded-t-3xl border border-solid border-border bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-text shadow-floating"
      >
        <div
          aria-hidden="true"
          className="h-1 w-9 shrink-0 self-center rounded-full bg-slate-300"
        />
        <header className="flex items-center justify-between">
          <h2 className="m-0 text-lg font-extrabold">전체 필터</h2>
          <button
            type="button"
            aria-label="필터 닫기"
            onClick={onClose}
            className="ui-control flex size-10 shrink-0 items-center justify-center border-0 bg-transparent p-0"
          >
            <Image src="/map/sheet-close.svg" alt="" width={40} height={40} />
          </button>
        </header>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-2.5 p-0 text-sm font-bold">
            기간{' '}
            <span className="text-xs font-normal text-muted">발행일 기준</span>
          </legend>
          <div className="grid grid-cols-2 gap-1.5">
            {mapPeriods.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={draft === option.value}
                onClick={() => setDraft(option.value)}
                className={`ui-control rounded-lg border border-solid px-3 py-2.5 text-[13px] font-semibold ${draft === option.value ? 'border-brand bg-brand/5 text-brand' : 'border-border bg-surface text-muted'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <UnavailableOptions
          label="카테고리"
          explanation="분류 정보 미제공"
          options={['사회', '안보', '정치', '국제']}
        />
        <UnavailableOptions
          label="상태"
          explanation="상태 정보 미제공"
          options={['진행 중', '공론화 성공', '종결']}
        />
        <footer className="flex gap-2 border-0 border-t border-solid border-border pt-4">
          <button
            type="button"
            onClick={() => setDraft('all')}
            className="ui-control rounded-xl border border-solid border-border bg-surface px-4 py-3 text-sm font-semibold text-muted"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="ui-control ui-primary flex-1 rounded-xl border-0 bg-brand px-4 py-3 text-sm font-bold text-white"
          >
            필터 적용하기
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function UnavailableOptions({
  label,
  explanation,
  options,
}: {
  label: string;
  explanation: string;
  options: string[];
}) {
  const explanationId = useId();

  return (
    <fieldset
      aria-describedby={explanationId}
      className="m-0 min-w-0 border-0 p-0"
    >
      <legend className="mb-2.5 p-0 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {['전체', ...options].map((option, index) => (
          <button
            key={option}
            type="button"
            disabled={index > 0}
            aria-pressed={index === 0}
            className={`rounded-lg border border-solid px-3.5 py-2 text-[13px] font-semibold ${index === 0 ? 'border-brand bg-brand/5 text-brand' : 'cursor-not-allowed border-border bg-surface text-muted'}`}
          >
            {option}
          </button>
        ))}
      </div>
      <p id={explanationId} className="m-0 mt-2 text-xs text-muted">
        {explanation}
      </p>
    </fieldset>
  );
}
