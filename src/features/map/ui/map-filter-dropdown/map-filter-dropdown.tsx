import type { ReactNode, Ref } from 'react';

import { IconText } from '@/components/ui/icon-text/icon-text';

export function MapFilterTrigger({
  controlRef,
  label,
  expanded,
  controls,
  descriptionId,
  active = false,
  wide = false,
  onClick,
  children,
}: {
  controlRef: Ref<HTMLButtonElement>;
  label: string;
  expanded: boolean;
  controls: string;
  descriptionId?: string;
  active?: boolean;
  wide?: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      ref={controlRef}
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-describedby={descriptionId}
      onClick={onClick}
      className={`ui-control flex h-[27px] items-center justify-center gap-1 rounded-[20px] border border-solid bg-floating px-1 py-[5px] text-[12px]/[15px] font-semibold whitespace-nowrap backdrop-blur-[8px] ${wide ? 'w-[82px]' : 'w-[60px]'} ${active ? 'border-brand text-brand' : 'border-[rgba(200,210,220,0.6)] text-text'}`}
    >
      <IconText
        icon="chevron-down"
        size="indicator"
        spacing="compact"
        position="end"
        iconClassName="text-muted"
      >
        {children}
      </IconText>
    </button>
  );
}

export function MapFilterPanel({
  id,
  label,
  descriptionId,
  alignStatus = false,
  children,
}: {
  id: string;
  label: string;
  descriptionId?: string;
  alignStatus?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      aria-describedby={descriptionId}
      className={`ui-dropdown-enter absolute top-full z-10 mt-2 min-w-36 rounded-xl border border-solid border-border bg-white p-1.5 shadow-floating [&>p:not(.sr-only)]:px-3 ${alignStatus ? 'left-[min(0px,calc(100vw_-_394px))]' : 'left-0'}`}
    >
      {children}
    </div>
  );
}

export function MapFilterOption({
  selected,
  disabled = false,
  descriptionId,
  label,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  descriptionId?: string;
  label?: string;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      aria-describedby={disabled ? descriptionId : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`ui-control block w-full rounded-lg border-0 px-3 py-2 text-left text-xs font-semibold ${selected ? 'bg-brand/5 text-brand' : disabled ? 'cursor-not-allowed bg-transparent text-muted' : 'bg-transparent text-text'}`}
    >
      {children}
    </button>
  );
}
