'use client';

import type {
  ActivityFill,
  ActivityTrade,
  PositionSnapshot,
  WalletConnectionStatus,
  WalletFundingEvent,
  WalletOrderEvent,
} from '@/types/trader';
import {
  buildActivityWsUrl,
  getReconnectDelayMs,
  ACTIVITY_WS_PING_INTERVAL_MS,
} from '@/lib/trader-activity-ws';

export type WalletLiveStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface WalletLiveHandlers {
  onBootstrap?: (channel: string, data: unknown) => void;
  onFill?: (fill: ActivityFill) => void;
  onFunding?: (funding: WalletFundingEvent) => void;
  onOrder?: (order: WalletOrderEvent) => void;
  onOrderCreated?: (order: WalletOrderEvent) => void;
  onPosition?: (snapshot: PositionSnapshot) => void;
  onActivity?: (trade: ActivityTrade) => void;
  onConnection?: (status: WalletConnectionStatus) => void;
  onDropped?: (channel: string, seq: number) => void;
  onStatus?: (status: WalletLiveStatus) => void;
}

export interface WalletLiveHandle {
  close: () => void;
  getStatus: () => WalletLiveStatus;
  isDirty: (channel: string) => boolean;
  markDirty: (channel: string) => void;
  clearDirty: (channel: string) => void;
}

const ALL_CHANNELS: string[] = [];

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

function isValidPositionSnapshot(data: unknown): data is PositionSnapshot {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return Array.isArray(d.positions) && (d.data_status === 'ready' || d.data_status === 'error');
}

function isValidActivityTrade(data: unknown): data is ActivityTrade {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.market === 'string' &&
    (d.side === 'LONG' || d.side === 'SHORT') &&
    typeof d.opened_at === 'string' &&
    typeof d.closed_at === 'string'
  );
}

function normalizeActivityTrade(data: ActivityTrade): ActivityTrade {
  return { ...data, funding: typeof data.funding === 'number' ? data.funding : 0 };
}

function messageChannels(type: string): string[] {
  if (type === 'wallet.position.updated') return ['positions'];
  if (type === 'wallet.order.updated' || type === 'wallet.order.created') return ['orders'];
  if (
    type === 'wallet.fill.created' ||
    type === 'wallet.funding.created' ||
    type === 'wallet.activity.created'
  )
    return ['activity', 'trades'];
  if (type === 'activity') return ['activity'];
  if (type.startsWith('wallet.bootstrap.')) {
    const c = type.slice('wallet.bootstrap.'.length);
    return c ? [c] : [];
  }
  return [];
}

interface Subscriber {
  id: number;
  channels: Set<string>;
  handlers: WalletLiveHandlers;
}

class Manager {
  wallet: string;
  subscribers = new Map<number, Subscriber>();
  nextId = 1;
  dirty = new Set<string>();
  status: WalletLiveStatus = 'disconnected';
  ws: WebSocket | null = null;
  closed = false;
  attempt = 0;
  reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  visibilityHandler: (() => void) | null = null;

  constructor(wallet: string) {
    this.wallet = wallet;
  }

  matches(sub: Subscriber, channels: string[]): boolean {
    if (sub.channels.size === 0) return true;
    if (channels.length === 0) return true;
    return channels.some((c) => sub.channels.has(c));
  }

  notifyStatus(status: WalletLiveStatus): void {
    this.status = status;
    for (const sub of this.subscribers.values()) {
      sub.handlers.onStatus?.(status);
    }
  }

