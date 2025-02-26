import { Stream } from '../../types/Stream';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';

export const DEFAULT_DROPDOWN_VALUE = 'RHEL 9 Application Streams';
export const DEFAULT_CHART_SORTBY_VALUE = 'Retirement date';
export const OTHER_DROPDOWN_VALUE = 'Red Hat Enterprise Linux';

export const filterChartDataByName = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      const aName = `${a.name.toLowerCase()} ${a.stream.toLowerCase()}`;
      const bName = `${b.name.toLowerCase()} ${b.stream.toLowerCase()}`;
      if (aName > bName) return -1;
      if (aName < bName) return 1;
      return 0;
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    const aName = `${a.name.toLowerCase()} ${a.major}.${a.minor}`;
    const bName = `${b.name.toLowerCase()} ${b.major}.${b.minor}`;
    if (aName > bName) return -1;
    if (aName < bName) return 1;
    return 0;
  });
};

export const filterChartDataByReleaseDate = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      if (a.start_date > b.start_date) return -1;
      if (a.start_date < b.start_date) return 1;
      return 0;
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    if (a.release_date > b.release_date) return -1;
    if (a.release_date < b.release_date) return 1;
    return 0;
  });
};

export const filterChartDataByRetirementDate = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      if (a.end_date > b.end_date) return -1;
      if (a.end_date < b.end_date) return 1;
      return 0;
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    if (a.retirement_date > b.retirement_date) return -1;
    if (a.retirement_date < b.retirement_date) return 1;
    return 0;
  });
};

export const filterChartDataByRelease = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      if (a.rhel_major_version > b.rhel_major_version) return -1;
      if (a.rhel_major_version < b.rhel_major_version) return 1;
      return 0;
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    const aVer = `${a.major}.${a.minor}`;
    const bVer = `${b.major}.${b.minor}`;
    if (aVer > bVer) return -1;
    if (aVer < bVer) return 1;
    return 0;
  });
};

export const filterChartDataBySystems = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      if (a.systems > b.systems) return -1;
      if (a.systems < b.systems) return 1;
      return 0;
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    if (a.systems > b.systems) return -1;
    if (a.systems < b.systems) return 1;
    return 0;
  });
};
