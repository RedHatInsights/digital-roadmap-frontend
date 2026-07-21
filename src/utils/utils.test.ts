import { renderHook } from '@testing-library/react';
import { buildExportData, useChartDataAttributes } from './utils';
import { Stream } from '../types/Stream';
import { SystemLifecycleChanges } from '../types/SystemLifecycleChanges';

// Mock DOM elements
class MockElement {
  attributes: Record<string, string> = {};

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  }

  getAttribute(name: string) {
    return this.attributes[name];
  }
}

// Mock MutationObserver
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

class MockMutationObserver {
  constructor(callback: MutationCallback) {
    this.callback = callback;
  }

  callback: MutationCallback;
  observe = mockObserve;
  disconnect = mockDisconnect;
}

global.MutationObserver = MockMutationObserver as any;

// Mock setTimeout
const mockSetTimeout = jest.fn();
global.setTimeout = mockSetTimeout as any;

describe('useChartDataAttributes', () => {
  let mockChartContainer: HTMLDivElement;
  let mockPathElements: MockElement[];

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock DOM elements
    mockPathElements = [new MockElement(), new MockElement(), new MockElement()];

    mockChartContainer = {
      querySelectorAll: jest.fn().mockReturnValue(mockPathElements),
    } as any;
  });

  const mockLegendNames = [
    {
      packageType: 'Supported',
      datapoints: [{ name: 'Stream 1' }, { name: 'Stream 2' }],
    },
    {
      packageType: 'Retired',
      datapoints: [{ name: 'Stream 3' }],
    },
  ];

  const mockHiddenSeries = new Set<number>();
  const mockRenderKey = 1;

  it('should be a function', () => {
    expect(typeof useChartDataAttributes).toBe('function');
  });

  it('should not throw when called with valid parameters', () => {
    const mockRef = { current: mockChartContainer };

    expect(() => {
      renderHook(() => useChartDataAttributes(mockRef, mockLegendNames, mockHiddenSeries, mockRenderKey));
    }).not.toThrow();
  });

  it('should handle null chart container ref', () => {
    const mockRef = { current: null };

    expect(() => {
      renderHook(() => useChartDataAttributes(mockRef, mockLegendNames, mockHiddenSeries, mockRenderKey));
    }).not.toThrow();
  });

  it('should handle empty legend names array', () => {
    const mockRef = { current: mockChartContainer };

    expect(() => {
      renderHook(() => useChartDataAttributes(mockRef, [], mockHiddenSeries, mockRenderKey));
    }).not.toThrow();
  });

  it('should handle hidden series', () => {
    const mockRef = { current: mockChartContainer };
    const hiddenSeries = new Set([0]); // Hide first series

    expect(() => {
      renderHook(() => useChartDataAttributes(mockRef, mockLegendNames, hiddenSeries, mockRenderKey));
    }).not.toThrow();
  });

  it('should handle series with no datapoints', () => {
    const mockRef = { current: mockChartContainer };
    const legendNamesWithEmpty = [
      {
        packageType: 'Supported',
        datapoints: [],
      },
      {
        packageType: 'Retired',
        datapoints: [{ name: 'Stream 3' }],
      },
    ];

    expect(() => {
      renderHook(() => useChartDataAttributes(mockRef, legendNamesWithEmpty, mockHiddenSeries, mockRenderKey));
    }).not.toThrow();
  });

  it('should handle duplicate stream names', () => {
    const mockRef = { current: mockChartContainer };
    const legendNamesWithDuplicates = [
      {
        packageType: 'Supported',
        datapoints: [
          { name: 'Stream 1' },
          { name: 'Stream 1' }, // Duplicate
          { name: 'Stream 2' },
        ],
      },
    ];

    expect(() => {
      renderHook(() =>
        useChartDataAttributes(mockRef, legendNamesWithDuplicates, mockHiddenSeries, mockRenderKey)
      );
    }).not.toThrow();
  });

  it('should handle chart container with no elements', () => {
    const mockChartContainerNoElements = {
      querySelectorAll: jest.fn().mockReturnValue([]),
    } as any;

    const mockRef = { current: mockChartContainerNoElements };

    expect(() => {
      renderHook(() => useChartDataAttributes(mockRef, mockLegendNames, mockHiddenSeries, mockRenderKey));
    }).not.toThrow();
  });

  it('should render hook successfully', () => {
    const mockRef = { current: mockChartContainer };

    const { result } = renderHook(() =>
      useChartDataAttributes(mockRef, mockLegendNames, mockHiddenSeries, mockRenderKey)
    );

    expect(result.current).toBeUndefined(); // Hook doesn't return anything
  });

  it('should handle re-renders with different data', () => {
    const mockRef = { current: mockChartContainer };

    const { rerender } = renderHook(
      ({ legendNames, hiddenSeries, renderKey }) =>
        useChartDataAttributes(mockRef, legendNames, hiddenSeries, renderKey),
      {
        initialProps: {
          legendNames: mockLegendNames,
          hiddenSeries: mockHiddenSeries,
          renderKey: mockRenderKey,
        },
      }
    );

    // Re-render with different data
    rerender({
      legendNames: [
        {
          packageType: 'New Type',
          datapoints: [{ name: 'New Stream' }],
        },
      ],
      hiddenSeries: new Set([1]),
      renderKey: 2,
    });

    expect(mockChartContainer.querySelectorAll).toHaveBeenCalled();
  });
});

