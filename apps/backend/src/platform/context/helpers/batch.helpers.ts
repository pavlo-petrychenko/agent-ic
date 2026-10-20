export const groupByKey = <TKey, TItem>(
  keys: readonly TKey[],
  items: readonly TItem[],
  keyOf: (item: TItem) => TKey,
): Map<TKey, TItem[]> => {
  const groups = new Map<TKey, TItem[]>(keys.map((key) => [key, []]));
  for (const item of items) {
    groups.get(keyOf(item))?.push(item);
  }
  return groups;
};

export const indexByKey = <TKey, TItem>(
  keys: readonly TKey[],
  items: readonly TItem[],
  keyOf: (item: TItem) => TKey,
): Map<TKey, TItem | null> => {
  const index = new Map<TKey, TItem | null>(keys.map((key) => [key, null]));
  for (const item of items) {
    const key = keyOf(item);
    if (index.has(key)) {
      index.set(key, item);
    }
  }
  return index;
};
