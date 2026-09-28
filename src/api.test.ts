import axios from 'axios';
import { ApiError, getAppStreamSystems, getRhelSystems, getUpcomingSystems } from './api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSystemsResponse = {
  status: 200,
  data: {
    meta: { count: 2, total: 10 },
    data: [
      { id: 'uuid-1', display_name: 'host-1', os_major: 9, os_minor: 2 },
      { id: 'uuid-2', display_name: 'host-2', os_major: 9, os_minor: 2 },
    ],
  },
};

describe('Systems API functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRhelSystems', () => {
    it('constructs correct URL with path params', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getRhelSystems(9, 2);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/roadmap/v2/relevant/lifecycle/rhel/9/2/systems',
        expect.any(Object)
      );
    });

    it('adds lifecycle_type param when not mainline', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getRhelSystems(8, 6, 'eus');

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain('lifecycle_type=eus');
    });

    it('omits lifecycle_type param when mainline', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getRhelSystems(9, 2, 'mainline');

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).not.toContain('lifecycle_type');
    });

    it('includes pagination and search params', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getRhelSystems(9, 2, 'mainline', {
        offset: 10,
        limit: 20,
        search: 'server',
      });

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain('offset=10');
      expect(calledUrl).toContain('limit=20');
      expect(calledUrl).toContain('search=server');
    });

    it('returns paginated response data', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      const result = await getRhelSystems(9, 2);

      expect(result.meta.total).toBe(10);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].display_name).toBe('host-1');
    });

    describe('unknown minor version compatibility', () => {
      const hosts = [
        { id: 'b', display_name: 'server-alpha', os_major: 9, os_minor: null },
        { id: 'c', display_name: 'server-beta', os_major: 9, os_minor: null },
        { id: 'a', display_name: 'server-alpha', os_major: 9, os_minor: null },
        { id: 'd', display_name: 'unmatched', os_major: 9, os_minor: null },
      ];
      const rows = [
        { major: 9, minor: 0, lifecycle_type: 'mainline', systems_detail: [{ ...hosts[0], id: 'wrong-minor' }] },
        {
          major: 8,
          minor: null,
          lifecycle_type: 'mainline',
          systems_detail: [{ ...hosts[0], id: 'wrong-major' }],
        },
        { major: 9, minor: null, lifecycle_type: 'EUS', systems_detail: [{ ...hosts[0], id: 'eus-host' }] },
        { major: 9, minor: null, lifecycle_type: 'mainline', systems_detail: hosts },
      ];

      beforeEach(() => {
        mockedAxios.get.mockResolvedValue({ status: 200, data: { data: rows } });
      });

      it('fetches existing v1 host details and matches the exact major, null minor and lifecycle', async () => {
        const result = await getRhelSystems(9, null);
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/roadmap/v1/relevant/lifecycle/rhel',
          expect.any(Object)
        );
        expect(result.meta).toEqual({ count: 4, total: 4 });
        expect(result.data.map((host) => host.id)).toEqual(['a', 'b', 'c', 'd']);
        expect(result.data.every((host) => host.os_minor === null)).toBe(true);
        expect((await getRhelSystems(9, null, 'EUS')).data.map((host) => host.id)).toEqual(['eus-host']);
      });

      it.each([
        { sort_order: 'asc' as const, expected: ['b', 'c'] },
        { sort_order: 'desc' as const, expected: ['b', 'a'] },
      ])(
        'searches before pagination and sorts $sort_order with a stable ID tie-break',
        async ({ sort_order, expected }) => {
          const result = await getRhelSystems(9, null, 'mainline', {
            offset: 1,
            limit: 2,
            search: 'SERVER',
            sort_order,
          });
          expect(result.meta).toEqual({ count: 2, total: 3 });
          expect(result.data.map((host) => host.id)).toEqual(expected);
          expect(hosts.map((host) => host.id)).toEqual(['b', 'c', 'a', 'd']);
        }
      );

      it('returns an empty page while retaining the filtered total for page correction', async () => {
        const result = await getRhelSystems(9, null, 'mainline', { offset: 20, limit: 10 });
        expect(result).toEqual({ meta: { count: 0, total: 4 }, data: [] });
      });

      it('returns an empty result if the matching row has disappeared', async () => {
        expect(await getRhelSystems(10, null)).toEqual({ meta: { count: 0, total: 0 }, data: [] });
      });

      it('propagates v1 authorization errors instead of treating them as empty results', async () => {
        mockedAxios.get.mockRejectedValue({ response: { data: { detail: 'Not authorized' }, status: 403 } });
        await expect(getRhelSystems(9, null)).rejects.toMatchObject({ name: 'ApiError', status_code: 403 });
      });

      it('keeps minor zero on the v2 path', async () => {
        mockedAxios.get.mockResolvedValue(mockSystemsResponse);
        await getRhelSystems(9, 0);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/roadmap/v2/relevant/lifecycle/rhel/9/0/systems',
          expect.any(Object)
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });
    });

    it('throws ApiError on server error with detail', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { data: { detail: 'Not found' }, status: 404 },
      });

      await expect(getRhelSystems(99, 99)).rejects.toThrow(ApiError);
      await expect(getRhelSystems(99, 99)).rejects.toThrow('Not found');
    });

    it('throws ApiError on network error', async () => {
      mockedAxios.get.mockRejectedValue({
        message: 'Network Error',
      });

      await expect(getRhelSystems(9, 2)).rejects.toThrow(ApiError);
      await expect(getRhelSystems(9, 2)).rejects.toThrow('Network Error');
    });
  });

  describe('getAppStreamSystems', () => {
    it('constructs correct URL with required params', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getAppStreamSystems('nginx', 9);

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain('/api/roadmap/v2/relevant/lifecycle/app-streams/systems');
      expect(calledUrl).toContain('name=nginx');
      expect(calledUrl).toContain('os_major=9');
    });

    it('includes os_minor when provided', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getAppStreamSystems('nginx', 9, 2);

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain('os_minor=2');
    });

    it('omits os_minor when null', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getAppStreamSystems('nginx', 9, null);

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).not.toContain('os_minor');
    });

    it('includes pagination and search params', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getAppStreamSystems('nginx', 9, 0, {
        offset: 5,
        limit: 10,
        search: 'host',
      });

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain('offset=5');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('search=host');
    });

    it('throws ApiError on failure', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { data: { detail: 'Server error' }, status: 500 },
      });

      await expect(getAppStreamSystems('nginx', 9)).rejects.toThrow(ApiError);
    });
  });

  describe('getUpcomingSystems', () => {
    it('constructs correct URL with required params', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getUpcomingSystems('Ruby 2.7 EOL', '9.0');

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain('/api/roadmap/v2/relevant/upcoming-changes/systems');
      expect(calledUrl).toContain('name=Ruby+2.7+EOL');
      expect(calledUrl).toContain('release=9.0');
    });

    it('includes pagination and search params', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getUpcomingSystems('Ruby 2.7 EOL', '9.0', {
        offset: 0,
        limit: 50,
        search: 'prod',
      });

      const calledUrl = mockedAxios.get.mock.calls[0][0];
      expect(calledUrl).toContain('offset=0');
      expect(calledUrl).toContain('limit=50');
      expect(calledUrl).toContain('search=prod');
    });

    it('throws ApiError on failure', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { data: { detail: 'Timeout' }, status: 504 },
      });

      await expect(getUpcomingSystems('Ruby 2.7 EOL', '9.0')).rejects.toThrow(ApiError);
    });
  });

  describe('DR_API base path', () => {
    it('uses v2 API prefix for all systems endpoints', async () => {
      mockedAxios.get.mockResolvedValue(mockSystemsResponse);

      await getRhelSystems(9, 2);
      expect(mockedAxios.get.mock.calls[0][0]).toMatch(/^\/api\/roadmap\/v2\//);

      await getAppStreamSystems('nginx', 9);
      expect(mockedAxios.get.mock.calls[1][0]).toMatch(/^\/api\/roadmap\/v2\//);

      await getUpcomingSystems('test', '9.0');
      expect(mockedAxios.get.mock.calls[2][0]).toMatch(/^\/api\/roadmap\/v2\//);
    });
  });
});
