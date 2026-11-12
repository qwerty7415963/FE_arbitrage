import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBucketDetail } from '@/hooks/use-bucket-detail';
import { fetchBucketDetail } from '@/services/traders';

vi.mock('@/services/traders', () => ({
  fetchBucketDetail: vi.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useBucketDetail', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('fetches with correct query key', async () => {
    vi.mocked(fetchBucketDetail).mockResolvedValue({ bucket_id: 'profitable' } as never);
    const { result } = renderHook(
      () =>
        useBucketDetail({
          kind: 'pnl',
          bucket: 'profitable',
          venue: 'hyperliquid',
          period: '30D',
          range: '30D',
        }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchBucketDetail).toHaveBeenCalled();
  });
});
