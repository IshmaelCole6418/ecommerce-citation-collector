export type Citation = { id: string; title: string; url: string; note: string };

export function dedupeCitations(items: Citation[]): Citation[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
