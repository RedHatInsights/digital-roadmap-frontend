export interface Filter {
  name: string;
  chartSortBy?: string;
  lifecycleDropdown?: string;
  viewFilter?: string;
  type?: Set<string>;
  release?: string[];
  date?: string;
  chartOrder?: string;
  versions?: string[];
}

export interface ExtendedFilter extends Filter {
  viewFilter?: string;
}
