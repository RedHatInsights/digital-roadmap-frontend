import { Stream } from '../../types/Stream';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { getNewChartName } from '../../utils/utils';

export const DEFAULT_DROPDOWN_VALUE = 'RHEL 9 Application Streams';
export const DEFAULT_CHART_SORTBY_VALUE = 'Retirement date';
export const RHEL_8_STREAMS_DROPDOWN_VALUE = 'RHEL 8 Application Streams';
export const RHEL_SYSTEMS_DROPDOWN_VALUE = 'Red Hat Enterprise Linux';

export const filterChartDataByName = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      return b.display_name.localeCompare(a.display_name, undefined, { numeric: true });
    });
  }
  if (dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      return b.display_name.localeCompare(a.display_name, undefined, { numeric: true });
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    return b.display_name.localeCompare(a.display_name, undefined, { numeric: true });
  });
};

export const filterChartDataByReleaseDate = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      const aStart = new Date(a.start_date);
      const bStart = new Date(b.start_date);

      if (aStart.getTime() > bStart.getTime()) return -1;
      if (aStart.getTime() < bStart.getTime()) return 1;
      return 0;
    });
  }
  if (dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      const aStart = new Date(a.start_date);
      const bStart = new Date(b.start_date);

      if (aStart.getTime() > bStart.getTime()) return -1;
      if (aStart.getTime() < bStart.getTime()) return 1;
      return 0;
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    const aStart = new Date(a.start_date);
    const bStart = new Date(b.start_date);

    if (aStart.getTime() > bStart.getTime()) return -1;
    if (aStart.getTime() < bStart.getTime()) return 1;
    return 0;
  });
};

export const filterChartDataByRetirementDate = (
  data: Stream[] | SystemLifecycleChanges[],
  dropdownValue: string
) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      const aEnd = new Date(a.end_date);
      const bEnd = new Date(b.end_date);
      if (aEnd.getTime() > bEnd.getTime()) return -1;
      if (aEnd.getTime() < bEnd.getTime()) return 1;
      return 0;
    });
  }
  if (dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      const aEnd = new Date(a.end_date);
      const bEnd = new Date(b.end_date);
      if (aEnd.getTime() > bEnd.getTime()) return -1;
      if (aEnd.getTime() < bEnd.getTime()) return 1;
      return 0;
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    const aEnd = new Date(a.end_date);
    const bEnd = new Date(b.end_date);
    if (aEnd.getTime() > bEnd.getTime()) return -1;
    if (aEnd.getTime() < bEnd.getTime()) return 1;
    return 0;
  });
};

export const filterChartDataByRelease = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      if (a.os_major > b.os_major) return -1;
      if (a.os_major < b.os_major) return 1;
      // If os_major is equal, compare os_minor
      if (a.os_minor > b.os_minor) return -1;
      if (a.os_minor < b.os_minor) return 1;
      return 0;
    });
  }
  if (dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      if (a.os_major > b.os_major) return -1;
      if (a.os_major < b.os_major) return 1;
      // If os_major is equal, compare os_minor
      if (a.os_minor > b.os_minor) return -1;
      if (a.os_minor < b.os_minor) return 1;
      return 0;
    });
  }
  // Using full RHEL name comparison instead of major and minor so we can also take into account the lifecycle type
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    return b.display_name.localeCompare(a.display_name, undefined, { numeric: true });
  });
};

export const filterChartDataBySystems = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
  if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      if (a.count < b.count) return -1;
      if (a.count > b.count) return 1;
      return 0;
    });
  }
  if (dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      if (a.count < b.count) return -1;
      if (a.count > b.count) return 1;
      return 0;
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    if (a.count < b.count) return -1;
    if (a.count > b.count) return 1;
    return 0;
  });
};
