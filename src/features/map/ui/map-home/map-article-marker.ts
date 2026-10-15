import { mapDisplayDiameter } from '../../model/map-display-groups';

// Naver's HTML icon API owns this DOM subtree outside the React tree.
export function createArticleMarker(
  count: number,
  label: string,
  cluster = false,
) {
  const content = document.createElement('button');
  const side = mapDisplayDiameter(count, cluster);

  content.type = 'button';
  content.setAttribute('aria-label', label);

  content.textContent = String(count);
  const dimensions =
    side === 38.4
      ? 'size-[38.4px] border-[0.8px] text-[14.4px] shadow-[0_3.2px_9.6px_rgb(0_0_0/8%)]'
      : side === 48
        ? 'size-12 border text-lg shadow-[0_4px_12px_rgb(0_0_0/8%)]'
        : 'size-18 border-[1.5px] text-[27px] shadow-[0_6px_18px_rgb(0_0_0/8%)]';

  content.className = `flex items-center justify-center rounded-full border-solid border-white/40 bg-brand/60 p-0 leading-none font-extrabold text-white ${dimensions}`;

  const setSelected = (selected: boolean) => {
    content.setAttribute('aria-pressed', String(selected));

    content.classList.toggle('ring-2', selected);
    content.classList.toggle('ring-brand', selected);
    content.classList.toggle('ring-offset-2', selected);
  };

  setSelected(false);

  return { content, side, setSelected };
}
