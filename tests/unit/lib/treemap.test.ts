import { describe, expect, it } from 'vitest';
import { squarify, type TreemapRect } from '@/lib/treemap';

function area(rect: TreemapRect): number {
  return rect.w * rect.h;
}

function overlaps(a: TreemapRect, b: TreemapRect): boolean {
  const epsilon = 1e-9;
  return (
    a.x + a.w > b.x + epsilon &&
    b.x + b.w > a.x + epsilon &&
    a.y + a.h > b.y + epsilon &&
    b.y + b.h > a.y + epsilon
  );
}

describe('squarify', () => {
  it('keeps every rect inside the unit square', () => {
    const rects = squarify([
      { key: 'BTC', value: 60 },
      { key: 'ETH', value: 25 },
      { key: 'SOL', value: 10 },
      { key: 'DOGE', value: 5 },
    ]);

    expect(rects).toHaveLength(4);
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.w).toBeLessThanOrEqual(1 + 1e-9);
      expect(rect.y + rect.h).toBeLessThanOrEqual(1 + 1e-9);
      expect(rect.w).toBeGreaterThan(0);
      expect(rect.h).toBeGreaterThan(0);
    }
  });

  it('has no overlapping rects', () => {
    const rects = squarify([
      { key: 'A', value: 40 },
      { key: 'B', value: 20 },
      { key: 'C', value: 15 },
      { key: 'D', value: 12 },
      { key: 'E', value: 8 },
      { key: 'F', value: 5 },
    ]);

    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        expect(overlaps(rects[i], rects[j])).toBe(false);
      }
    }
  });

  it('normalises total area to sum(value) / total', () => {
    const items = [
      { key: 'A', value: 30 },
      { key: 'B', value: 20 },
      { key: 'C', value: 10 },
    ];
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const rects = squarify(items);
    const totalArea = rects.reduce((sum, rect) => sum + area(rect), 0);

    expect(totalArea).toBeCloseTo(total / total, 6);
  });

  it('scales to non-unit dimensions', () => {
    const rects = squarify(
      [
        { key: 'A', value: 3 },
        { key: 'B', value: 1 },
      ],
      400,
      200,
    );

    const totalArea = rects.reduce((sum, rect) => sum + area(rect), 0);
    expect(totalArea).toBeCloseTo(400 * 200, 6);
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.w).toBeLessThanOrEqual(400 + 1e-6);
      expect(rect.y + rect.h).toBeLessThanOrEqual(200 + 1e-6);
    }
  });

  it('fills the whole square with a single item', () => {
    const rects = squarify([{ key: 'BTC', value: 42 }]);

    expect(rects).toEqual([{ key: 'BTC', x: 0, y: 0, w: 1, h: 1 }]);
  });

  it('skips zero and negative values', () => {
    const rects = squarify([
      { key: 'A', value: 10 },
      { key: 'B', value: 0 },
      { key: 'C', value: -5 },
    ]);

    expect(rects.map((rect) => rect.key)).toEqual(['A']);
  });

  it('returns an empty layout for empty input', () => {
    expect(squarify([])).toEqual([]);
  });

  it('returns an empty layout when every value is zero', () => {
    expect(
      squarify([
        { key: 'A', value: 0 },
        { key: 'B', value: 0 },
      ]),
    ).toEqual([]);
  });

  it('returns an empty layout for invalid dimensions', () => {
    expect(squarify([{ key: 'A', value: 1 }], 0, 1)).toEqual([]);
    expect(squarify([{ key: 'A', value: 1 }], 1, 0)).toEqual([]);
  });

  it('keeps max tile aspect ratio at most 3 for 12-item sample data', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({
      key: `M${index}`,
      value: 12 - index,
    }));
    const rects = squarify(items);
    const maxAspect = Math.max(
      ...rects.map((rect) => (rect.w >= rect.h ? rect.w / rect.h : rect.h / rect.w)),
    );
    expect(maxAspect).toBeLessThanOrEqual(3);
  });
});
