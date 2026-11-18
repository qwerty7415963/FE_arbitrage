'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeWalletLive } from '@/lib/wallet-live';
import type {
  ActivityFill,
  ActivityTrade,
  LiveActivityItem,
  WalletConnectionStatus,
  WalletOrderEvent,
} from '@/types/trader';

export interface UseTraderActivityResult {
  items: LiveActivityItem[];
  live: string;
  connection: WalletConnectionStatus | null;
  isLoading: boolean;
}

export const LIVE_ACTIVITY_MAX = 50;

function isCloseDir(dir: unknown): boolean {
  return typeof dir === 'string' && dir.toLowerCase().startsWith('close');
}

function itemTimeMs(item: LiveActivityItem): number {
  const parsed = Date.parse(item.time);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function useTraderActivity(walletAddress: string): UseTraderActivityResult {
  const wallet = walletAddress.toLowerCase();
  const [orders, setOrders] = useState<WalletOrderEvent[]>([]);
  const [fills, setFills] = useState<ActivityFill[]>([]);
  const [closes, setCloses] = useState<ActivityTrade[]>([]);
  const [live, setLive] = useState<string>('disconnected');
  const [connection, setConnection] = useState<WalletConnectionStatus | null>(null);
  const [prevWallet, setPrevWallet] = useState(wallet);
  if (prevWallet !== wallet) {
    setPrevWallet(wallet);
    setOrders([]);
    setFills([]);
    setCloses([]);
  }

  useEffect(() => {
    if (!wallet) return;
    const unsub = subscribeWalletLive(wallet, ['activity', 'orders'], {
      onBootstrap: (channel, data) => {
        if (channel !== 'activity') return;
        const fillsData = Array.isArray(data)
          ? data
          : (data as { fills?: ActivityFill[] } | null)?.fills;
        if (Array.isArray(fillsData)) {
          setFills(fillsData as ActivityFill[]);
        }
      },
      onFill: (fill) => {
        if (isCloseDir(fill.dir)) return;
        setFills((prev) => [fill, ...prev].slice(0, LIVE_ACTIVITY_MAX));
      },
      onOrderCreated: (order) => {
        setOrders((prev) => [order, ...prev].slice(0, LIVE_ACTIVITY_MAX));
      },
      onActivity: (trade) => {
        setCloses((prev) => [trade, ...prev].slice(0, LIVE_ACTIVITY_MAX));
      },
      onConnection: (status) => setConnection(status),
      onStatus: (status) => setLive(status),
    });
    return unsub;
  }, [wallet]);

  const items = useMemo<LiveActivityItem[]>(() => {
    const merged: LiveActivityItem[] = [
      ...orders.map((order): LiveActivityItem => ({
        kind: 'limit',
        time: order.timestamp ?? order.time ?? '',
        order,
      })),
      ...fills.map((fill): LiveActivityItem => ({
        kind: 'fill',
        time: fill.time,
        fill,
      })),
      ...closes.map((trade): LiveActivityItem => ({
        kind: 'close',
        time: trade.closed_at,
        trade,
      })),
    ];
    merged.sort((a, b) => itemTimeMs(b) - itemTimeMs(a));
    return merged.slice(0, LIVE_ACTIVITY_MAX);
  }, [orders, fills, closes]);

  return {
    items,
    live: live as string,
    connection,
    isLoading: live !== 'connected',
  };
}
