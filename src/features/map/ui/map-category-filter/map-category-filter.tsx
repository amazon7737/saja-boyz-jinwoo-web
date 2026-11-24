import { useEffect, useId, useRef, useState } from 'react';

import {
  MapFilterTrigger,
  MapFilterPanel,
  MapFilterOption,
} from '../map-filter-dropdown/map-filter-dropdown';
import {
  mapCategories,
  type MapCategory,
} from '../../model/map-category-filter';

export function MapCategoryFilter({
  value,
  onChange,
}: {
  value: MapCategory;
  onChange(value: MapCategory): void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const selected = mapCategories.find((option) => option.value === value)!;

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
        label={value === 'all' ? '카테고리' : `카테고리: ${selected.label}`}
        expanded={open}
        controls={panelId}
        active={value !== 'all'}
        wide
        onClick={() => setOpen(!open)}
      >
        {value === 'all' ? '카테고리' : selected.label}
      </MapFilterTrigger>
      {open && (
        <MapFilterPanel id={panelId} label="카테고리 선택">
          {mapCategories.map((option) => (
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
