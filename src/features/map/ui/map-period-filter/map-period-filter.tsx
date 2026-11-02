import { useEffect, useId, useRef, useState } from 'react';

import {
  MapFilterTrigger,
  MapFilterPanel,
  MapFilterOption,
} from '../map-filter-dropdown/map-filter-dropdown';
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
      <MapFilterTrigger
        controlRef={trigger}
        label={value === 'all' ? '기간' : `기간: ${selected.label}`}
        expanded={open}
        controls={panelId}
        descriptionId={explanationId}
        active={value !== 'all'}
        onClick={() => setOpen(!open)}
      >
        {value === 'all' ? '기간' : selected.label.replace('최근 ', '')}
      </MapFilterTrigger>
      <span id={explanationId} className="sr-only">
        발행일 기준
      </span>
      {open && (
        <MapFilterPanel id={panelId} label="기간 선택">
          <p className="m-0 px-3 py-2 text-xs text-muted">발행일 기준</p>
          {mapPeriods.map((option) => (
            <MapFilterOption
              key={option.value}
              selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                trigger.current?.focus({ preventScroll: true });
              }}
            >
              {option.label}
            </MapFilterOption>
          ))}
        </MapFilterPanel>
      )}
    </div>
  );
}
