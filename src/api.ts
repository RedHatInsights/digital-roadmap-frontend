import axios, { AxiosResponse } from 'axios';

import {
  DR_ALL_LIFECYCLE_APPSTREAMS,
  DR_ALL_LIFECYCLE_SYSTEMS,
  DR_ALL_UPCOMING,
  DR_API,
  DR_API_V1,
  DR_APP_STREAM_SYSTEMS,
  DR_RELEASE_NOTES,
  DR_RELEVANT_LIFECYCLE_APPSTREAMS,
  DR_RELEVANT_LIFECYCLE_SYSTEMS,
  DR_RELEVANT_UPCOMING,
  DR_RHEL_SYSTEMS,
  DR_UPCOMING_SYSTEMS,
} from './constants';
import { PaginatedSystemsResponse } from './types/PaginatedSystems';
import { SystemsQueryParams } from './types/SystemsQueryParams';
import { SystemLifecycleChanges } from './types/SystemLifecycleChanges';

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

export const getAllUpcomingChanges = async () => {
  const path = DR_API.concat(DR_ALL_UPCOMING);
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

export const getRelevantLifecycleSystems = async () => {
  const path = DR_API.concat(DR_RELEVANT_LIFECYCLE_SYSTEMS);
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

export const getRelevantLifecycleAppstreams = async () => {
  const path = DR_API.concat(DR_RELEVANT_LIFECYCLE_APPSTREAMS);
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

/* Systems (on-demand host detail endpoints) */

export const getRhelSystems = async (
  major: number,
  minor: number | null,
  lifecycleType: string = 'mainline',
  params: SystemsQueryParams = {}
): Promise<PaginatedSystemsResponse> => {
  if (minor === null) {
    // The v2 detail route requires an integer minor. Reuse v1 only on demand for
    // these rows until v2 supports unknown minor versions; null is not minor zero.
    const response: { data: SystemLifecycleChanges[] } = await getV1RelevantLifecycleSystems();
    const row = response.data.find(
      (item) => item.major === major && item.minor === null && item.lifecycle_type === lifecycleType
    );
    const search = params.search?.toLowerCase();
    const systems = (row?.systems_detail ?? [])
      .filter((host) => !search || host.display_name.toLowerCase().includes(search))
      .map((host) => ({ ...host, os_major: major, os_minor: null }))
      .sort((a, b) => {
        const order = a.display_name.localeCompare(b.display_name) || a.id.localeCompare(b.id);
        return params.sort_order === 'desc' ? -order : order;
      });
    const offset = params.offset ?? 0;
    const data = systems.slice(offset, offset + (params.limit ?? 10));
    return { meta: { count: data.length, total: systems.length }, data };
  }

  const path = `${DR_API}${DR_RHEL_SYSTEMS}/${major}/${minor}/systems`;
  const queryParams = new URLSearchParams();
  if (lifecycleType !== 'mainline') queryParams.set('lifecycle_type', lifecycleType);
  if (params.offset !== undefined) queryParams.set('offset', String(params.offset));
  if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);
  if (params.sort_order) queryParams.set('sort_order', params.sort_order);
  const queryString = queryParams.toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  const response = await axios
    .get(fullPath, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response?.data?.detail) {
        throw new ApiError(error.response.data.detail, error.response.status);
      } else if (error.request?.response) {
        throw new ApiError(error.request.response, error.request.status);
      } else {
        throw new ApiError(error.message);
      }
    });
  return getResponseOrError(response);
};

