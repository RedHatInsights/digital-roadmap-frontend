
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

export const module_data: any = [
  {
      "module_name": "go-toolset",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "b754926a",
              "description": "Go Tools and libraries",
              "end_date": new Date(2019, 11, 30),
              "name": "go-toolset",
              "profiles": {"common": ["go-toolset"]},
              "start_date": new Date(2019, 5, 7),
              "stream": "rhel8",
              "version": "820190208025401",
          }
      ],
      "type": "module",
  },
  {
      "module_name": "satellite-5-client",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "9edba152",
              "end_date": "Unknown",
              "name": "satellite-5-client",
              "profiles": {
                  "common": [
                      "dnf-plugin-spacewalk",
                      "rhn-client-tools",
                      "rhn-setup",
                      "rhnlib",
                      "rhnsd",
                  ],
                  "gui": [
                      "dnf-plugin-spacewalk",
                      "rhn-client-tools",
                      "rhn-setup",
                      "rhn-setup-gnome",
                      "rhnlib",
                      "rhnsd",
                  ],
              },
              "start_date": "Unknown",
              "stream": "1",
              "version": "820190204085912",
          }
      ],
      "type": "module",
  },
  {
      "module_name": "swig",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "9edba152",
              "description": "Simplified Wrapper and Interface Generator ",
              "end_date": "Unknown",
              "name": "swig",
              "profiles": {
                  "common": ["swig"],
                  "complete": ["swig", "swig-doc", "swig-gdb"],
              },
              "start_date": "Unknown",
              "stream": "3",
              "version": "820181213143944",
          },
          {
              "arch": "x86_64",
              "context": "9f9e2e7e",
              "description": "Simplified Wrapper and Interface Generator ",
              "end_date": "Unknown",
              "name": "swig",
              "profiles": {
                  "common": ["swig"],
                  "complete": ["swig", "swig-doc", "swig-gdb"],
              },
              "start_date": "Unknown",
              "stream": "4",
              "version": "8040020201001104431",
          },
          {
              "arch": "x86_64",
              "context": "fd72936b",
              "end_date": new Date(2027, 5, 31),
              "name": "swig",
              "profiles": {
                  "common": ["swig"],
                  "complete": ["swig", "swig-doc", "swig-gdb"],
              },
              "start_date": new Date(2023, 5, 16),
              "stream": "4.1",
              "version": "8080020221213075530",
          },
      ],
      "type": "module",
  },
  {
      "module_name": "pmdk",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "fd72936b",
              "end_date": "Unknown",
              "name": "pmdk",
              "profiles": {},
              "start_date": "Unknown",
              "stream": "1_fileformat_v6",
              "version": "8080020221121213140",
          }
      ],
      "type": "module",
  },
  {
      "module_name": "subversion",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "a51370e3",
              "description": "Apache Subversion, a Modern Version Control System",
              "end_date": "Unknown",
              "name": "subversion",
              "profiles": {
                  "common": ["subversion", "subversion-libs", "subversion-tools"],
                  "server": [
                      "mod_dav_svn",
                      "subversion",
                      "subversion-libs",
                      "subversion-tools",
                  ],
              },
              "start_date": "Unknown",
              "stream": "1.1",
              "version": "820181215112250",
          },
          {
              "arch": "x86_64",
              "context": "78111232",
              "end_date": new Date(2029, 5, 31),
              "name": "subversion",
              "profiles": {
                  "common": ["subversion", "subversion-libs", "subversion-tools"],
                  "server": [
                      "mod_dav_svn",
                      "subversion",
                      "subversion-libs",
                      "subversion-tools",
                  ],
              },
              "start_date": new Date(2019, 5, 7),
              "stream": "1.10",
              "version": "8070020220701055908",
          },
          {
              "arch": "x86_64",
              "context": "a74460ab",
              "end_date": new Date(2024, 5, 31),
              "name": "subversion",
              "profiles": {
                  "common": ["subversion", "subversion-libs", "subversion-tools"],
                  "server": [
                      "mod_dav_svn",
                      "subversion",
                      "subversion-libs",
                      "subversion-tools",
                  ],
              },
              "start_date": new Date(2021, 5, 18),
              "stream": "1.14",
              "version": "8070020220701055624",
          },
      ],
      "type": "module",
  },
  {
      "module_name": "rust-toolset",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "b09eea91",
              "end_date": new Date(2019, 11, 30),
              "name": "rust-toolset",
              "profiles": {"common": ["rust-toolset"]},
              "start_date": new Date(2019, 5, 7),
              "stream": "rhel8",
              "version": "820181214214108",
          }
      ],
      "type": "module",
  },
  {
      "module_name": "jaxb",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "9d367344",
              "end_date": "Unknown",
              "name": "jaxb",
              "profiles": {"common": ["jaxb-runtime"]},
              "start_date": "Unknown",
              "stream": "4",
              "version": "8080020230207081414",
          }
      ],
      "type": "module",
  },
  {
      "module_name": "python39",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "d47b87a4",
              "end_date": new Date(2025, 11, 30),
              "name": "python39",
              "profiles": {
                  "build": ["python39", "python39-devel", "python39-rpm-macros"],
                  "common": ["python39"],
              },
              "start_date": new Date(2021, 5, 18),
              "stream": "3.9",
              "version": "8100020240927003152",
          }
      ],
      "type": "module",
  },
  {
      "module_name": "perl-DBD-SQLite",
      "rhel_major_version": 8,
      "streams": [
          {
              "arch": "x86_64",
              "context": "6bc6cad6",
              "end_date": "Unknown",
              "name": "perl-DBD-SQLite",
              "profiles": {"common": ["perl-DBD-SQLite"]},
              "start_date": "Unknown",
              "stream": "1.58",
              "version": "820181214121133",
          }
      ],
      "type": "module",
  }
]
