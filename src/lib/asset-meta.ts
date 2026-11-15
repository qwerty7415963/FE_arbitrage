export function stripDexPrefix(symbol: string): string {
  if (typeof symbol !== 'string') return '';
  const idx = symbol.indexOf(':');
  if (idx === -1) return symbol;
  return symbol.slice(idx + 1);
}