  clearTimers(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  cleanupSocket(socket: WebSocket | null): void {
    if (socket !== null) {
      try {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
      } catch {
        // ignore
      }
    }
  }

  startHeartbeat(socket: WebSocket): void {
    if (this.heartbeatTimer !== null) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // ignore
        }
      }
    }, ACTIVITY_WS_PING_INTERVAL_MS);
  }

  scheduleReconnect(): void {
    if (this.closed) return;
    if (isDocumentHidden()) {
      this.notifyStatus('disconnected');
      return;
    }
    const delay = getReconnectDelayMs(this.attempt);
    this.attempt += 1;
    this.notifyStatus('reconnecting');
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  routeMessage(msg: { type?: unknown; data?: unknown }): void {
    const type = typeof msg.type === 'string' ? msg.type : '';
    const data = msg.data;

    if (type.startsWith('wallet.bootstrap.')) {
      const channel = type.slice('wallet.bootstrap.'.length);
      this.dirty.delete(channel);
      for (const sub of this.subscribers.values()) {
        if (this.matches(sub, [channel])) {
          sub.handlers.onBootstrap?.(channel, data);
        }
      }
      return;
    }

    if (type === 'wallet.bootstrap') {
      const d = (data && typeof data === 'object' ? data : null) as Record<string, unknown> | null;
      const channel = typeof d?.channel === 'string' ? d.channel : '';
      if (channel) this.dirty.delete(channel);
      for (const sub of this.subscribers.values()) {
        if (channel && this.matches(sub, [channel])) {
          sub.handlers.onBootstrap?.(channel, data);
        } else if (!channel) {
          sub.handlers.onBootstrap?.(channel, data);
        }
      }
      return;
    }

    if (type === 'wallet.dropped') {
      const d = (data && typeof data === 'object' ? data : null) as Record<string, unknown> | null;
      const channel = typeof d?.channel === 'string' ? d.channel : '';
      const seq = typeof d?.seq === 'number' ? d.seq : 0;
      if (channel) this.dirty.add(channel);
      for (const sub of this.subscribers.values()) {
        if (channel && this.matches(sub, [channel])) {
          sub.handlers.onDropped?.(channel, seq);
        } else if (!channel) {
          sub.handlers.onDropped?.(channel, seq);
        }
      }
      return;
    }

    const channels = messageChannels(type);

    if (type === 'activity') {
      for (const sub of this.subscribers.values()) {
        if (isValidFill(data) && this.matches(sub, ['activity'])) {
          sub.handlers.onFill?.(data);
        }
      }
      return;
    }

    if (type === 'wallet.fill.created' && isValidFill(data)) {
      for (const sub of this.subscribers.values()) {
        if (this.matches(sub, channels)) sub.handlers.onFill?.(data);
      }
      return;
    }
    if (type === 'wallet.funding.created' && isValidFunding(data)) {
      for (const sub of this.subscribers.values()) {
        if (this.matches(sub, channels)) sub.handlers.onFunding?.(data);
      }
      return;
    }
    if (type === 'wallet.order.updated' && isValidOrder(data)) {
      for (const sub of this.subscribers.values()) {
        if (this.matches(sub, channels)) sub.handlers.onOrder?.(data);
      }
      return;
    }
    if (type === 'wallet.order.created' && isValidOrder(data)) {
      for (const sub of this.subscribers.values()) {
        if (this.matches(sub, channels)) sub.handlers.onOrderCreated?.(data);
      }
      return;
    }
    if (type === 'wallet.position.updated' && isValidPositionSnapshot(data)) {
      for (const sub of this.subscribers.values()) {
        if (this.matches(sub, channels)) sub.handlers.onPosition?.(data);
      }
      return;
    }
    if (type === 'wallet.activity.created' && isValidActivityTrade(data)) {
      const trade = normalizeActivityTrade(data);
      for (const sub of this.subscribers.values()) {
        if (this.matches(sub, channels)) sub.handlers.onActivity?.(trade);
      }
      return;
    }
    if (type === 'wallet.connection.updated') {
      const d = (data && typeof data === 'object' ? data : null) as Record<string, unknown> | null;
      const status = d?.status;
      if (typeof status === 'string') {
        for (const sub of this.subscribers.values()) {
          sub.handlers.onConnection?.(status as WalletConnectionStatus);
        }
      }
      return;
    }
  }

  connect(): void {
    if (this.closed) return;
    if (isDocumentHidden()) {
      this.notifyStatus('disconnected');
      return;
    }
    const url = buildActivityWsUrl(this.wallet);
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.notifyStatus('connected');
      this.startHeartbeat(socket);
    };

    socket.onmessage = (event: MessageEvent) => {
      let msg: { type?: unknown; data?: unknown };
      try {
        msg = JSON.parse(String(event.data)) as { type?: unknown; data?: unknown };
      } catch {
        return;
      }
      this.routeMessage(msg);
    };

    const handleClose = () => {
      this.cleanupSocket(this.ws);
      if (this.heartbeatTimer !== null) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      if (!this.closed) this.scheduleReconnect();
    };
    socket.onclose = handleClose;
    socket.onerror = handleClose;
  }

  handleVisibility(): void {
    if (this.closed) return;
    if (isDocumentHidden()) {
      if (this.reconnectTimer !== null) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.heartbeatTimer !== null) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      if (this.ws !== null) {
        const current = this.ws;
        this.ws = null;
        this.cleanupSocket(current);
        try {
          current.close();
        } catch {
          // ignore
        }
      }
      this.notifyStatus('disconnected');
    } else {
      this.attempt = 0;
      this.connect();
    }
  }

  ensureConnected(): void {
    if (this.visibilityHandler === null && typeof document !== 'undefined') {
      this.visibilityHandler = () => this.handleVisibility();
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.ws === null && !this.closed) {
      this.connect();
    }
  }

  maybeClose(): void {
    if (this.subscribers.size > 0) return;
    this.closed = true;
    this.clearTimers();
    if (this.visibilityHandler !== null && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.ws !== null) {
      const current = this.ws;
      this.ws = null;
      this.cleanupSocket(current);
      try {
        current.close();
      } catch {
        // ignore
      }
    }
    this.notifyStatus('disconnected');
    managers.delete(this.wallet);
  }
}

