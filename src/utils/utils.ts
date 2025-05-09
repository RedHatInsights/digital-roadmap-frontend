import { To } from 'react-router-dom';
import { Filter } from '../types/Filter';

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
  if (filter['viewFilter']) {
    encodedData += `&viewFilter=${filter['viewFilter']}`;
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

export const getNewChartName = (name: string, major: number, minor: number, lifecycleType: string) => {
  const lifecycleText = getLifecycleType(lifecycleType);
  return `${name} ${lifecycleText}`;
};
