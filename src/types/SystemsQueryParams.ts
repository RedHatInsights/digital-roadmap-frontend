export type SortOrder = 'asc' | 'desc';

export interface SystemsQueryParams {
  offset?: number;
  limit?: number;
  search?: string;
  sort_order?: SortOrder;
}
