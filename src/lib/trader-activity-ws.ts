import type { ActivityFill } from '@/types/trader';

export type ActivityWsStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface ActivityWsHandle {
  close: () => void;
}

export const ACTIVITY_WS_PING_INTERVAL_MS = 25_000;
export const ACTIVITY_WS_MAX_BACKOFF_MS = 30_000;

export function getReconnectDelayMs(attempt: number): number {
  const safe = Math.max(0, attempt);
  return Math.min(1_000 * 2 ** safe, ACTIVITY_WS_MAX_BACKOFF_MS);
}

export function buildActivityWsUrl(
  walletAddress: string,
  loc?: { protocol: string; host: string },
): string {
  const wallet = walletAddress.toLowerCase();
  const protocol =
    loc?.protocol ?? (typeof window !== 'undefined' ? window.location.protocol : 'http:');
  const host =
    loc?.host ?? (typeof window !== 'undefined' ? window.location.host : 'localhost:8080');
  const scheme = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${host}/api/v1/traders/ws?wallet=${encodeURIComponent(wallet)}`;
}

function isDocumentHidden(): boolean {
  if (typeof document === 'undefined') return false;
  return document.hidden === true;
}

function isValidFill(data: unknown): data is ActivityFill {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.coin === 'string' &&
    (d.side === 'BUY' || d.side === 'SELL') &&
    typeof d.size === 'number' &&
    typeof d.price === 'number' &&
    typeof d.time === 'string' &&
    typeof d.tid === 'number'
  );
}

export function connectTradeActivityWS(
  walletAddress: string,
  onFill: (fill: ActivityFill) => void,
  onStatus?: (status: ActivityWsStatus) => void,
): ActivityWsHandle {
  const wallet = walletAddress.toLowerCase();
  let closed = false;
  let attempt = 0;
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  function emit(status: ActivityWsStatus): void {
    onStatus?.(status);
  }

  function clearTimers(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function cleanupSocket(): void {
    if (ws !== null) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
      } catch {
        // ignore listener cleanup errors
      }
    }
  }

  function startHeartbeat(socket: WebSocket): void {
    if (heartbeatTimer !== null) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // send failures surface via onclose/onerror
        }
      }
    }, ACTIVITY_WS_PING_INTERVAL_MS);
  }

  function scheduleReconnect(): void {
    if (closed) return;
    if (isDocumentHidden()) {
      emit('disconnected');
      return;
    }
    const delay = getReconnectDelayMs(attempt);
    attempt += 1;
    emit('reconnecting');
    if (reconnectTimer !== null) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function connect(): void {
    if (closed) return;
    if (isDocumentHidden()) {
      emit('disconnected');
      return;
    }
    const url = buildActivityWsUrl(wallet);
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }
    ws = socket;

    socket.onopen = () => {
      attempt = 0;
      emit('connected');
      startHeartbeat(socket);
    };

    socket.onmessage = (event: MessageEvent) => {
      let msg: { type?: unknown; data?: unknown };
      try {
        msg = JSON.parse(String(event.data)) as { type?: unknown; data?: unknown };
      } catch {
        return;
      }
      if (msg.type === 'activity' && isValidFill(msg.data)) {
        onFill(msg.data);
      }
    };

    const handleClose = () => {
      cleanupSocket();
      if (heartbeatTimer !== null) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (!closed) scheduleReconnect();
    };
    socket.onclose = handleClose;
    socket.onerror = handleClose;
  }

  function handleVisibility(): void {
    if (closed) return;
    if (isDocumentHidden()) {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (heartbeatTimer !== null) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (ws !== null) {
        const current = ws;
        ws = null;
        cleanupSocket();
        try {
          current.close();
        } catch {
          // ignore close errors while suspending
        }
      }
      emit('disconnected');
    } else {
      attempt = 0;
      connect();
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility);
  }

  connect();

  return {
    close: () => {
      closed = true;
      clearTimers();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (ws !== null) {
        const current = ws;
        ws = null;
        cleanupSocket();
        try {
          current.close();
        } catch {
          // ignore close errors
        }
      }
      emit('disconnected');
    },
  };
}
