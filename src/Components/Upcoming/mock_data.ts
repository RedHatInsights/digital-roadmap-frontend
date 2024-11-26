export interface Record {
  name: string;
  type: string;
  release: string;
  date: string;
  details?: {
    summary: string;
    potentiallyAffectedSystems: number;
    trainingTicket: string;
    dateAdded: string;
    lastModified: string;
    detailFormat: 0 | 1 | 2 | 3;
  };
}

// In real usage, this data would come from some external source like an API via props.
export const data: Record[] = [
  {
    name: 'OpenJDK 11 retirement',
    type: 'Addition',
    release: '9.x',
    date: 'Oct 2024',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: '.NET 6 retirement',
    type: 'Addition',
    release: '9.x',
    date: 'Nov 2024',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'gcc-toolset 12 retirement',
    type: 'Addition',
    release: '9.x',
    date: 'Nov 2024',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'Ruby 3.1 retirement',
    type: 'Addition',
    release: '9.x',
    date: 'Mar 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'Node.js 18 retirement',
    type: 'Addition',
    release: '9.x',
    date: 'Apr 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: '6.11 kernel version',
    type: 'Addition',
    release: '10.0',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'gcc-toolset 14',
    type: 'Addition',
    release: '9.5',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'gcc-toolset 14',
    type: 'Addition',
    release: '10.0',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'MariaDB 11.0',
    type: 'Addition',
    release: '9.5',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'MariaDB 11.0',
    type: 'Addition',
    release: '10.0',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'PHP 8.1 retirement',
    type: 'Addition',
    release: '9.x',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'PHP 8.3',
    type: 'Addition',
    release: '9.5',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'PHP 8.3',
    type: 'Addition',
    release: '10.0',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'Python 3.12',
    type: 'Addition',
    release: '9.5',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'Python 3.12',
    type: 'Addition',
    release: '10.0',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'Ruby 3.4',
    type: 'Addition',
    release: '9.5',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
  {
    name: 'Ruby 3.4',
    type: 'Addition',
    release: '10.0',
    date: 'May 2025',
    details: {
      detailFormat: 0,
      summary: 'example text here',
      potentiallyAffectedSystems: 5,
      trainingTicket: 'No training ticket',
      dateAdded: 'October 29, 2024',
      lastModified: 'October 29, 2024',
    },
  },
];

export const columnNames = {
  name: 'Name',
  type: 'Type',
  release: 'Release',
  date: 'Date',
};
