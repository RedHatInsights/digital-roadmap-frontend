import { Stream } from './Stream';

export interface AppLifecycleChanges {
  module_name: string;
  rhel_major_version: number;
  streams: Stream[];
  type: string;
}
