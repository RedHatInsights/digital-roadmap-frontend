import { SystemsDetail } from './SystemsDetail';

export type UpcomingChanges = {
  name: string;
  type: string;
  package: string;
  packages?: string[];
  release: string;
  date: string;
  details?: {
    summary: string;
    architecture: string | null;
    potentiallyAffectedSystemsCount?: number;
    potentiallyAffectedSystemsDetail?: SystemsDetail[];
    potentiallyAffectedSystems?: string[];
    trainingTicket: string;
    deployedDate: string | null;
    lastModified: string;
    dateAdded?: string;
    detailFormat: 0 | 1 | 2 | 3;
  };
};