const managers = new Map<string, Manager>();

function getManager(walletAddress: string): Manager {
  const wallet = walletAddress.toLowerCase();
  let m = managers.get(wallet);
  if (!m) {
    m = new Manager(wallet);
    managers.set(wallet, m);
  }
  return m;
}

function normalizeChannels(channels: unknown): string[] {
  if (Array.isArray(channels)) return channels.map((c) => String(c));
  return [];
}

function mergeHandlers(...hs: Array<WalletLiveHandlers | undefined>): WalletLiveHandlers {
  const out: WalletLiveHandlers = {};
  for (const h of hs) {
    if (!h) continue;
    for (const key of Object.keys(h) as Array<keyof WalletLiveHandlers>) {
      const val = h[key];
      if (typeof val === 'function') {
        const prev = out[key];
        (out as Record<string, unknown>)[key] = (...args: unknown[]) => {
          if (prev) (prev as (...a: unknown[]) => void)(...args);
          (val as (...a: unknown[]) => void)(...args);
        };
      }
    }
  }
  return out;
}

export function connectWalletLive(
  walletAddress: string,
  handlers?: WalletLiveHandlers,
): WalletLiveHandle {
  const m = getManager(walletAddress);
  const id = m.nextId++;
  const sub: Subscriber = {
    id,
    channels: new Set<string>(ALL_CHANNELS),
    handlers: handlers ?? {},
  };
  m.subscribers.set(id, sub);
  m.ensureConnected();
  return {
    close: () => {
      m.subscribers.delete(id);
      m.maybeClose();
    },
    getStatus: () => m.status,
    isDirty: (channel: string) => m.dirty.has(channel),
    markDirty: (channel: string) => {
      m.dirty.add(channel);
    },
    clearDirty: (channel: string) => {
      m.dirty.delete(channel);
    },
  };
}

export function subscribeWalletLive(
  walletAddress: string,
  channelsOrOptions:
    | string[]
    | readonly string[]
    | ({ channels?: string[] | readonly string[] } & WalletLiveHandlers),
  handlers?: WalletLiveHandlers,
): () => void {
  const m = getManager(walletAddress);
  let channels: string[] = [];
  let h: WalletLiveHandlers = {};
  if (Array.isArray(channelsOrOptions)) {
    channels = normalizeChannels(channelsOrOptions);
    h = handlers ?? {};
  } else if (channelsOrOptions && typeof channelsOrOptions === 'object') {
    const obj = channelsOrOptions as { channels?: unknown } & WalletLiveHandlers;
    channels = normalizeChannels(obj.channels);
    const rest = { ...obj };
    delete (rest as { channels?: unknown }).channels;
    h = mergeHandlers(rest as WalletLiveHandlers, handlers);
  }
  const id = m.nextId++;
  const sub: Subscriber = {
    id,
    channels: new Set<string>(channels),
    handlers: h,
  };
  m.subscribers.set(id, sub);
  m.ensureConnected();
  return () => {
    m.subscribers.delete(id);
    m.maybeClose();
  };
}

export function isWalletChannelDirty(walletAddress: string, channel: string): boolean {
  const m = managers.get(walletAddress.toLowerCase());
  return !!m?.dirty.has(channel);
}

export function clearWalletChannelDirty(walletAddress: string, channel: string): void {
  const m = managers.get(walletAddress.toLowerCase());
  m?.dirty.delete(channel);
}

export const isChannelDirty = isWalletChannelDirty;
export const clearChannelDirty = clearWalletChannelDirty;
