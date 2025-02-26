const VIRT = {
  arch: 'x86_64',
  context: '9edba152',
  description: 'A virtualization module',
  end_date: '2029-06-31',
  name: 'virt',
  profiles: { common: [] },
  rhel_major_version: 8,
  start_date: '2019-05-12',
  stream: 'rhel',
  version: '820190226174025',
  systems: 3, // this is not really reflective of API
};

const VARNISH = {
  arch: 'x86_64',
  context: '9edba152',
  description: 'Varnish Cache web application accelerator',
  end_date: '2029-05-31',
  name: 'varnish',
  profiles: { common: [] },
  rhel_major_version: 9,
  start_date: '2019-05-07',
  stream: '6',
  version: '820181213144015',
  systems: 1, // this is not really reflective of API
};

const IDM = {
  arch: 'x86_64',
  context: '49cc9d1b',
  description:
    'RHEL IdM is an integrated solution to provide centrally managed Identity (users, hosts, services), Authentication (SSO, 2FA), and Authorization (host access control, SELinux user roles, services). The solution provides features for further integration with Linux based clients (SUDO, automount) and integration with Active Directory based infrastructures (Trusts).\nThis module stream supports only client side of RHEL IdM solution',
  end_date: '2029-05-31',
  name: 'idm',
  profiles: { common: [] },
  rhel_major_version: 8,
  start_date: '2019-05-07',
  stream: 'client',
  version: '820190227213458',
  systems: 0, // this is not really reflective of API
};

const RHEL_NINE_TWO = {
  lifecycle_type: 'mainline',
  major: 9,
  minor: 2,
  name: 'RHEL 9.2',
  release: 'Not applicable',
  release_date: '2023-05-01',
  retirement_date: '2023-11-01',
  systems: 5,
};

const RHEL_EIGHT_THREE = {
  lifecycle_type: 'eus',
  major: 8,
  minor: 3,
  name: 'RHEL 8.3 EUS',
  release: 'Not applicable',
  release_date: '2020-11-01',
  retirement_date: '2021-05-01',
  systems: 50,
};

const RHEL_EIGHT_SEVEN = {
  lifecycle_type: 'e4s',
  major: 8,
  minor: 7,
  name: 'RHEL 8.7 for SAP',
  release: 'Not applicable',
  release_date: '2023-05-01',
  retirement_date: '2023-05-01',
  systems: 12,
};

const RHEL_NINE = {
  lifecycle_type: 'mainline',
  major: 9,
  minor: 0,
  name: 'RHEL 9.0',
  release: 'Not applicable',
  release_date: '2022-05-18',
  retirement_date: '2032-05-01',
  systems: 45,
};

export const ONE_MOCK_RHEL_DATA = [RHEL_NINE_TWO];
export const ONE_MOCK_STREAM_DATA = [VIRT];

export const DUPLICATE_RHEL_DATA = [RHEL_NINE_TWO, RHEL_NINE_TWO];
export const DUPLICATE_STREAMS_DATA = [VIRT, VIRT];

export const MOCK_RHEL_DATA = [RHEL_NINE_TWO, RHEL_EIGHT_THREE, RHEL_EIGHT_SEVEN, RHEL_NINE];
export const MOCK_STREAMS_DATA = [VIRT, IDM, VARNISH];

export const MOCK_RHEL_DATA_BY_NAME = [RHEL_NINE_TWO, RHEL_NINE, RHEL_EIGHT_SEVEN, RHEL_EIGHT_THREE];
export const MOCK_STREAMS_DATA_BY_NAME = [VIRT, VARNISH, IDM];

export const MOCK_RHEL_DATA_BY_RELEASE_DATE = [RHEL_NINE_TWO, RHEL_EIGHT_SEVEN, RHEL_NINE, RHEL_EIGHT_THREE];
export const MOCK_STREAMS_DATA_BY_RELEASE_DATE = [VIRT, VARNISH, IDM];

export const MOCK_RHEL_DATA_BY_RETIREMENT_DATE = [RHEL_NINE, RHEL_NINE_TWO, RHEL_EIGHT_SEVEN, RHEL_EIGHT_THREE];
export const MOCK_STREAMS_DATA_BY_RETIREMENT_DATE = [VIRT, VARNISH, IDM];

export const MOCK_RHEL_DATA_BY_SYSTEMS = [RHEL_EIGHT_THREE, RHEL_NINE, RHEL_EIGHT_SEVEN, RHEL_NINE_TWO];
export const MOCK_STREAMS_DATA_BY_SYSTEMS = [VIRT, VARNISH, IDM];

export const MOCK_RHEL_DATA_BY_RELEASE = [RHEL_NINE_TWO, RHEL_NINE, RHEL_EIGHT_SEVEN, RHEL_EIGHT_THREE];
export const MOCK_STREAMS_DATA_BY_RELEASE = [VARNISH, VIRT, IDM];
