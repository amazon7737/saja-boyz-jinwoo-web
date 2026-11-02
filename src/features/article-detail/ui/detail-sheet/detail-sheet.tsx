'use client';

import Link from 'next/link';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from 'react';

import { DetailInline } from './detail-inline';
import { useArticleSheetRoute } from '../../model/article-sheet-context';

const scrollLocks = new Set<symbol>();
let unlockedBody: { overflow: string; paddingRight: string } | undefined;

function lockBodyScroll() {
  const token = Symbol();

  if (scrollLocks.size === 0) {
    unlockedBody = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    const width = document.documentElement.clientWidth;
    const gutter = width > 0 ? window.innerWidth - width : 0;

    document.body.style.overflow = 'hidden';
    if (gutter > 0) document.body.style.paddingRight = gutter + 'px';
  }

  scrollLocks.add(token);

  return () => {
    if (!scrollLocks.delete(token) || scrollLocks.size > 0 || !unlockedBody)
      return;

    document.body.style.overflow = unlockedBody.overflow;
    document.body.style.paddingRight = unlockedBody.paddingRight;
    unlockedBody = undefined;
  };
}

type DetailSheetProps = {
  titleId: string;
  children?: ReactNode;
  footer?: ReactNode;
  label?: string;
  initialExpanded?: boolean;
  onClose?(): void;
  closeLabel?: string;
  onHeightChange?(height: number, expanded?: boolean): void;
  active?: boolean;
};

export function DetailSheet(props: DetailSheetProps) {
  const route = useArticleSheetRoute();

  if (
    route?.active &&
    route.sourcePath === '/incidents' &&
    !props.onClose &&
    props.active !== false
  )
    return (
      <DetailInline titleId={props.titleId} footer={props.footer}>
        {props.children}
      </DetailInline>
    );

  return <ModalDetailSheet {...props} />;
}

