import { Profiles } from './Profile';

export interface Stream {
  arch: string;
  context: string;
  description: string;
  end_date: string;
  name: string;
  profiles: Profiles;
  start_date: string;
  stream: string;
  version: string;
  rhel_major_version: number; // we are adding this on FE side from AppLifecycleChanges type
  systems: number; // placeholder for when system counts get added to the data
}
