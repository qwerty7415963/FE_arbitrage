import { apiClient } from '@/infrastructure/api-client';
import type { ApiResponse } from '@/types/api';
import type { FundingArbitrageData, Venue, SortOption } from '@/types/funding-arbitrage';

export async function getVenues(): Promise<Venue[]> {
  const res = await apiClient<ApiResponse<Venue[]>>('/api/v1/venues');
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getFundingArbitrage(
  venueIds: string[],
  options?: {
    sort?: SortOption;
    limit?: number;
    cursor?: string;
    includeStale?: boolean;
    refresh?: boolean;
  },
): Promise<{
  data: FundingArbitrageData;
  meta: { cursor?: string; has_more?: boolean; limit?: number };
}> {
  if (venueIds.length < 2) {
    throw new Error('At least 2 venues are required');
  }
  if (venueIds.length > 10) {
    throw new Error('Maximum 10 venues allowed');
  }

  const params = new URLSearchParams();
  params.set('venue_id', venueIds.join(','));
  if (options?.sort) params.set('sort', options.sort);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.cursor) params.set('cursor', options.cursor);
  if (options?.includeStale) params.set('include_stale', 'true');
  if (options?.refresh) params.set('refresh', 'true');

  const res = await apiClient<ApiResponse<FundingArbitrageData>>(
    `/api/v1/funding/arbitrage?${params.toString()}`,
  );
  if (!res.data) throw new Error('No data returned');
  return { data: res.data, meta: res.meta || {} };
}