const APP_STREAM_DROPDOWNS = ['rhel-9-appstreams', 'rhel-8-appstreams', 'rhel-10-appstreams'];

describe('buildExportData', () => {
  const streamWithHosts: Stream[] = [
    {
      name: 'nodejs',
      display_name: 'Node.js 18',
      os_major: 9,
      os_minor: 0,
      start_date: '2023-01-01',
      end_date: '2025-01-01',
      count: 2,
      rolling: false,
      related: false,
      support_status: 'Supported',
      os_lifecycle: 'Supported',
      application_stream_name: 'Node.js 18',
      systems_detail: [
        { id: 'host-1', display_name: 'server-1' },
        { id: 'host-2', display_name: 'server-2' },
      ],
    },
  ];

  const streamWithoutHosts: Stream[] = [
    {
      name: 'python',
      display_name: 'Python 3.11',
      os_major: 9,
      os_minor: 1,
      start_date: '2022-06-01',
      end_date: '2024-06-01',
      count: 0,
      rolling: false,
      related: false,
      support_status: 'Retired',
      os_lifecycle: 'Supported',
      application_stream_name: 'Python 3.11',
      systems_detail: [],
    },
  ];

  const systemWithHosts: SystemLifecycleChanges[] = [
    {
      name: 'RHEL',
      display_name: 'RHEL 9.3',
      major: 9,
      minor: 3,
      start_date: '2023-01-01',
      end_date: '2025-01-01',
      count: 1,
      lifecycle_type: 'standard',
      related: false,
      support_status: 'Supported',
      systems_detail: [{ id: 'sys-1', display_name: 'rhel-host-1' }],
    },
  ];

  const systemWithoutHosts: SystemLifecycleChanges[] = [
    {
      name: 'RHEL',
      display_name: 'RHEL 8.9',
      major: 8,
      minor: 9,
      start_date: '2022-01-01',
      end_date: '2024-01-01',
      count: 0,
      lifecycle_type: 'standard',
      related: true,
      support_status: 'Retired',
      systems_detail: [],
    },
  ];

  it('builds app stream export rows with host details', () => {
    const result = buildExportData(streamWithHosts, 'rhel-9-appstreams', APP_STREAM_DROPDOWNS);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        appstream_module: 'Node.js 18',
        hostname: 'server-1',
        host_id: 'host-1',
        release: 9,
        rhel_version: '9.0',
        system_index: '1 of 2',
      })
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        hostname: 'server-2',
        system_index: '2 of 2',
      })
    );
  });

  it('builds app stream export rows without host details', () => {
    const result = buildExportData(streamWithoutHosts, 'rhel-8-appstreams', APP_STREAM_DROPDOWNS);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        appstream_module: 'Python 3.11',
        release: 9,
        rhel_version: '9.1',
        lifecycle_status: 'Retired',
      })
    );
    expect(result[0]).not.toHaveProperty('hostname');
    expect(result[0]).not.toHaveProperty('host_id');
  });

  it('builds system export rows with host details', () => {
    const result = buildExportData(systemWithHosts, 'rhel-systems', APP_STREAM_DROPDOWNS);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        hostname: 'rhel-host-1',
        host_id: 'sys-1',
        release: 'RHEL',
        rhel_version: '9.3',
        system_index: '1 of 1',
      })
    );
    expect(result[0]).not.toHaveProperty('appstream_module');
  });

  it('builds system export rows without host details', () => {
    const result = buildExportData(systemWithoutHosts, 'rhel-systems', APP_STREAM_DROPDOWNS);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        release: 'RHEL',
        rhel_version: '8.9',
        lifecycle_status: 'Retired',
      })
    );
    expect(result[0]).not.toHaveProperty('hostname');
  });

  it('returns empty array for empty input', () => {
    expect(buildExportData([], 'rhel-9-appstreams', APP_STREAM_DROPDOWNS)).toEqual([]);
    expect(buildExportData([], 'rhel-systems', APP_STREAM_DROPDOWNS)).toEqual([]);
  });

  it('puts appstream_module as the first key in stream exports', () => {
    const result = buildExportData(streamWithHosts, 'rhel-9-appstreams', APP_STREAM_DROPDOWNS);
    expect(Object.keys(result[0])[0]).toBe('appstream_module');
  });
});
