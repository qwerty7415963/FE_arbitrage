import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T | null>,
): ElementSize;
export function useElementSize<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T | null>;
  width: number;
  height: number;
};
export function useElementSize<T extends HTMLElement = HTMLDivElement>(
  ref?: RefObject<T | null>,
): ElementSize | { ref: RefObject<T | null>; width: number; height: number } {
  const internalRef = useRef<T | null>(null);
  const targetRef = ref ?? internalRef;
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [targetRef]);

  if (ref) {
    return size;
  }
  return { ref: targetRef, width: size.width, height: size.height };
}
