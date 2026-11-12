export interface TreemapItem {
  key: string;
  value: number;
}

export interface TreemapRect {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ScaledItem {
  key: string;
  area: number;
}

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function worstAspect(row: ScaledItem[], side: number): number {
  if (row.length === 0 || side <= 0) return Number.POSITIVE_INFINITY;
  let sum = 0;
  let max = 0;
  let min = Number.POSITIVE_INFINITY;
  for (const item of row) {
    sum += item.area;
    if (item.area > max) max = item.area;
    if (item.area < min) min = item.area;
  }
  if (sum <= 0 || min <= 0) return Number.POSITIVE_INFINITY;
  const sideSquared = side * side;
  const sumSquared = sum * sum;
  return Math.max((sideSquared * max) / sumSquared, sumSquared / (sideSquared * min));
}

/**
 * Squarified treemap layout (Bruls, Huizing & van Wijk).
 * Values are normalised into `width * height`; input is sorted descending.
 * Non-finite or non-positive values are skipped.
 */
export function squarify(items: TreemapItem[], width = 1, height = 1): TreemapRect[] {
  const valid = items.filter((item) => Number.isFinite(item.value) && item.value > 0);
  if (valid.length === 0 || width <= 0 || height <= 0) return [];

  const total = valid.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return [];

  const areaScale = (width * height) / total;
  const scaled: ScaledItem[] = [...valid]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ key: item.key, area: item.value * areaScale }));

  const rects: TreemapRect[] = [];
  let free: FreeRect = { x: 0, y: 0, w: width, h: height };
  let index = 0;

  while (index < scaled.length) {
    const side = Math.min(free.w, free.h);
    const row: ScaledItem[] = [scaled[index]];
    index += 1;

    while (index < scaled.length) {
      const candidate = worstAspect([...row, scaled[index]], side);
      if (candidate <= worstAspect(row, side)) {
        row.push(scaled[index]);
        index += 1;
      } else {
        break;
      }
    }

    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    const lastRow = index >= scaled.length;

    if (free.w < free.h) {
      const rowHeight = lastRow ? free.h : Math.min(free.h, rowArea / free.w);
      let x = free.x;
      row.forEach((item, itemIndex) => {
        const isLast = itemIndex === row.length - 1;
        const w = isLast ? free.x + free.w - x : item.area / rowHeight;
        rects.push({ key: item.key, x, y: free.y, w, h: rowHeight });
        x += w;
      });
      free = { x: free.x, y: free.y + rowHeight, w: free.w, h: free.h - rowHeight };
    } else {
      const rowWidth = lastRow ? free.w : Math.min(free.w, rowArea / free.h);
      let y = free.y;
      row.forEach((item, itemIndex) => {
        const isLast = itemIndex === row.length - 1;
        const h = isLast ? free.y + free.h - y : item.area / rowWidth;
        rects.push({ key: item.key, x: free.x, y, w: rowWidth, h });
        y += h;
      });
      free = { x: free.x + rowWidth, y: free.y, w: free.w - rowWidth, h: free.h };
    }
  }

  return rects;
}
