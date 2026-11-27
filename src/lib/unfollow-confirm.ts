const KEY = 'hyperscan.unfollow.skipConfirm';

export function shouldSkipUnfollowConfirm(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setSkipUnfollowConfirm(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(KEY, '1');
    else window.localStorage.removeItem(KEY);
  } catch {
    // ignore storage errors
  }
}
