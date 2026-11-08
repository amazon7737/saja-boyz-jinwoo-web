const pendingKey = 'hh:related-article-navigation';
const historyKey = '__hhRelatedArticleFrom';
const articlePath = /^\/incidents\/[a-f0-9]{64}$/;

type Pending = { from: string; to: string; document: string };
let documentId: string | undefined;

function currentDocumentId() {
  return (documentId ??= `${Date.now()}-${Math.random()}`);
}

let releasePending: (() => void) | undefined;

function pendingNavigation(): Pending | null {
  try {
    const raw = sessionStorage.getItem(pendingKey);
    const value: unknown = raw ? JSON.parse(raw) : null;

    if (
      value &&
      typeof value === 'object' &&
      'from' in value &&
      'to' in value &&
      'document' in value &&
      typeof value.document === 'string' &&
      typeof value.from === 'string' &&
      typeof value.to === 'string' &&
      articlePath.test(value.from) &&
      articlePath.test(value.to) &&
      value.from !== value.to
    )
      return { from: value.from, to: value.to, document: value.document };
  } catch {
    // Storage is optional; navigation still works without it.
  }

  return null;
}

function isArrival(pending: Pending): boolean {
  if (pending.to !== window.location.pathname) return false;
  if (pending.document === currentDocumentId()) return true;

  try {
    const source = new URL(document.referrer);

    return (
      source.origin === window.location.origin &&
      source.pathname === pending.from
    );
  } catch {
    return false;
  }
}

export function recordRelatedArticleNavigation(to: string) {
  const from = window.location.pathname;

  if (!articlePath.test(from) || !articlePath.test(to) || from === to) return;

  releasePending?.();

  try {
    const value = JSON.stringify({ from, to, document: currentDocumentId() });

    sessionStorage.setItem(pendingKey, value);

    const cancel = (promote = false) => {
      try {
        if (sessionStorage.getItem(pendingKey) === value) {
          if (promote && window.location.pathname === to)
            window.history.replaceState(
              { ...window.history.state, [historyKey]: { from, to } },
              '',
            );
          sessionStorage.removeItem(pendingKey);
        }
      } catch {
        // Storage is optional.
      }

      releasePending?.();
    };

    const onPop = () => cancel();
    const onClick = () => cancel(true);

    window.addEventListener('popstate', onPop);
    document.addEventListener('click', onClick, true);
    const timeout = window.setTimeout(onPop, 60_000);

    releasePending = () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick, true);
      window.clearTimeout(timeout);
      releasePending = undefined;
    };
  } catch {
    // Storage is optional; navigation still works without it.
  }
}

export function previousRelatedArticle(): string | null {
  const pending = pendingNavigation();

  if (pending && isArrival(pending)) return pending.from;

  const state = window.history.state as Record<string, unknown> | null;
  const saved = state?.[historyKey];

  if (
    saved &&
    typeof saved === 'object' &&
    'from' in saved &&
    'to' in saved &&
    typeof saved.from === 'string' &&
    articlePath.test(saved.from) &&
    saved.to === window.location.pathname &&
    saved.from !== saved.to
  )
    return saved.from;

  return null;
}

export function subscribeRelatedArticleHistory(notify: () => void) {
  const update = () => {
    const pending = pendingNavigation();

    if (
      pending &&
      (pending.to === window.location.pathname ||
        pending.from !== window.location.pathname)
    ) {
      try {
        if (isArrival(pending))
          window.history.replaceState(
            { ...window.history.state, [historyKey]: pending },
            '',
          );
      } catch {
        // If history state is unavailable, preserve normal navigation.
      }

      try {
        sessionStorage.removeItem(pendingKey);
      } catch {
        // Storage is optional.
      }

      releasePending?.();
    }

    notify();
  };
  const frame = requestAnimationFrame(update);

  window.addEventListener('popstate', update);
  window.addEventListener('pageshow', update);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('popstate', update);
    window.removeEventListener('pageshow', update);
  };
}

export const noPreviousRelatedArticle = () => null;
