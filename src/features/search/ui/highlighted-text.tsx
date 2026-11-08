export function highlightedText(text: string, keyword: string) {
  const query = keyword.trim();

  if (!query) return text;

  const literalQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = new RegExp(`(${literalQuery})`, 'gi');

  return text.split(matches).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="bg-transparent text-brand">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
