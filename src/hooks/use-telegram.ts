'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLink, getStatus, unlink } from '@/services/telegram';

export function useTelegramStatus(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['telegram-status'],
    queryFn: getStatus,
    staleTime: 10000,
    enabled: options.enabled ?? true,
    retry: false,
  });
}

export function useTelegramLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locale: string) => createLink(locale),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
    },
  });
}

export function useTelegramUnlink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlink(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
    },
  });
}
