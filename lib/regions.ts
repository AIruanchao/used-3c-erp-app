export type RegionRow = { id: string; name: string; parentId: string | null };

export function flattenRegionTree(
  regions: RegionRow[],
): { id: string; name: string; depth: number }[] {
  const byParent = new Map<string | null, RegionRow[]>();
  for (const r of regions) {
    const k = r.parentId;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(r);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }
  const out: { id: string; name: string; depth: number }[] = [];
  function walk(parentId: string | null, depth: number) {
    const kids = byParent.get(parentId) ?? [];
    for (const r of kids) {
      out.push({ id: r.id, name: r.name, depth });
      walk(r.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}

export function regionSelfAndDescendantIds(
  rootId: string,
  regions: Pick<RegionRow, 'id' | 'parentId'>[],
): Set<string> {
  const byParent = new Map<string | null, string[]>();
  for (const r of regions) {
    if (!byParent.has(r.parentId)) byParent.set(r.parentId, []);
    byParent.get(r.parentId)!.push(r.id);
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    out.add(id);
    for (const c of byParent.get(id) ?? []) stack.push(c);
  }
  return out;
}
