export type UpcomingChanges = {
  name: string;
  type: string;
  release: string;
  date: string;
  details?: {
    summary: string;
    architecture: string;
    potentiallyAffectedSystems: number;
    trainingTicket: string;
    dateAdded: string;
    lastModified: string;
    detailFormat: 0 | 1 | 2 | 3;
  };
};
