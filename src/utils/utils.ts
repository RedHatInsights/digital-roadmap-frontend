import * as React from 'react';
import { To } from 'react-router-dom';
import { Filter } from '../types/Filter';
import { Stream } from '../types/Stream';
import { SystemLifecycleChanges } from '../types/SystemLifecycleChanges';

export const KNOWN_TYPES = ['Addition', 'Enhancement', 'Change', 'Deprecation'] as const;

// default for upcoming only
export const DEFAULT_FILTERS = {
  name: '',
};

export const linkBasename = '/insights/roadmap';
export const mergeToBasename = (to: To, basename: string): To => {
  if (typeof to === 'string') {
    // replace possible "//" after basename
    return `${basename}/${to}`.replace(`^${basename}//`, '');
  }

  return {
    ...to,
    pathname: `${basename}/${to.pathname}`.replace(`^${basename}//`, ''),
  };
};

/** This function is a helper for pluralizing strings, borrowed from PatternFly 6
 *
 * @param {number} i The quantity of the string you want to pluralize
 * @param {string} singular The singular version of the string
 * @param {string} plural The change to the string that should occur if the quantity is not equal to 1.
 *                 Defaults to adding an 's'.
 */
export function pluralize(i: number, singular: string, plural?: string) {
  if (!plural) {
    plural = `${singular}s`;
  }
  return `${i === 1 ? singular : plural}`;
}

export const formatDate = (date: string | null) => {
  if (date === 'Unknown' || date === null) {
    return 'Not available';
  }
  const dateAsDate = new Date(date);
  return dateAsDate?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
};

export const checkValidityOfQueryParam = (queryParam: string, queryValue: string) => {
  switch (queryParam) {
    case 'sortByQueryParam': {
      if (['Retirement date', 'Name', 'Release version', 'Release date', 'Systems'].includes(queryValue)) {
        return true;
      } else {
        return false;
      }
    }
  }
};

export const buildURL = (filter: Filter) => {
  let encodedData = '';
  if (filter['name']) {
    encodedData += `name=${filter['name']}`;
  }
  if (filter['lifecycleDropdown']) {
    encodedData += `&lifecycleDropdown=${filter['lifecycleDropdown']}`;
  }
  if (filter['chartSortBy']) {
    encodedData += `&chartSortBy=${filter['chartSortBy']}`;
  }
  if (filter['chartOrder']) {
    encodedData += `&chartOrder=${filter['chartOrder']}`;
  }
  if (filter['viewFilter']) {
    encodedData += `&viewFilter=${filter['viewFilter']}`;
  }
  if (filter['versions'] && filter['versions'].length > 0) {
    encodedData += `&versions=${filter['versions'].join(',')}`;
  }
  if (filter['statuses'] && filter['statuses'].length > 0) {
    encodedData += `&statuses=${filter['statuses'].join(',')}`;
  }
  if (filter['type'] && filter['type'].size > 0) {
    encodedData += `&type=${Array.from(filter['type']).join(',')}`;
  }
  if (filter['date']) {
    encodedData += `&date=${filter['date']}`;
  }
  if (filter['release'] && filter['release'].length > 0) {
    encodedData += `&release=${filter['release'].join(',')}`;
  }
  if (filter['addedToRoadmap']) {
    encodedData += `&addedToRoadmap=${filter['addedToRoadmap']}`;
  }
  return encodedData;
};

export const getLifecycleType = (lifecycleType: string) => {
  switch (lifecycleType) {
    case 'EUS':
      return ' EUS';
    case 'ELS':
      return ' ELS';
    case 'E4S':
      return ' for SAP';
    default:
      return '';
  }
};

export const getNewName = (name: string, major: number, minor: number, lifecycleType: string) => {
  const lifecycleText = getLifecycleType(lifecycleType);
  return `${name} ${major}.${minor}${lifecycleText}`;
};

