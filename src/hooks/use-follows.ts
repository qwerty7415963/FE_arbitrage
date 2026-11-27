'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/infrastructure/api-client';
import { mapErrorCode } from '@/lib/error-mapping';
import { useTranslations } from 'next-intl';
import {
  followWallets,
  getFollowKeys,
  getFollowOverview,
  getFollowStatus,
  listFollowedWallets,
  setFollowNotify,
  unfollowWallets,
  updateFollow,
} from '@/services/follows';
import { useAuthStore } from '@/lib/stores/auth';
import type { FollowStatus } from '@/types/trader';

export function useFollowKeys() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['follow-keys'],
    queryFn: getFollowKeys,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useFollowOverview(period = '30D') {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['follow-overview', period],
    queryFn: () => getFollowOverview(period),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useFollowStatus(venue: string, wallet: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['follow-status', venue, wallet],
    queryFn: () => getFollowStatus(venue, wallet),
    enabled: isAuthenticated && !!venue && !!wallet,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000,
  });
}

export function useFollowedWallets(params: Parameters<typeof listFollowedWallets>[0]) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['followed-wallets', params],
    queryFn: () => listFollowedWallets(params),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useWalletFollowActions(venue: string, wallet: string) {
  const qc = useQueryClient();
  const toast = useToast();
  const te = useTranslations();
  const errorText = (err: unknown) => {
    if (!(err instanceof ApiError)) return te('errors.unknown');
    const fallback = err.message || te('errors.unknown');
    const key = mapErrorCode(err.code);
    return key && key !== 'errors.unknown' ? te(key, { defaultValue: fallback }) : fallback;
  };
  const statusKey = ['follow-status', venue, wallet] as const;

  const snapshot = () => qc.getQueryData<FollowStatus>(statusKey);

  const setOptimistic = (updater: (prev: FollowStatus | undefined) => FollowStatus) => {
    qc.setQueryData<FollowStatus>(statusKey, (prev) => updater(prev));
  };

  const rollback = (prev: FollowStatus | undefined) => {
    qc.setQueryData(statusKey, prev);
  };

  const follow = useMutation({
    mutationFn: ({ notifyEnabled }: { notifyEnabled?: boolean } = {}) =>
      followWallets([{ venue, wallet_address: wallet }], notifyEnabled),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: statusKey });
      const prev = snapshot();
      setOptimistic((cur) => ({
        is_followed: true,
        notify_enabled: true,
        alias: cur?.alias ?? null,
        display_name: cur?.display_name ?? null,
        in_groups: cur?.in_groups ?? [],
      }));
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        rollback(ctx.prev);
      } else {
        qc.setQueryData<FollowStatus>(statusKey, {
          is_followed: false,
          notify_enabled: false,
          alias: null,
          display_name: null,
          in_groups: [],
        });
      }
      toast.showError(errorText(err));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-keys'] });
      qc.invalidateQueries({ queryKey: ['follow-overview'] });
      qc.invalidateQueries({ queryKey: ['followed-wallets'] });
      qc.invalidateQueries({ queryKey: ['trader-groups'] });
    },
  });

  const unfollow = useMutation({
    mutationFn: () => unfollowWallets([{ venue, wallet_address: wallet }]),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: statusKey });
      const prev = snapshot();
      setOptimistic((cur) => ({
        is_followed: false,
        notify_enabled: false,
        alias: null,
        display_name: cur?.display_name ?? null,
        in_groups: cur?.in_groups ?? [],
      }));
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        rollback(ctx.prev);
      } else {
        qc.setQueryData<FollowStatus>(statusKey, {
          is_followed: true,
          notify_enabled: false,
          alias: null,
          display_name: null,
          in_groups: [],
        });
      }
      toast.showError(errorText(err));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-keys'] });
      qc.invalidateQueries({ queryKey: ['follow-overview'] });
      qc.invalidateQueries({ queryKey: ['followed-wallets'] });
      qc.invalidateQueries({ queryKey: ['trader-groups'] });
    },
  });

  const toggleNotify = useMutation({
    mutationFn: (notifyEnabled: boolean) => setFollowNotify(venue, wallet, notifyEnabled),
    onMutate: async (notifyEnabled: boolean) => {
      const prev = snapshot();
      setOptimistic((cur) => ({
        is_followed: cur?.is_followed ?? true,
        notify_enabled: notifyEnabled,
        alias: cur?.alias ?? null,
        display_name: cur?.display_name ?? null,
        in_groups: cur?.in_groups ?? [],
      }));
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      rollback(ctx?.prev);
      toast.showError(errorText(err));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-keys'] });
      qc.invalidateQueries({ queryKey: ['follow-overview'] });
      qc.invalidateQueries({ queryKey: ['followed-wallets'] });
    },
  });

  const rename = useMutation({
    mutationFn: (alias: string) => updateFollow(venue, wallet, { alias }),
    onMutate: async (alias: string) => {
      const prev = snapshot();
      setOptimistic((cur) => ({
        is_followed: cur?.is_followed ?? true,
        notify_enabled: cur?.notify_enabled ?? true,
        alias: alias.trim() || null,
        display_name: cur?.display_name ?? null,
        in_groups: cur?.in_groups ?? [],
      }));
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      rollback(ctx?.prev);
      toast.showError(errorText(err));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-keys'] });
      qc.invalidateQueries({ queryKey: ['followed-wallets'] });
    },
  });

  return { follow, unfollow, toggleNotify, rename };
}

export function useFollowMutations() {
  const qc = useQueryClient();
  const toast = useToast();
  const te = useTranslations();
  const errorText = (err: unknown) => {
    if (!(err instanceof ApiError)) return te('errors.unknown');
    const fallback = err.message || te('errors.unknown');
    const key = mapErrorCode(err.code);
    return key && key !== 'errors.unknown' ? te(key, { defaultValue: fallback }) : fallback;
  };
  const reportError = (err: unknown) => {
    toast.showError(errorText(err));
  };
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['follow-keys'] });
    qc.invalidateQueries({ queryKey: ['follow-overview'] });
    qc.invalidateQueries({ queryKey: ['followed-wallets'] });
    qc.invalidateQueries({ queryKey: ['trader-groups'] });
  };
  const follow = useMutation({
    mutationFn: ({
      wallets,
      notifyEnabled,
    }: {
      wallets: Parameters<typeof followWallets>[0];
      notifyEnabled?: boolean;
    }) => followWallets(wallets, notifyEnabled),
    onSuccess: invalidate,
    onError: reportError,
  });
  const unfollow = useMutation({
    mutationFn: (wallets: Parameters<typeof unfollowWallets>[0]) => unfollowWallets(wallets),
    onSuccess: invalidate,
    onError: reportError,
  });
  const updateMeta = useMutation({
    mutationFn: ({
      venue,
      address,
      alias,
      notifyEnabled,
    }: {
      venue: string;
      address: string;
      alias?: string;
      notifyEnabled?: boolean;
    }) => updateFollow(venue, address, { alias, notify_enabled: notifyEnabled }),
    onSuccess: invalidate,
    onError: reportError,
  });
  const toggleNotify = useMutation({
    mutationFn: ({
      venue,
      address,
      notifyEnabled,
    }: {
      venue: string;
      address: string;
      notifyEnabled: boolean;
    }) => setFollowNotify(venue, address, notifyEnabled),
    onSuccess: invalidate,
    onError: reportError,
  });
  return { follow, unfollow, toggleNotify, updateMeta };
}
