const VIRT = {
  end_date: '2029-06-31',
  name: 'virt',
  display_name: 'virt rhel',
  profiles: { common: [] },
  os_major: 8,
  os_minor: 0,
  os_lifecycle: '',
  support_status: 'Supported',
  start_date: '2019-05-12',
  application_stream_name: 'Virt rhel',
  version: '820190226174025',
  count: 3,
  rolling: false,
  systems: ['system1', 'system2'],
  related: false,
};

const VARNISH = {
  description: 'Varnish Cache web application accelerator',
  end_date: '2029-05-31',
  name: 'varnish',
  display_name: 'varnish 6',
  profiles: { common: [] },
  os_major: 9,
  os_minor: 2,
  os_lifecycle: '',
  support_status: 'Supported',
  start_date: '2019-05-07',
  application_stream_name: 'Varnish 6',
  version: '820181213144015',
  count: 1,
  rolling: false,
  systems: ['system1', 'system2'],
  related: false,
};

const IDM = {
  end_date: '2029-05-31',
  name: 'idm',
  display_name: 'idm client',
  profiles: { common: [] },
  os_major: 8,
  os_minor: 4,
  os_lifecycle: '',
  support_status: 'Supported',
  start_date: '2019-05-07',
  application_stream_name: 'IDM client',
  version: '820190227213458',
  count: 0,
  rolling: false,
  systems: ['system1', 'system2'],
  related: false,
};

const RHEL_NINE_TWO = {
  lifecycle_type: 'mainline',
  major: 9,
  minor: 2,
  name: 'RHEL 9.2',
  display_name: 'RHEL 9.2',
  release: 'Not applicable',
  start_date: '2023-05-01',
  end_date: '2023-11-01',
  count: 5,
  support_status: 'Retired',
  related: false,
  systems: ['system1', 'system2'],
};

const RHEL_EIGHT_THREE = {
  lifecycle_type: 'eus',
  major: 8,
  minor: 3,
  name: 'RHEL 8.3 EUS',
  display_name: 'RHEL 8.3 EUS',
  release: 'Not applicable',
  start_date: '2020-11-01',
  end_date: '2021-05-01',
  count: 50,
  support_status: 'Retired',
  related: false,
  systems: ['system1', 'system2'],
};

const RHEL_EIGHT_SEVEN = {
  lifecycle_type: 'e4s',
  major: 8,
  minor: 7,
  name: 'RHEL 8.7 for SAP',
  display_name: 'RHEL 8.7 for SAP',
  release: 'Not applicable',
  start_date: '2023-05-01',
  end_date: '2023-05-01',
  count: 12,
  support_status: 'Retired',
  related: false,
  systems: ['system1', 'system2'],
};

const RHEL_NINE = {
  lifecycle_type: 'mainline',
  major: 9,
  minor: 0,
  name: 'RHEL 9.0',
  display_name: 'RHEL 9.0',
  release: 'Not applicable',
  start_date: '2022-05-18',
  end_date: '2032-05-01',
  count: 45,
  support_status: 'Supported',
  related: false,
  systems: ['system1', 'system2'],
};

export const ONE_MOCK_RHEL_DATA = [RHEL_NINE_TWO];
export const ONE_MOCK_STREAM_DATA = [VIRT];

export const DUPLICATE_RHEL_DATA = [RHEL_NINE_TWO, RHEL_NINE_TWO];
export const DUPLICATE_STREAMS_DATA = [VIRT, VIRT];

export const MOCK_RHEL_DATA = [RHEL_NINE_TWO, RHEL_EIGHT_THREE, RHEL_EIGHT_SEVEN, RHEL_NINE];
export const MOCK_STREAMS_DATA = [VIRT, IDM, VARNISH];

export const MOCK_RHEL_DATA_BY_NAME = [RHEL_NINE_TWO, RHEL_NINE, RHEL_EIGHT_SEVEN, RHEL_EIGHT_THREE];
export const MOCK_STREAMS_DATA_BY_NAME = [VIRT, VARNISH, IDM];

export const MOCK_RHEL_DATA_BY_START_DATE = [RHEL_NINE_TWO, RHEL_EIGHT_SEVEN, RHEL_NINE, RHEL_EIGHT_THREE];
export const MOCK_STREAMS_DATA_BY_START_DATE = [VIRT, VARNISH, IDM];

export const MOCK_RHEL_DATA_BY_END_DATE = [RHEL_NINE, RHEL_NINE_TWO, RHEL_EIGHT_SEVEN, RHEL_EIGHT_THREE];
export const MOCK_STREAMS_DATA_BY_END_DATE = [VIRT, VARNISH, IDM];

export const MOCK_RHEL_DATA_BY_SYSTEMS = [RHEL_NINE_TWO, RHEL_EIGHT_SEVEN, RHEL_NINE, RHEL_EIGHT_THREE];
export const MOCK_STREAMS_DATA_BY_SYSTEMS = [IDM, VARNISH, VIRT];

export const MOCK_RHEL_DATA_BY_RELEASE = [RHEL_NINE_TWO, RHEL_NINE, RHEL_EIGHT_SEVEN, RHEL_EIGHT_THREE];

export const MOCK_STREAMS_DATA_BY_RELEASE = [VARNISH, IDM, VIRT];
