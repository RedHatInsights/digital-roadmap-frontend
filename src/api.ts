import axios, { AxiosResponse } from 'axios';

import {
  DR_ALL_LIFECYCLE_APPSTREAMS,
  DR_ALL_LIFECYCLE_SYSTEMS,
  DR_API,
  DR_LIFECYCLE_HOST_UUIDS,
  DR_RELEASE_NOTES,
  DR_RELEVANT_LIFECYCLE_APPSTREAMS_HOSTS,
  DR_RELEVANT_LIFECYCLE_SYSTEMS_HOSTS,
  DR_RELEVANT_UPCOMING,
  DR_RELEVANT_UPCOMING_HOSTS,
  INVENTORY_API_ROOT,
  INVENTORY_HOSTS_ROOT,
} from './constants';
import { AppstreamLoadProgress, loadRelevantLifecycleAppstreams } from './utils/relevantAppstreamsLoader';
import { RhelLoadProgress, loadRelevantLifecycleSystems } from './utils/relevantRhelLoader';
import { UpcomingLoadProgress, loadAllUpcomingChanges } from './utils/relevantUpcomingLoader';

/* Digital Roadmap */

export class ApiError extends Error {
  name: string;
  status_code?: number;

  constructor(message: string, status_code?: number) {
    super(message);
    this.name = 'ApiError';
    this.status_code = status_code;
  }
}

type AccessibleHostUuidsResponse = {
  meta: { count: number; total: number };
  data: string[];
};

export const getRelevantReleaseNotes = async (major: number, minor: number, keyword: string) => {
  const path = DR_API.concat(DR_RELEASE_NOTES).concat('/get-relevant-notes');
  const params = `?major=${major}&minor=${minor}&keywords=${keyword}`;
  const response = await axios
    .get(path.concat(params), {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response.data.detail) {
        if (error.response.status) {
          throw new ApiError(error.response.data.detail, error.response.status);
        }
        throw new ApiError(error.response.data.detail);
      } else if (error.request.response) {
        if (error.request.status) {
          throw new ApiError(error.request.response, error.request.status);
        }
        throw new ApiError(error.request.response);
      } else if (error.detail) {
        throw new ApiError(error.detail);
      } else {
        throw new ApiError(error.message);
      }
    });

  return getResponseOrError(response);
};

export const getUpcomingChangesForHosts = async (hostIds: string[]) => {
  return requestBackend('post', DR_API.concat(DR_RELEVANT_UPCOMING_HOSTS), {
    host_ids: hostIds,
  });
};

export const getAllUpcomingChanges = (
  hostIds: string[],
  onProgress?: (progress: UpcomingLoadProgress) => void
) => {
  return loadAllUpcomingChanges(hostIds, { getUpcomingChangesForHosts }, onProgress);
};

export const getRelevantUpcomingChanges = async () => {
  const path = DR_API.concat(DR_RELEVANT_UPCOMING);
  const response = await axios
    .get(path, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response.data.detail) {
        if (error.response.status) {
          throw new ApiError(error.response.data.detail, error.response.status);
        }
        throw new ApiError(error.response.data.detail);
      } else if (error.request.response) {
        if (error.request.status) {
          throw new ApiError(error.request.response, error.request.status);
        }
        throw new ApiError(error.request.response);
      } else if (error.detail) {
        throw new ApiError(error.detail);
      } else {
        throw new ApiError(error.message);
      }
    });

  return getResponseOrError(response);
};

export const getRelevantLifecycleSystemsForHosts = async (hostIds: string[]) => {
  return requestBackend('post', DR_API.concat(DR_RELEVANT_LIFECYCLE_SYSTEMS_HOSTS), {
    host_ids: hostIds,
  });
};

export const getRelevantLifecycleSystems = (
  hostIds: string[],
  onProgress?: (progress: RhelLoadProgress) => void
) => {
  return loadRelevantLifecycleSystems(hostIds, { getRelevantLifecycleSystemsForHosts }, onProgress);
};

