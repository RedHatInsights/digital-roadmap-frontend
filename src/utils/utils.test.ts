import { renderHook } from '@testing-library/react';
import { useChartDataAttributes } from './utils';

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
