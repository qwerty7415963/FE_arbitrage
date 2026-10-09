import type {
  ActivityFill,
  ActivityTrade,
  PositionSnapshot,
  WalletConnectionStatus,
  WalletFundingEvent,
  WalletOrderEvent,
} from '@/types/trader';
import { WALLET_CONNECTION_STATUSES as CONNECTION_STATUSES } from '@/types/trader';

export type ActivityWsStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface ActivityWsHandle {
  close: () => void;
}

export interface WalletWsHandlers {
  onFunding?: (funding: WalletFundingEvent) => void;
  onOrder?: (order: WalletOrderEvent) => void;
  onPosition?: (snapshot: PositionSnapshot) => void;
  onActivity?: (trade: ActivityTrade) => void;
  onConnection?: (status: WalletConnectionStatus) => void;
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

function isValidFunding(data: unknown): data is WalletFundingEvent {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return typeof d.coin === 'string' && typeof d.usdc === 'number' && typeof d.time === 'string';
}

function isValidOrder(data: unknown): data is WalletOrderEvent {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return typeof d.coin === 'string' && typeof d.oid === 'number' && typeof d.status === 'string';
}

function isValidConnection(data: unknown): data is { status: WalletConnectionStatus } {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.status === 'string' && (CONNECTION_STATUSES as readonly string[]).includes(d.status)
  );
}

function isValidPositionSnapshot(data: unknown): data is PositionSnapshot {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.positions) &&
    (d.data_status === 'ready' || d.data_status === 'error') &&
    ('as_of' in d ? d.as_of === null || typeof d.as_of === 'string' : true)
  );
}

function isValidActivityTrade(data: unknown): data is ActivityTrade {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.market === 'string' &&
    (d.side === 'LONG' || d.side === 'SHORT') &&
    typeof d.opened_at === 'string' &&
    typeof d.closed_at === 'string' &&
    typeof d.duration_sec === 'number' &&
    typeof d.volume === 'number' &&
    typeof d.pnl === 'number' &&
    typeof d.fees === 'number' &&
    typeof d.net_pnl === 'number' &&
    typeof d.fills === 'number' &&
    ('funding' in d ? typeof d.funding === 'number' : true)
  );
}

function normalizeActivityTrade(data: ActivityTrade): ActivityTrade {
  return {
    ...data,
    funding: typeof data.funding === 'number' ? data.funding : 0,
  };
}

export { CONNECTION_STATUSES as WALLET_CONNECTION_STATUSES };

/**
 * Wallet live WS (contract v1.2 §2): same `GET /traders/ws?wallet=` transport,
 * `wallet.*` envelope for incremental updates (no full refetch). Legacy
 * `{type: activity|subscribed|ping|pong}` stays working during migration.
 * Backoff + hidden-suspend + ping/pong behavior is unchanged.
 */
export function connectTradeActivityWS(
  walletAddress: string,
  onFill: (fill: ActivityFill) => void,
  onStatus?: (status: ActivityWsStatus) => void,
  handlers: WalletWsHandlers = {},
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

  function cleanupSocket(socket: WebSocket | null): void {
    if (socket !== null) {
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
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

  function routeMessage(msg: { type?: unknown; data?: unknown }): void {
    if (msg.type === 'activity' && isValidFill(msg.data)) {
      onFill(msg.data);
      return;
    }
    if (msg.type === 'wallet.fill.created' && isValidFill(msg.data)) {
      onFill(msg.data);
      return;
    }
    if (msg.type === 'wallet.funding.created' && isValidFunding(msg.data)) {
      handlers.onFunding?.(msg.data);
      return;
    }
    if (msg.type === 'wallet.order.updated' && isValidOrder(msg.data)) {
      handlers.onOrder?.(msg.data);
      return;
    }
    if (msg.type === 'wallet.position.updated' && isValidPositionSnapshot(msg.data)) {
      handlers.onPosition?.(msg.data);
      return;
    }
    if (msg.type === 'wallet.activity.created' && isValidActivityTrade(msg.data)) {
      handlers.onActivity?.(normalizeActivityTrade(msg.data));
      return;
    }
    if (msg.type === 'wallet.connection.updated' && isValidConnection(msg.data)) {
      handlers.onConnection?.(msg.data.status);
      return;
    }
    // Legacy `{type: subscribed|ping|pong}` and `wallet.state.updated`
    // stay working by being ignored (no crash, no refetch).
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
      routeMessage(msg);
    };

    const handleClose = () => {
      cleanupSocket(ws);
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
        cleanupSocket(current);
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
        cleanupSocket(current);
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
