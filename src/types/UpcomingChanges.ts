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
    potentiallyAffectedSystems: string[];
    trainingTicket: string;
    dateAdded: string;
    lastModified: string;
    detailFormat: 0 | 1 | 2 | 3;
  };
};
