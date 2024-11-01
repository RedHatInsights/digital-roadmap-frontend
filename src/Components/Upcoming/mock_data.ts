export interface Record {
  name: string;
  release: string;
  date: string;
}

// In real usage, this data would come from some external source like an API via props.
export const data: Record[] = [
  {
    name: 'OpenJDK 11 retirement',
    release: '9.x',
    date: 'Oct 2024',
  },
  {
    name: '.NET 6 retirement',
    release: '9.x',
    date: 'Nov 2024',
  },
  {
    name: 'gcc-toolset 12 retirement',
    release: '9.x',
    date: 'Nov 2024',
  },
  {
    name: 'Ruby 3.1 retirement',
    release: '9.x',
    date: 'Mar 2025',
  },
  {
    name: 'Node.js 18 retirement',
    release: '9.x',
    date: 'Apr 2025',
  },
  {
    name: '6.11 kernel version',
    release: '10.0',
    date: 'May 2025',
  },
  {
    name: 'gcc-toolset 14',
    release: '9.5',
    date: 'May 2025',
  },
  {
    name: 'gcc-toolset 14',
    release: '10.0',
    date: 'May 2025',
  },
  {
    name: 'MariaDB 11.0',
    release: '9.5',
    date: 'May 2025',
  },
  {
    name: 'MariaDB 11.0',
    release: '10.0',
    date: 'May 2025',
  },
  {
    name: 'PHP 8.1 retirement',
    release: '9.x',
    date: 'May 2025',
  },
  {
    name: 'PHP 8.3',
    release: '9.5',
    date: 'May 2025',
  },
  {
    name: 'PHP 8.3',
    release: '10.0',
    date: 'May 2025',
  },
  {
    name: 'Python 3.12',
    release: '9.5',
    date: 'May 2025',
  },
  {
    name: 'Python 3.12',
    release: '10.0',
    date: 'May 2025',
  },
  {
    name: 'Ruby 3.4',
    release: '9.5',
    date: 'May 2025',
  },
  {
    name: 'Ruby 3.4',
    release: '10.0',
    date: 'May 2025',
  },
];

export const columnNames = {
  name: 'Name',
  release: 'Release',
  date: 'Date',
};
