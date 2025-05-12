export interface Stream {
  name: string;
  display_name: string;
  os_major: number;
  os_minor: number;
  os_lifecycle: string;
  start_date: string;
  end_date: string;
  support_status: string;
  count: number;
  application_stream_name: string;
  rolling: boolean;
  systems: string[];
  related: boolean;
}
