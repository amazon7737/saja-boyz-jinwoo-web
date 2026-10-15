// Naver's HTML icon API owns this DOM subtree outside the React tree.
export function createArticleMarker(count: number, label: string) {
  const content = document.createElement('button');
  const image = count === 1 ? document.createElement('img') : null;
  const side = count === 1 ? 24 : count <= 5 ? 38.4 : count < 10 ? 48 : 72;

  content.type = 'button';
  content.setAttribute('aria-label', label);

  if (image) {
    image.alt = '';
    content.className = 'relative block size-6 border-0 bg-transparent p-0';
    content.append(image);
  } else {
    content.textContent = String(count);
    const dimensions =
      count <= 5
        ? 'size-[38.4px] border-[0.8px] text-[14.4px] shadow-[0_3.2px_9.6px_rgb(0_0_0/8%)]'
        : count < 10
          ? 'size-12 border text-lg shadow-[0_4px_12px_rgb(0_0_0/8%)]'
          : 'size-18 border-[1.5px] text-[27px] shadow-[0_6px_18px_rgb(0_0_0/8%)]';

    content.className = `flex items-center justify-center rounded-full border-solid border-white/40 bg-brand/60 p-0 leading-none font-extrabold text-white ${dimensions}`;
  }

  const setSelected = (selected: boolean) => {
    content.setAttribute('aria-pressed', String(selected));

    if (image) {
      image.src = selected
        ? '/map/article-selected.svg'
        : '/map/article-marker.svg';
      image.width = selected ? 28 : 24;
      image.height = selected ? 28 : 24;
      image.className = selected
        ? 'absolute -top-0.5 -left-0.5 block max-w-none'
        : 'absolute top-0 left-0 block max-w-none';
    } else {
      content.classList.toggle('ring-2', selected);
      content.classList.toggle('ring-brand', selected);
      content.classList.toggle('ring-offset-2', selected);
    }
  };

  setSelected(false);

  return { content, side, setSelected };
}