export const getAppStreamSystems = async (
  name: string,
  osMajor: number,
  osMinor?: number | null,
  params: SystemsQueryParams = {}
): Promise<PaginatedSystemsResponse> => {
  const path = `${DR_API}${DR_APP_STREAM_SYSTEMS}`;
  const queryParams = new URLSearchParams();
  queryParams.set('name', name);
  queryParams.set('os_major', String(osMajor));
  if (osMinor !== undefined && osMinor !== null) queryParams.set('os_minor', String(osMinor));
  if (params.offset !== undefined) queryParams.set('offset', String(params.offset));
  if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);
  if (params.sort_order) queryParams.set('sort_order', params.sort_order);
  const fullPath = `${path}?${queryParams.toString()}`;
  const response = await axios
    .get(fullPath, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response?.data?.detail) {
        throw new ApiError(error.response.data.detail, error.response.status);
      } else if (error.request?.response) {
        throw new ApiError(error.request.response, error.request.status);
      } else {
        throw new ApiError(error.message);
      }
    });
  return getResponseOrError(response);
};

export const getUpcomingSystems = async (
  name: string,
  release: string,
  params: SystemsQueryParams = {}
): Promise<PaginatedSystemsResponse> => {
  const path = `${DR_API}${DR_UPCOMING_SYSTEMS}`;
  const queryParams = new URLSearchParams();
  queryParams.set('name', name);
  queryParams.set('release', release);
  if (params.offset !== undefined) queryParams.set('offset', String(params.offset));
  if (params.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);
  if (params.sort_order) queryParams.set('sort_order', params.sort_order);
  const fullPath = `${path}?${queryParams.toString()}`;
  const response = await axios
    .get(fullPath, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response?.data?.detail) {
        throw new ApiError(error.response.data.detail, error.response.status);
      } else if (error.request?.response) {
        throw new ApiError(error.request.response, error.request.status);
      } else {
        throw new ApiError(error.message);
      }
    });
  return getResponseOrError(response);
};

// TODO: Replace these v1 fallback functions with a dedicated v2 export endpoint (RHINENG-31151/31152).
// Currently the export fetches v1 data (which includes full systems_detail arrays) to produce per-host CSV rows.
// Keep getV1RelevantLifecycleSystems and DR_API_V1 until v2 also supports unknown-minor RHEL host details.
// The other getV1* helpers can be removed once the v2 export endpoint is available.

export const getV1RelevantLifecycleSystems = async () => {
  const path = DR_API_V1.concat(DR_RELEVANT_LIFECYCLE_SYSTEMS);
  const response = await axios
    .get(path, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response?.data?.detail) {
        throw new ApiError(error.response.data.detail, error.response.status);
      } else if (error.request?.response) {
        throw new ApiError(error.request.response, error.request.status);
      } else {
        throw new ApiError(error.message);
      }
    });
  return getResponseOrError(response);
};

export const getV1RelevantLifecycleAppstreams = async () => {
  const path = DR_API_V1.concat(DR_RELEVANT_LIFECYCLE_APPSTREAMS);
  const response = await axios
    .get(path, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response?.data?.detail) {
        throw new ApiError(error.response.data.detail, error.response.status);
      } else if (error.request?.response) {
        throw new ApiError(error.request.response, error.request.status);
      } else {
        throw new ApiError(error.message);
      }
    });
  return getResponseOrError(response);
};

export const getV1AllLifecycleSystems = async () => {
  const path = DR_API_V1.concat(DR_ALL_LIFECYCLE_SYSTEMS);
  const response = await axios
    .get(path, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response?.data?.detail) {
        throw new ApiError(error.response.data.detail, error.response.status);
      } else if (error.request?.response) {
        throw new ApiError(error.request.response, error.request.status);
      } else {
        throw new ApiError(error.message);
      }
    });
  return getResponseOrError(response);
};

export const getV1AllLifecycleAppstreams = async () => {
  const path = DR_API_V1.concat(DR_ALL_LIFECYCLE_APPSTREAMS);
  const response = await axios
    .get(path, {
      validateStatus: function (status) {
        return status === 200;
      },
    })
    .catch(function (error) {
      if (error.response?.data?.detail) {
        throw new ApiError(error.response.data.detail, error.response.status);
      } else if (error.request?.response) {
        throw new ApiError(error.request.response, error.request.status);
      } else {
        throw new ApiError(error.message);
      }
    });
  return getResponseOrError(response);
};

/* Common functions */

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
