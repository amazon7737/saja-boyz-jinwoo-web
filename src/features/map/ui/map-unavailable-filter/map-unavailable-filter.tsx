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
      <MapFilterTrigger
        controlRef={trigger}
        label={label}
        expanded={open}
        controls={panelId}
        wide={kind === 'category'}
        onClick={() => setOpen(!open)}
      >
        {label}
      </MapFilterTrigger>
      {open && (
        <MapFilterPanel
          id={panelId}
          label={`${label} 선택`}
          descriptionId={explanationId}
          alignStatus={kind === 'status'}
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
          <p
            id={explanationId}
            className={
              kind === 'category'
                ? 'sr-only'
                : 'm-0 px-4 py-2 text-xs text-muted'
            }
          >
            {explanation}
          </p>
        </MapFilterPanel>
      )}
    </div>
  );
}
