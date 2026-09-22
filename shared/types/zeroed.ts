export function zeroed<K extends string>(
  keys: readonly K[],
): Record<K, number> {
  const result: Partial<Record<K, number>> = {};
  for (const key of keys) result[key] = 0;
  return result as Record<K, number>;
}
