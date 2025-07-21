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
  systems: string[];
  system_names: SystemNames[];
};

export interface SystemNames {
  id: string;
  display_name: string;
}
