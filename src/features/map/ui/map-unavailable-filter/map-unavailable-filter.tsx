import { useEffect, useId, useRef, useState } from 'react';

import {
  MapFilterTrigger,
  MapFilterPanel,
  MapFilterOption,
} from '../map-filter-dropdown/map-filter-dropdown';

const filters = {
  category: {
    label: '카테고리',
    explanation: '분류 정보 미제공',
    options: ['안보', '사회', '정치', '국제'],
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
      <MapFilterTrigger
        controlRef={trigger}
        label={label}
        expanded={open}
        controls={panelId}
        wide
        onClick={() => setOpen(!open)}
      >
        {label}
      </MapFilterTrigger>
      {open && (
        <MapFilterPanel
          id={panelId}
          label={`${label} 선택`}
          descriptionId={explanationId}
        >
          {['전체', ...options].map((option, index) => (
            <MapFilterOption
              key={option}
              label={option}
              disabled={index > 0}
              selected={index === 0}
              descriptionId={explanationId}
              onClick={close}
            >
              {option}
            </MapFilterOption>
          ))}
          <p id={explanationId} className="sr-only">
            {explanation}
          </p>
        </MapFilterPanel>
      )}
    </div>
  );
}
