import { SystemsDetail } from './SystemsDetail';

export type SystemLifecycleChanges = {
  name: string;
  display_name: string;
  major: number;
  minor: number;
  start_date: string;
  end_date: string;
  count: number;
  lifecycle_type: string;
  support_status: string;
  related: boolean;
  systems_detail: SystemsDetail[];
};
