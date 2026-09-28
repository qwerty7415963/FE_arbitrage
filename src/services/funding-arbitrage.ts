import { apiClient } from '@/infrastructure/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  FundingArbitrageData,
  FundingArbitrageMeta,
  Venue,
  SortOption,
} from '@/types/funding-arbitrage';

export async function getVenues(): Promise<Venue[]> {
  const params = new URLSearchParams({ market: 'perp' });
  const res = await apiClient<ApiResponse<Venue[]>>(`/api/v1/public/venues?${params.toString()}`, {
    auth: false,
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getFundingArbitrage(
  venueIds: string[],
  options?: {
    sort?: SortOption;
    page?: number;
    limit?: number;
  },
): Promise<{
  data: FundingArbitrageData;
  meta: FundingArbitrageMeta;
}> {
  if (venueIds.length < 2) {
    throw new Error('At least 2 venues are required');
  }
  if (venueIds.length > 10) {
    throw new Error('Maximum 10 venues allowed');
  }

  const params = new URLSearchParams();
  params.set('venue_id', venueIds.join(','));
  params.set('page', String(options?.page ?? 1));
  params.set('limit', String(options?.limit ?? 50));
  if (options?.sort) params.set('sort', options.sort);

  const res = await apiClient<ApiResponse<FundingArbitrageData>>(
    `/api/v1/funding/arbitrage?${params.toString()}`,
  );
  if (!res.data) throw new Error('No data returned');
  return { data: res.data, meta: res.meta || {} };
}
