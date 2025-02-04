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
}
