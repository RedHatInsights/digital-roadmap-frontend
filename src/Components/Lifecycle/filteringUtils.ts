import { Stream } from '../../types/Stream';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';

export const DEFAULT_DROPDOWN_VALUE = 'RHEL 9 Application Streams';
export const DEFAULT_CHART_SORTBY_VALUE = 'Retirement date';
export const RHEL_8_STREAMS_DROPDOWN_VALUE = 'RHEL 8 Application Streams';
export const RHEL_10_STREAMS_DROPDOWN_VALUE = 'RHEL 10 Application Streams';
export const RHEL_SYSTEMS_DROPDOWN_VALUE = 'Red Hat Enterprise Linux';

export const filterChartDataByName = (
  data: Stream[] | SystemLifecycleChanges[],
  dropdownValue: string,
  order: string = 'desc'
) => {
  // Needed to be able to switch order from ascending to descending
  const order_control = order === 'desc' ? 1 : -1;

  if (
    [DEFAULT_DROPDOWN_VALUE, RHEL_8_STREAMS_DROPDOWN_VALUE, RHEL_10_STREAMS_DROPDOWN_VALUE].includes(dropdownValue)
  ) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      return order_control * b.display_name.localeCompare(a.display_name, undefined, { numeric: true });
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    return order_control * b.display_name.localeCompare(a.display_name, undefined, { numeric: true });
  });
};

export const filterChartDataByReleaseDate = (
  data: Stream[] | SystemLifecycleChanges[],
  dropdownValue: string,
  order: string = 'desc'
) => {
  // Needed to be able to switch order from ascending to descending
  const order_control = order === 'desc' ? 1 : -1;

  if (
    [DEFAULT_DROPDOWN_VALUE, RHEL_8_STREAMS_DROPDOWN_VALUE, RHEL_10_STREAMS_DROPDOWN_VALUE].includes(dropdownValue)
  ) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      const aStart = new Date(a.start_date);
      const bStart = new Date(b.start_date);

      return order_control * (bStart.getTime() - aStart.getTime());
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    const aStart = new Date(a.start_date);
    const bStart = new Date(b.start_date);

    return order_control * (bStart.getTime() - aStart.getTime());
  });
};

export const filterChartDataByRetirementDate = (
  data: Stream[] | SystemLifecycleChanges[],
  dropdownValue: string,
  order: string = 'desc'
) => {
  // Needed to be able to switch order from ascending to descending
  const order_control = order === 'desc' ? 1 : -1;

  if (
    [DEFAULT_DROPDOWN_VALUE, RHEL_8_STREAMS_DROPDOWN_VALUE, RHEL_10_STREAMS_DROPDOWN_VALUE].includes(dropdownValue)
  ) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      return order_control * (new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
    });
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    const aEnd = new Date(a.end_date);
    const bEnd = new Date(b.end_date);
    return order_control * (bEnd.getTime() - aEnd.getTime());
  });
};

export const filterChartDataByRelease = (
  data: Stream[] | SystemLifecycleChanges[],
  dropdownValue: string,
  order: string = 'desc'
) => {
  // Needed to be able to switch order from ascending to descending
  const order_control = order === 'desc' ? 1 : -1;

  if (
    [DEFAULT_DROPDOWN_VALUE, RHEL_8_STREAMS_DROPDOWN_VALUE, RHEL_10_STREAMS_DROPDOWN_VALUE].includes(dropdownValue)
  ) {
    return (data as Stream[]).sort((a: Stream, b: Stream) => {
      // Compare major versions first
      const majorDiff = b.os_major - a.os_major;
      // If major versions are equal, compare minor versions
      const minorDiff = b.os_minor - a.os_minor;
      return order_control * (majorDiff || minorDiff);
    });
  }
  // Using full RHEL name comparison instead of major and minor so we can also take into account the lifecycle type
  return (data as SystemLifecycleChanges[]).sort((a, b) => {
    return order_control * b.display_name.localeCompare(a.display_name, undefined, { numeric: true });
  });
};

export const filterChartDataBySystems = (
  data: Stream[] | SystemLifecycleChanges[],
  dropdownValue: string,
  order: string = 'asc'
) => {
  // Needed to be able to switch order from ascending to descending
  const order_control = order === 'asc' ? 1 : -1;

  if (
    [DEFAULT_DROPDOWN_VALUE, RHEL_8_STREAMS_DROPDOWN_VALUE, RHEL_10_STREAMS_DROPDOWN_VALUE].includes(dropdownValue)
  ) {
    return (data as Stream[]).sort((a, b) => order_control * (a.count - b.count));
  }
  return (data as SystemLifecycleChanges[]).sort((a, b) => order_control * (a.count - b.count));
};
