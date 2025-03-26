export interface Filter {
  name: string;
  chartSortBy?: string;
  lifecycleDropdown?: string;
  type?: Set<string>;
  release?: string[];
  date?: string;
}
