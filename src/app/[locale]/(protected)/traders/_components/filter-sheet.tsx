'use client';

import { ScannerFiltersPanel } from './scanner-filters-panel';
import type { ScannerFiltersPanelProps } from './scanner-filters-panel';

export type FilterSheetProps = Omit<ScannerFiltersPanelProps, 'variant'>;

export function FilterSheet(props: FilterSheetProps) {
  return <ScannerFiltersPanel variant="sheet" {...props} />;
}

export default FilterSheet;
