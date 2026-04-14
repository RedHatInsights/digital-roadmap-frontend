export interface Filter {
  name: string;
  chartSortBy?: string;
  lifecycleDropdown?: string;
  viewFilter?: string;
  type?: Set<string>;
  release?: string[];
  date?: string;
  addedToRoadmap?: string;
  chartOrder?: string;
  versions?: string[];
  statuses?: string[];
}

export interface ExtendedFilter extends Filter {
  viewFilter?: string;
}
