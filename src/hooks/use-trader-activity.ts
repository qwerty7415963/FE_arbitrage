'use client';

import { useEffect, useMemo, useState } from 'react';
import { connectTradeActivityWS, type ActivityWsStatus } from '@/lib/trader-activity-ws';
import type {
  ActivityFill,
  ActivityTrade,
  LiveActivityItem,
  WalletConnectionStatus,
  WalletOrderEvent,
} from '@/types/trader';

export interface UseTraderActivityResult {
  items: LiveActivityItem[];
  live: ActivityWsStatus;
  /** Backend reconnect state (`wallet.connection.updated`); null until first event. */
  connection: WalletConnectionStatus | null;
  /** True while the WS transport is not connected (connecting-loading state). */
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

/**
 * Sidebar 3-event timeline (SIDEBAR-3EVENTS, frozen delta over contract v1.2).
 * WS-only: no REST (`/activity` counter stays 0), no fundings, no durable
 * prepend. Merges limit placements (`wallet.order.created`), open-direction
 * fills (`wallet.fill.created` with dir not starting with Close), and
 * completed-cycle closes (`wallet.activity.created`) into a single timeline
 * sorted time DESC and capped at 50. WS connect/status/reconnect behavior is
 * unchanged (live + connection surfaced for the LIVE badge).
 */
export function useTraderActivity(walletAddress: string): UseTraderActivityResult {
  const wallet = walletAddress.toLowerCase();
  const [orders, setOrders] = useState<WalletOrderEvent[]>([]);
  const [fills, setFills] = useState<ActivityFill[]>([]);
  const [closes, setCloses] = useState<ActivityTrade[]>([]);
  const [live, setLive] = useState<ActivityWsStatus>('disconnected');
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
    const handle = connectTradeActivityWS(
      wallet,
      (fill) => {
        if (isCloseDir(fill.dir)) return;
        setFills((prev) => [fill, ...prev].slice(0, LIVE_ACTIVITY_MAX));
      },
      (status) => setLive(status),
      {
        onOrderCreated: (order) => {
          setOrders((prev) => [order, ...prev].slice(0, LIVE_ACTIVITY_MAX));
        },
        onActivity: (trade) => {
          setCloses((prev) => [trade, ...prev].slice(0, LIVE_ACTIVITY_MAX));
        },
        onConnection: (status) => setConnection(status),
      },
    );
    return () => handle.close();
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
    live,
    connection,
    isLoading: live !== 'connected',
  };
}
