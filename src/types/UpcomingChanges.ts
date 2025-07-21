export type UpcomingChanges = {
  name: string;
  type: string;
  package: string;
  release: string;
  date: string;
  details?: {
    summary: string;
    architecture: string;
    potentiallyAffectedSystemsCount: number;
    potentiallyAffectedSystemNames: SystemNames[];
    trainingTicket: string;
    dateAdded: string;
    lastModified: string;
    detailFormat: 0 | 1 | 2 | 3;
  };
};

export interface SystemNames {
  id: string;
  display_name: string;
}
