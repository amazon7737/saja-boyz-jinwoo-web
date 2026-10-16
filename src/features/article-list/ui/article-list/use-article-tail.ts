'use client';

import { useEffect, useRef } from 'react';

export function useArticleTail(enabled: boolean, loadMore: () => void) {
  const tail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = tail.current;

    if (!enabled || !target) return;

    let active = true;
    const requestMore = () => {
      if (active) loadMore();
    };

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries.some(
              (entry) => entry.target === target && entry.isIntersecting,
            )
          ) {
            requestMore();
          }
        },
        { rootMargin: '200px' },
      );

      observer.observe(target);

      return () => {
        active = false;
        observer.disconnect();
      };
    }

    const checkPosition = () => {
      const bounds = target.getBoundingClientRect();

      if (bounds.top <= window.innerHeight + 200 && bounds.bottom >= -200) {
        requestMore();
      }
    };

    window.addEventListener('scroll', checkPosition, { passive: true });
    window.addEventListener('resize', checkPosition);
    checkPosition();

    return () => {
      active = false;
      window.removeEventListener('scroll', checkPosition);
      window.removeEventListener('resize', checkPosition);
    };
  }, [enabled, loadMore]);

  return tail;
}
