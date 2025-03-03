import { To } from 'react-router-dom';
import Moment from 'moment';

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

export const formatDate = (date: string) => {
  if (date === 'Unknown') {
    return 'Not available';
  }
  return Moment(date).format('MMM YYYY');
}

// export const decodeURIComponent = (queryParam: string, query:string) => {
//   switch(query) {
//     case 'page': {

//     }
//   }
// };

//will need to pass in the name of the filter and valuw

export const buildURL = (filter1: string, filter1Value: string ,filter2: string = '', filter2Value: string = '') => {
  let encodedData = '';
  if (filter1) {
    encodedData += `${filter1}=${filter1Value}`;
  }
  if (filter2) {
    encodedData += `&${filter2}=${filter2Value}`;
  } 
  return encodedData;
};