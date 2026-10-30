type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

export function onUnauthorized(fn: UnauthorizedListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitUnauthorized(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      // Listener failures stay isolated; the request path keeps its ApiError.
    }
  }
}
