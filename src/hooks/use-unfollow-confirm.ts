'use client';

import { useRef, useState } from 'react';
import { shouldSkipUnfollowConfirm, setSkipUnfollowConfirm } from '@/lib/unfollow-confirm';

export interface UnfollowTarget {
  venue: string;
  wallet: string;
  label: string;
}

export function useUnfollowConfirm() {
  const [target, setTarget] = useState<UnfollowTarget | null>(null);
  const [skipChecked, setSkipChecked] = useState(false);
  const callbackRef = useRef<(() => void) | null>(null);

  function requestUnfollow(nextTarget: UnfollowTarget, onConfirm: () => void) {
    if (shouldSkipUnfollowConfirm()) {
      onConfirm();
      return;
    }
    callbackRef.current = onConfirm;
    setSkipChecked(false);
    setTarget(nextTarget);
  }

  function confirm() {
    if (skipChecked) setSkipUnfollowConfirm(true);
    const cb = callbackRef.current;
    callbackRef.current = null;
    setTarget(null);
    cb?.();
  }

  function cancel() {
    callbackRef.current = null;
    setTarget(null);
  }

  return { target, skipChecked, setSkipChecked, requestUnfollow, confirm, cancel };
}
