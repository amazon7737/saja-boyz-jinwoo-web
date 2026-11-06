// Naver의 HTML 마커는 React 트리 밖에서 SDK가 관리한다.
export function createArticleMarker(
  count: number,
  label: string,
  side: number,
) {
  const content = document.createElement('button');

  content.type = 'button';
  content.setAttribute('aria-label', label);
  content.textContent = String(count);
  content.className =
    'flex items-center justify-center rounded-full border-solid border-white/40 bg-brand/60 p-0 leading-none font-extrabold text-white';
  content.style.position = 'relative';
  content.style.width = `${side}px`;
  content.style.height = `${side}px`;
  content.style.borderWidth = `${Math.min(1.5, side / 48)}px`;
  const fontSize = `${Math.min(27, Math.max(14.4, side * 0.375), (side * 0.88) / (String(count).length * 0.65))}px`;
  const shadow = `0 ${side / 12}px ${side / 4}px rgb(0 0 0 / 8%)`;
  const dot = document.createElement('span');
  const center = document.createElement('span');

  dot.setAttribute('aria-hidden', 'true');
  dot.style.cssText =
    'position:absolute;top:50%;left:50%;width:26px;height:26px;transform:translate(-50%,-50%);border:2px solid var(--color-brand);border-radius:50%;background:#fff;place-items:center;pointer-events:none;';
  center.style.cssText =
    'width:10px;height:10px;border-radius:50%;background:var(--color-brand);';
  dot.append(center);
  content.append(dot);

  const setSelected = (selected: boolean) => {
    const single = selected && count === 1;

    content.setAttribute('aria-pressed', String(selected));
    content.style.fontSize = single ? '0px' : fontSize;
    content.style.backgroundColor = single ? 'transparent' : '';
    content.style.borderColor = single ? 'transparent' : '';
    content.style.boxShadow = single
      ? 'none'
      : selected
        ? `0 0 0 2px #fff, 0 0 0 4px var(--color-brand), ${shadow}`
        : shadow;
    dot.style.display = single ? 'grid' : 'none';
  };

  setSelected(false);

  return { content, side, setSelected };
}
