// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import {
  previousRelatedArticle,
  recordRelatedArticleNavigation,
} from './related-article-history';

test('cancelledRelatedNavigationDoesNotAffectLaterDirectEntry', () => {
  const first = '/incidents/' + 'a'.repeat(64);
  const second = '/incidents/' + 'b'.repeat(64);
  sessionStorage.clear();
  history.replaceState({}, '', first);
  recordRelatedArticleNavigation(second);
  window.dispatchEvent(new PopStateEvent('popstate'));
  history.replaceState({}, '', second);
  expect(previousRelatedArticle()).toBeNull();
});

test('redirectedNavigationDoesNotReuseAnUnrelatedPreviousArticle', async () => {
  const first = '/incidents/' + 'a'.repeat(64);
  const second = '/incidents/' + 'b'.repeat(64);
  sessionStorage.clear();
  history.replaceState({}, '', first);
  recordRelatedArticleNavigation(second);
  history.replaceState({}, '', second);
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    value: window.location.origin + '/unrelated',
  });
  try {
    vi.resetModules();
    const nextDocument = await import('./related-article-history');
    expect(nextDocument.previousRelatedArticle()).toBeNull();
  } finally {
    delete (document as { referrer?: string }).referrer;
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
});
