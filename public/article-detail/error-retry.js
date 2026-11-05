(() => {
  const retry = document.querySelector('[data-detail-retry]');
  const spinner = retry?.querySelector('.spinner');

  if (!retry || !spinner) return;

  let fallbackTimer;
  const reset = () => {
    clearTimeout(fallbackTimer);
    fallbackTimer = undefined;
    retry.setAttribute('aria-busy', 'false');
    retry.removeAttribute('aria-disabled');
    spinner.hidden = true;
  };

  window.addEventListener('pageshow', reset);
  const navigation = window.navigation;
  const observesNavigation = Boolean(navigation?.addEventListener);

  if (observesNavigation) {
    navigation.addEventListener('navigate', (event) => {
      if (
        retry.getAttribute('aria-busy') === 'true' &&
        event.destination.url === retry.href
      ) {
        event.signal.addEventListener('abort', reset, { once: true });
      }
    });
  }

  retry.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      retry.target === '_blank'
    )
      return;

    if (retry.getAttribute('aria-busy') === 'true') {
      event.preventDefault();
      return;
    }

    retry.setAttribute('aria-busy', 'true');
    retry.setAttribute('aria-disabled', 'true');
    spinner.hidden = false;
    if (!observesNavigation) fallbackTimer = setTimeout(reset, 30000);
  });
})();
