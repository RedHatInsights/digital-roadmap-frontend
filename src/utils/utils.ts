import { To } from 'react-router-dom';
import Moment from 'moment';
import { Filter } from '../Components/Lifecycle/Lifecycle';

export const linkBasename = '/insights/digital-roadmap';
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

export const formatDate = (date: string | undefined) => {
  if (date === 'Unknown' || date === null) {
    return 'Not available';
  }
  return Moment(date).format('MMM YYYY');
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
  return encodedData;
};