function ModalDetailSheet({
  titleId,
  children,
  footer,
  label,
  initialExpanded,
  onClose,
  closeLabel = '닫기',
  onHeightChange,
  active = true,
}: DetailSheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef(0);
  const caller = useRef<HTMLElement | null>(null);
  const rememberedFocus = useRef<HTMLElement | null>(null);
  const closeControl = useRef<HTMLAnchorElement | HTMLButtonElement | null>(
    null,
  );
  const route = useArticleSheetRoute();
  const [expanded, setExpanded] = useState(() => initialExpanded ?? false);
  const localClose = Boolean(onClose);
  const drag = useRef<{ start: number; moved: boolean } | null>(null);
  const reportHeight = localClose
    ? onHeightChange
    : route?.active
      ? route.setHeight
      : onHeightChange;

  useLayoutEffect(() => {
    if (active && scroller.current)
      scroller.current.scrollTop = scrollPosition.current;
  }, [active]);

  useEffect(() => {
    const element = panel.current;

    if (!active || !element) return;
    const update = () =>
      reportHeight?.(element.getBoundingClientRect().height, expanded);

    update();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(update);

    observer?.observe(element);
    window.addEventListener('resize', update);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      reportHeight?.(0);
    };
  }, [active, reportHeight, expanded]);

  useEffect(() => {
    if (!active) return;
    const element = panel.current;

    if (!caller.current && document.activeElement instanceof HTMLElement)
      caller.current = document.activeElement;

    const unlockBodyScroll = lockBodyScroll();
    const background = localClose
      ? document.querySelector<HTMLElement>('[data-article-background]')
      : null;
    const previousInert = background?.inert;
    const previousHidden = background?.getAttribute('aria-hidden');

    if (background) {
      background.inert = true;
      background.setAttribute('aria-hidden', 'true');
    }

    if (rememberedFocus.current?.isConnected)
      rememberedFocus.current.focus({ preventScroll: true });
    else if (localClose) closeControl.current?.focus({ preventScroll: true });
    else element?.focus({ preventScroll: true });

    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !element?.contains(event.target))
        element?.focus({ preventScroll: true });
    };

    document.addEventListener('focusin', containFocus);

    return () => {
      document.removeEventListener('focusin', containFocus);
      unlockBodyScroll();

      // A group chooser can be replaced by a routed detail in the same commit.
      if (background && background.dataset.articleOverlay !== 'true') {
        background.inert = previousInert ?? false;
        if (previousHidden === null || previousHidden === undefined)
          background.removeAttribute('aria-hidden');
        else background.setAttribute('aria-hidden', previousHidden);
      }

      // Suspending a group chooser must not take focus from the routed detail.
      if (!element?.hidden && caller.current?.isConnected)
        caller.current.focus({ preventScroll: true });
    };
  }, [active, localClose]);

  function close(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;

    if (onClose) {
      event.preventDefault();
      onClose();
    } else if (route?.active) {
      event.preventDefault();
      route.close();
    }
  }

  return (
    <div
      ref={panel}
      role={active ? 'dialog' : undefined}
      aria-modal={active ? true : undefined}
      aria-label={active ? label : undefined}
      aria-labelledby={active ? titleId : undefined}
      aria-hidden={!active || undefined}
      hidden={!active}
      inert={!active || undefined}
      style={active ? undefined : { display: 'none' }}
      tabIndex={active ? -1 : undefined}
      onFocusCapture={(event) => {
        if (active && event.target instanceof HTMLElement)
          rememberedFocus.current = event.target;
      }}
      data-expanded={expanded}
      className={`ui-sheet-enter fixed bottom-0 left-1/2 z-40 flex w-full max-w-[640px] min-w-0 -translate-x-1/2 flex-col gap-4 overflow-hidden overscroll-contain rounded-t-3xl border-0 border-t border-solid border-[#e3e8f0] bg-surface p-4 pb-[max(16px,env(safe-area-inset-bottom))] text-text shadow-[0_-8px_16px_rgb(0_0_0/10%)] motion-safe:transition-[height,max-height] motion-safe:duration-200 motion-safe:ease-out ${expanded ? 'h-[calc(100dvh_-_max(49px,env(safe-area-inset-top)))] max-h-[calc(100dvh_-_max(49px,env(safe-area-inset-top)))]' : 'h-auto max-h-[53.52dvh]'}`}
      onKeyDown={(event) => {
        if (!active) return;

        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          closeControl.current?.click();
        }

        if (event.key !== 'Tab') return;
        const controls = Array.from(
          panel.current?.querySelectorAll<HTMLElement>('*') ?? [],
        ).filter((element) =>
          element.matches(
            'a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]',
          ),
        );
        const first = controls?.[0];
        const last = controls?.[controls.length - 1];

        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="shrink-0">
        <button
          type="button"
          aria-label={
            active
              ? expanded
                ? '기사 시트 접기'
                : '기사 시트 펼치기'
              : undefined
          }
          aria-expanded={expanded}
          className="ui-control relative flex h-5 w-full touch-none after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] cursor-grab items-start justify-center border-0 bg-transparent p-0 active:cursor-grabbing"
          onClick={(event) => {
            if (event.detail > 0 && drag.current?.moved) {
              drag.current = null;

              return;
            }

            drag.current = null;
            setExpanded((value) => !value);
          }}
          onPointerDown={(event) => {
            drag.current = { start: event.clientY, moved: false };
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (
              drag.current &&
              Math.abs(event.clientY - drag.current.start) > 12
            )
              drag.current.moved = true;
          }}
          onPointerUp={(event) => {
            if (!drag.current) return;
            const delta = event.clientY - drag.current.start;

            if (Math.abs(delta) > 24) {
              drag.current.moved = true;
              setExpanded(delta < 0);
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <span
            aria-hidden="true"
            className="h-1 w-9 rounded-full bg-slate-400"
          />
        </button>
        <nav
          aria-label={active ? '기사 상세 탐색' : undefined}
          className="relative z-10 flex h-6 items-center justify-end"
        >
          {!onClose && (
            <Link
              href="/incidents"
              scroll={false}
              aria-label="목록으로"
              className="sr-only focus:not-sr-only focus:mr-auto focus:text-sm"
            >
              목록으로
            </Link>
          )}
          {onClose ? (
            <button
              type="button"
              ref={(element) => {
                closeControl.current = element;
              }}
              aria-label={active ? closeLabel : undefined}
              onClick={close}
              className="ui-control grid size-6 place-items-center rounded border-0 bg-transparent p-0"
            >
              <span
                aria-hidden="true"
                className="block size-6 bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/article-detail/close.svg')" }}
              />
            </button>
          ) : (
            <Link
              ref={(element) => {
                closeControl.current = element;
              }}
              href={route?.active ? route.sourcePath : '/'}
              scroll={false}
              aria-label={active ? closeLabel : undefined}
              onClick={close}
              className="ui-control grid size-6 place-items-center rounded"
            >
              <span
                aria-hidden="true"
                className="block size-6 bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/article-detail/close.svg')" }}
              />
            </Link>
          )}
        </nav>
      </div>
      <div
        ref={scroller}
        tabIndex={active ? 0 : undefined}
        onScroll={(event) => {
          if (active) scrollPosition.current = event.currentTarget.scrollTop;
        }}
        className="flex min-h-0 flex-auto flex-col gap-4 overflow-y-auto overscroll-contain [overflow-wrap:anywhere] [&>*]:shrink-0"
      >
        {children}
        {footer && <div className="shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