export const getAllLifecycleSystems = async () => {
  const path = DR_API.concat(DR_ALL_LIFECYCLE_SYSTEMS);
  const response = await axios
    .get(path, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response.data.detail) {
        if (error.response.status) {
          throw new ApiError(error.response.data.detail, error.response.status);
        }
        throw new ApiError(error.response.data.detail);
      } else if (error.request.response) {
        if (error.request.status) {
          throw new ApiError(error.request.response, error.request.status);
        }
        throw new ApiError(error.request.response);
      } else if (error.detail) {
        throw new ApiError(error.detail);
      } else {
        throw new ApiError(error.message);
      }
    });
  return getResponseOrError(response);
};

export const getAccessibleHostUuids = async (): Promise<AccessibleHostUuidsResponse> => {
  return requestBackend('get', DR_API.concat(DR_LIFECYCLE_HOST_UUIDS));
};

export const getRelevantLifecycleAppstreamsForHosts = async (hostIds: string[]) => {
  return requestBackend('post', DR_API.concat(DR_RELEVANT_LIFECYCLE_APPSTREAMS_HOSTS), {
    host_ids: hostIds,
  });
};

export const getRelevantLifecycleAppstreams = (
  hostIds: string[],
  onProgress?: (progress: AppstreamLoadProgress) => void
) => {
  return loadRelevantLifecycleAppstreams(hostIds, { getRelevantLifecycleAppstreamsForHosts }, onProgress);
};

export const getAllLifecycleAppstreams = async () => {
  const path = DR_API.concat(DR_ALL_LIFECYCLE_APPSTREAMS);
  const response = await axios
    .get(path, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response.data.detail) {
        if (error.response.status) {
          throw new ApiError(error.response.data.detail, error.response.status);
        }
        throw new ApiError(error.response.data.detail);
      } else if (error.request.response) {
        if (error.request.status) {
          throw new ApiError(error.request.response, error.request.status);
        }
        throw new ApiError(error.request.response);
      } else if (error.detail) {
        throw new ApiError(error.detail);
      } else {
        throw new ApiError(error.message);
      }
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

const detailMessage = (detail: unknown) => (typeof detail === 'string' ? detail : String(detail));

const throwAsApiError = (error: unknown): never => {
  const roadmapError = (error ?? {}) as {
    response?: { data?: { detail?: unknown }; status?: number };
    request?: { response?: string; status?: number };
    detail?: unknown;
    message?: string;
  };

  if (roadmapError.response?.data?.detail) {
    const message = detailMessage(roadmapError.response.data.detail);
    if (roadmapError.response.status) {
      throw new ApiError(message, roadmapError.response.status);
    }
    throw new ApiError(message);
  } else if (roadmapError.request?.response) {
    if (roadmapError.request.status) {
      throw new ApiError(roadmapError.request.response, roadmapError.request.status);
    }
    throw new ApiError(roadmapError.request.response);
  } else if (roadmapError.detail) {
    throw new ApiError(detailMessage(roadmapError.detail));
  } else {
    // A 4xx/5xx with an empty body still has response.status. Without it, retry logic treats the call as a network failure.
    throw new ApiError(roadmapError.message ?? 'Unknown error', roadmapError.response?.status);
  }
};

const requestBackend = async (method: 'get' | 'post', path: string, body?: unknown) => {
  try {
    const response = await axios.request({
      method,
      url: path,
      data: body,
      validateStatus: function (status) {
        return status === 200;
      },
    });
    return getResponseOrError(response);
  } catch (error) {
    throwAsApiError(error);
  }
};

const getResponseOrError = (response: AxiosResponse) => {
  if (response.status === 200) {
    return response.data;
  } else {
    // This shouldn't happen and should be handled by the validateStatus.
    // But in case this is called from function without implemented validateStatus,
    // this will handle the problem in some basic manner.
    throw new Error(String(response));
  }
};
