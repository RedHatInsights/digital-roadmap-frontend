export interface PaginatedSystemsMeta {
  count: number;
  total: number;
}

export interface SystemInfo {
  id: string;
  display_name: string;
  os_major: number;
  os_minor: number | null;
}

export interface PaginatedSystemsResponse {
  meta: PaginatedSystemsMeta;
  data: SystemInfo[];
}
