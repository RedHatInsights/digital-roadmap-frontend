import axios from 'axios';
import { AxiosResponse } from 'axios';

import {
  DR_API,
  DR_LIFECYCLE_APPSTREAMS,
  DR_LIFECYCLE_SYSTEMS,
  DR_RELEASE_NOTES,
  DR_UPCOMING,
  INVENTORY_API_ROOT,
  INVENTORY_HOSTS_ROOT,
} from './constants';

/* Digital Roadmap */

export const getRelevantReleaseNotes = async (major: number, minor: number, keyword: string) => {
  const path = DR_API.concat(DR_RELEASE_NOTES).concat('/get-relevant-notes');
  const params = `?major=${major}&minor=${minor}&keywords=${keyword}`;
  const response = await axios.get(path.concat(params)).catch(function (error) {
    return error;
  });

  return getResponseOrError(response);
};

export const getUpcomingChanges = async () => {
  const path = DR_API.concat(DR_UPCOMING);
  const response = await axios.get(path).catch(function (error) {
    return error;
  });

  return getResponseOrError(response);
};

export const getLifecycleSystems = async () => {
  const path = DR_API.concat(DR_LIFECYCLE_SYSTEMS);
  const response = await axios.get(path).catch(function (error) {
    return error;
  });

  return getResponseOrError(response);
};

export const getLifecycleAppstreams = async () => {
  const path = DR_API.concat(DR_LIFECYCLE_APPSTREAMS);
  const response = await axios.get(path).catch(function (error) {
    return error;
  });

  return getResponseOrError(response);
};

/* Inventory */

export const inventoryFetchSystems = (path: string = '') => {
  return getInventory(INVENTORY_HOSTS_ROOT.concat(path));
};

export const inventoryFetchSystemsByIds = (ids: string[], path: string = '') => {
  return getInventory(INVENTORY_HOSTS_ROOT.concat('/').concat(ids.join(',')).concat(path));
};

const getInventory = async (path: string) => {
  const response = await axios.get(INVENTORY_API_ROOT.concat(path)).catch(function (error) {
    return error;
  });

  return getResponseOrError(response);
};

/* Common functions */

const getResponseOrError = (response: AxiosResponse) => {
  if (response.status === 200) {
    return response.data;
  } else {
    return response;
  }
};