export const buildExportData = (
  filteredTableData: Stream[] | SystemLifecycleChanges[],
  lifecycleDropdownValue: string,
  appStreamDropdownValues: string[]
): { [key: string]: string | number }[] => {
  const data: { [key: string]: string | number }[] = [];
  if (appStreamDropdownValues.includes(lifecycleDropdownValue)) {
    (filteredTableData as Stream[]).forEach((stream: Stream) => {
      const hosts = stream.systems_detail ?? [];
      if (hosts.length > 0) {
        hosts.forEach((host, index) => {
          data.push({
            appstream_module: stream.display_name,
            hostname: host.display_name,
            host_id: host.id,
            release: stream.os_major,
            release_date: formatDate(stream.start_date),
            retirement_date: formatDate(stream.end_date),
            lifecycle_status: stream.support_status,
            rhel_version: `${stream.os_major}.${stream.os_minor}`,
            system_index: `${index + 1} of ${stream.count}`,
          });
        });
      } else {
        data.push({
          appstream_module: stream.display_name,
          release: stream.os_major,
          release_date: formatDate(stream.start_date),
          retirement_date: formatDate(stream.end_date),
          lifecycle_status: stream.support_status,
          rhel_version: `${stream.os_major}.${stream.os_minor}`,
        });
      }
    });
  } else {
    (filteredTableData as SystemLifecycleChanges[]).forEach((item: SystemLifecycleChanges) => {
      const hosts = item.systems_detail ?? [];
      if (hosts.length > 0) {
        hosts.forEach((host, index) => {
          data.push({
            hostname: host.display_name,
            host_id: host.id,
            release: item.name,
            release_date: formatDate(item.start_date),
            retirement_date: formatDate(item.end_date),
            lifecycle_status: item.support_status,
            rhel_version: `${item.major}.${item.minor}`,
            system_index: `${index + 1} of ${item.count}`,
          });
        });
      } else {
        data.push({
          release: item.name,
          release_date: formatDate(item.start_date),
          retirement_date: formatDate(item.end_date),
          lifecycle_status: item.support_status,
          rhel_version: `${item.major}.${item.minor}`,
        });
      }
    });
  }
  return data;
};

export const getNewChartName = (name: string, major: number, minor: number, lifecycleType: string) => {
  const lifecycleText = getLifecycleType(lifecycleType);
  return `${name} ${lifecycleText}`;
};

export const mapSupportTypeToDisplayName = (supportType: string, dataType: string): string => {
  if (supportType === 'Near retirement') {
    // Map to the appropriate display name based on data type
    if (dataType === 'appLifecycle') {
      return 'Support ends within 6 months';
    } else {
      return 'Support ends within 3 months';
    }
  }
  // Return the original support type for all other cases
  return supportType;
};

// QE: Custom hook to add data attributes to rendered bar elements
export const useChartDataAttributes = (
  chartContainerRef: React.RefObject<HTMLDivElement>,
  legendNames: Array<{ packageType: string; datapoints: Array<{ name: string }> }>,
  hiddenSeries: Set<any>,
  renderKey?: number
) => {
  React.useEffect(() => {
    if (!chartContainerRef.current) return;

    const addDataAttributes = () => {
      const chartContainer = chartContainerRef.current;
      if (!chartContainer) return;

      // Find all path elements that represent bars
      const allPathElements = chartContainer.querySelectorAll('path[role="presentation"]');

      if (allPathElements.length === 0) {
        return false; // Indicates we need to try again
      }

      let pathIndex = 0;

      // Iterate through series to map data attributes
      legendNames.forEach((series, seriesIndex) => {
        if (hiddenSeries.has(seriesIndex) || series.datapoints.length === 0) {
          return;
        }

        // Get unique stream names for this series
        const streamNames = Array.from(new Set(series.datapoints.map((d) => d.name))).join(', ');

        // Add data attributes to each path element in this series
        series.datapoints.forEach((datapoint, datapointIndex) => {
          if (pathIndex < allPathElements.length) {
            const pathElement = allPathElements[pathIndex];
            pathElement.setAttribute('data-stream-names', streamNames);
            pathElement.setAttribute('data-package-type', series.packageType);
            pathElement.setAttribute('data-stream-name', datapoint.name);
            pathIndex++;
          }
        });
      });

      return true; // Indicates success
    };

    // Try immediately
    if (addDataAttributes()) {
      return;
    }

    // If immediate attempt failed, use MutationObserver
    const observer = new MutationObserver((mutations) => {
      let shouldTryAgain = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldTryAgain = true;
        }
      });

      if (shouldTryAgain && addDataAttributes()) {
        observer.disconnect();
      }
    });

    observer.observe(chartContainerRef.current, {
      childList: true,
      subtree: true,
    });

    // Cleanup observer after 5 seconds
    const timeoutId = setTimeout(() => {
      observer.disconnect();
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [chartContainerRef, legendNames, hiddenSeries, renderKey]);
};
