export interface VenueInfo {
  id: string;
  code: string;
  name: string;
}

export interface ArbitrageToken {
  symbol: string;
  instrument_id: string;
  long_venue_id: string;
  short_venue_id: string;
  funding_available: boolean;
  is_stale: boolean;
  rate_1h_percent: number;
  rate_8h_percent: number;
  apr_percent: number;
  price_spread_percent: number;
  venue_a_symbol: string;
  venue_a_funding_rate: string;
  venue_a_interval_seconds: number;
  venue_a_observed_at: string;
  venue_a_oi: string;
  venue_b_symbol: string;
  venue_b_funding_rate: string;
  venue_b_interval_seconds: number;
  venue_b_observed_at: string;
  venue_b_oi: string;
}

export interface ArbitragePair {
  venue_a?: VenueInfo;
  venue_b?: VenueInfo;
  tokens?: ArbitrageToken[] | null;
}

export interface FundingArbitrageMeta {
  has_more?: boolean;
  limit?: number;
  page?: number;
  total_pages?: number;
}

export interface FundingArbitrageData {
  cache_status: string;
  data_as_of: string;
  pairs?: ArbitragePair[] | null;
}

export interface Venue {
  id: string;
  code: string;
  name: string;
  venue_type: 'CEX' | 'PERP_DEX';
}

export type SortOption = 'rate_1h_desc' | 'rate_8h_desc' | 'apr_desc' | 'spread_desc';
