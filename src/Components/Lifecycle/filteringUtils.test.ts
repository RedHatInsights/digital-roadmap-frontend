import {
  DEFAULT_DROPDOWN_VALUE,
  OTHER_DROPDOWN_VALUE,
  filterChartDataByName,
  filterChartDataByRelease,
  filterChartDataByReleaseDate,
  filterChartDataByRetirementDate,
  filterChartDataBySystems,
} from './filteringUtils';
import {
  DUPLICATE_RHEL_DATA,
  DUPLICATE_STREAMS_DATA,
  MOCK_RHEL_DATA,
  MOCK_RHEL_DATA_BY_NAME,
  MOCK_RHEL_DATA_BY_RELEASE,
  MOCK_RHEL_DATA_BY_RELEASE_DATE,
  MOCK_RHEL_DATA_BY_RETIREMENT_DATE,
  MOCK_RHEL_DATA_BY_SYSTEMS,
  MOCK_STREAMS_DATA,
  MOCK_STREAMS_DATA_BY_NAME,
  MOCK_STREAMS_DATA_BY_RELEASE,
  MOCK_STREAMS_DATA_BY_RELEASE_DATE,
  MOCK_STREAMS_DATA_BY_RETIREMENT_DATE,
  MOCK_STREAMS_DATA_BY_SYSTEMS,
  ONE_MOCK_RHEL_DATA,
  ONE_MOCK_STREAM_DATA,
} from '../../__mocks__/mockData';

describe('Name filtering', () => {
  it('works as expected for streams', () => {
    const result = filterChartDataByName(MOCK_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_STREAMS_DATA_BY_NAME);
  });
  it('works as expected for one stream value', () => {
    const result = filterChartDataByName(ONE_MOCK_STREAM_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_STREAM_DATA);
  });
  it('works as expected for identical stream values', () => {
    const result = filterChartDataByName(DUPLICATE_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(DUPLICATE_STREAMS_DATA);
  });
  it('works as expected for empty streams array', () => {
    const result = filterChartDataByName([], DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
  it('works as expected for RHEL', () => {
    const result = filterChartDataByName(MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_RHEL_DATA_BY_NAME);
  });
  it('works as expected for one RHEL value', () => {
    const result = filterChartDataByName(ONE_MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_RHEL_DATA);
  });
  it('works as expected for identical RHEL values', () => {
    const result = filterChartDataByName(DUPLICATE_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(DUPLICATE_RHEL_DATA);
  });
  it('works as expected for empty RHEL array', () => {
    const result = filterChartDataByName([], OTHER_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
});

describe('Release date filtering', () => {
  it('works as expected for streams', () => {
    const result = filterChartDataByReleaseDate(MOCK_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_STREAMS_DATA_BY_RELEASE_DATE);
  });
  it('works as expected for one stream value', () => {
    const result = filterChartDataByReleaseDate(ONE_MOCK_STREAM_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_STREAM_DATA);
  });
  it('works as expected for empty streams array', () => {
    const result = filterChartDataByReleaseDate([], DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
  it('works as expected for RHEL', () => {
    const result = filterChartDataByReleaseDate(MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_RHEL_DATA_BY_RELEASE_DATE);
  });
  it('works as expected for one RHEL value', () => {
    const result = filterChartDataByReleaseDate(ONE_MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_RHEL_DATA);
  });
  it('works as expected for empty RHEL array', () => {
    const result = filterChartDataByReleaseDate([], OTHER_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
});

describe('Retirement date filtering', () => {
  it('works as expected for streams', () => {
    const result = filterChartDataByRetirementDate(MOCK_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_STREAMS_DATA_BY_RETIREMENT_DATE);
  });
  it('works as expected for one stream value', () => {
    const result = filterChartDataByRetirementDate(ONE_MOCK_STREAM_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_STREAM_DATA);
  });
  it('works as expected for identical stream values', () => {
    const result = filterChartDataByRetirementDate(DUPLICATE_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(DUPLICATE_STREAMS_DATA);
  });
  it('works as expected for empty streams array', () => {
    const result = filterChartDataByRetirementDate([], DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
  it('works as expected for RHEL', () => {
    const result = filterChartDataByRetirementDate(MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_RHEL_DATA_BY_RETIREMENT_DATE);
  });
  it('works as expected for one RHEL value', () => {
    const result = filterChartDataByRetirementDate(ONE_MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_RHEL_DATA);
  });
  it('works as expected for identical RHEL values', () => {
    const result = filterChartDataByRetirementDate(DUPLICATE_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(DUPLICATE_RHEL_DATA);
  });
  it('works as expected for empty RHEL array', () => {
    const result = filterChartDataByRetirementDate([], OTHER_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
});

describe('Systems filtering', () => {
  it('works as expected for streams', () => {
    const result = filterChartDataBySystems(MOCK_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_STREAMS_DATA_BY_SYSTEMS);
  });
  it('works as expected for one stream value', () => {
    const result = filterChartDataBySystems(ONE_MOCK_STREAM_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_STREAM_DATA);
  });
  it('works as expected for identical stream values', () => {
    const result = filterChartDataBySystems(DUPLICATE_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(DUPLICATE_STREAMS_DATA);
  });
  it('works as expected for empty streams array', () => {
    const result = filterChartDataBySystems([], DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
  it('works as expected for RHEL', () => {
    const result = filterChartDataBySystems(MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_RHEL_DATA_BY_SYSTEMS);
  });
  it('works as expected for one RHEL value', () => {
    const result = filterChartDataBySystems(ONE_MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_RHEL_DATA);
  });
  it('works as expected for identical RHEL values', () => {
    const result = filterChartDataBySystems(DUPLICATE_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(DUPLICATE_RHEL_DATA);
  });
  it('works as expected for empty RHEL array', () => {
    const result = filterChartDataBySystems([], OTHER_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
});

describe('Release filtering', () => {
  it('works as expected for streams', () => {
    const result = filterChartDataByRelease(MOCK_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_STREAMS_DATA_BY_RELEASE);
  });
  it('works as expected for one stream value', () => {
    const result = filterChartDataByRelease(ONE_MOCK_STREAM_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_STREAM_DATA);
  });
  it('works as expected for identical stream values', () => {
    const result = filterChartDataByRelease(DUPLICATE_STREAMS_DATA, DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual(DUPLICATE_STREAMS_DATA);
  });
  it('works as expected for empty streams array', () => {
    const result = filterChartDataByRelease([], DEFAULT_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
  it('works as expected for RHEL', () => {
    const result = filterChartDataByRelease(MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(MOCK_RHEL_DATA_BY_RELEASE);
  });
  it('works as expected for one RHEL value', () => {
    const result = filterChartDataByRelease(ONE_MOCK_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(ONE_MOCK_RHEL_DATA);
  });
  it('works as expected for identical RHEL values', () => {
    const result = filterChartDataByRelease(DUPLICATE_RHEL_DATA, OTHER_DROPDOWN_VALUE);
    expect(result).toEqual(DUPLICATE_RHEL_DATA);
  });
  it('works as expected for empty RHEL array', () => {
    const result = filterChartDataByRelease([], OTHER_DROPDOWN_VALUE);
    expect(result).toEqual([]);
  });
});
