const VIRT = {
  end_date: '2029-06-31',
  name: 'virt',
  profiles: { common: [] },
  os_major: 8,
  os_minor: 0,
  os_lifecycle: '',
  support_status: 'Supported',
  start_date: '2019-05-12',
  stream: 'rhel',
  version: '820190226174025',
  count: 3,
  rolling: false,
};

const VARNISH = {
  description: 'Varnish Cache web application accelerator',
  end_date: '2029-05-31',
  name: 'varnish',
  profiles: { common: [] },
  os_major: 9,
  os_minor: 2,
  os_lifecycle: '',
  support_status: 'Supported',
  start_date: '2019-05-07',
  stream: '6',
  version: '820181213144015',
  count: 1,
  rolling: false,
};

const IDM = {
  end_date: '2029-05-31',
  name: 'idm',
  profiles: { common: [] },
  os_major: 8,
  os_minor: 4,
  os_lifecycle: '',
  support_status: 'Supported',
  start_date: '2019-05-07',
  stream: 'client',
  version: '820190227213458',
  count: 0,
  rolling: false,
};

const RHEL_NINE_TWO = {
  lifecycle_type: 'mainline',
  major: 9,
  minor: 2,
  name: 'RHEL 9.2',
  release: 'Not applicable',
  release_date: '2023-05-01',
  retirement_date: '2023-11-01',
  count: 5,
  support_status: 'Retired',
};

const RHEL_EIGHT_THREE = {
  lifecycle_type: 'eus',
  major: 8,
  minor: 3,
  name: 'RHEL 8.3 EUS',
  release: 'Not applicable',
  release_date: '2020-11-01',
  retirement_date: '2021-05-01',
  count: 50,
  support_status: 'Retired',
};

const RHEL_EIGHT_SEVEN = {
  lifecycle_type: 'e4s',
  major: 8,
  minor: 7,
  name: 'RHEL 8.7 for SAP',
  release: 'Not applicable',
  release_date: '2023-05-01',
  retirement_date: '2023-05-01',
  count: 12,
  support_status: 'Retired',
};

const RHEL_NINE = {
  lifecycle_type: 'mainline',
  major: 9,
  minor: 0,
  name: 'RHEL 9.0',
  release: 'Not applicable',
  release_date: '2022-05-18',
  retirement_date: '2032-05-01',
  count: 45,
  support_status: 'Supported',
};

export const SYSTEM_ID = [
  'system_name0',
  'system_name1',
  'system_name8',
  'system_name2',
  'system_name3',
  'system_name4',
  'system_name5',
  'system_name6',
  'system_name7',
];

export const SYSTEM_ID_DUPLICIT = [
  'system_name0',
  'system_name1',
  'system_name2',
  'system_name3',
  'system_name4',
  'system_name5',
  'system_name6',
  'system_name7',
  'system_name0',
  'system_name1',
  'system_name2',
  'system_name3',
  'system_name4',
  'system_name5',
  'system_name6',
  'system_name7',
];

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
