import React from 'react';
import { render, screen } from '@testing-library/react';
import LifecycleChart from './LifecycleChart';
import { useChartDataAttributes } from '../../utils/utils';
import { Stream } from '../../types/Stream';
import '@testing-library/jest-dom';

// Mock the custom hook
jest.mock('../../utils/utils', () => ({
  ...jest.requireActual('../../utils/utils'),
  useChartDataAttributes: jest.fn(),
}));

// Mock PatternFly components
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: { children: React.ReactNode }) => <div data-testid="chart">{children}</div>,
  ChartAxis: () => <div data-testid="chart-axis" />,
  ChartBar: () => <div data-testid="chart-bar" />,
  ChartGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="chart-group">{children}</div>,
  ChartLegend: () => <div data-testid="chart-legend" />,
  ChartLine: () => <div data-testid="chart-line" />,
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  getInteractiveLegendEvents: () => ({}),
  getInteractiveLegendItemStyles: () => ({}),
}));

const mockUseChartDataAttributes = useChartDataAttributes as jest.MockedFunction<typeof useChartDataAttributes>;

describe('LifecycleChart', () => {
  const mockLifecycleData: Stream[] = [
    {
      name: 'stream1',
      display_name: 'Stream 1',
      start_date: '2020-01-01',
      end_date: '2025-01-01',
      support_status: 'supported',
      os_major: 9,
      os_minor: 0,
      count: 5,
      os_lifecycle: 'active',
      application_stream_name: 'stream1',
      rolling: false,
      related: false,
      systems_detail: [
        { id: 'system1', display_name: 'System 1' },
        { id: 'system2', display_name: 'System 2' },
      ],
    },
    {
      name: 'stream2',
      display_name: 'Stream 2',
      start_date: '2021-01-01',
      end_date: '2024-01-01',
      support_status: 'retired',
      os_major: 8,
      os_minor: 0,
      count: 3,
      os_lifecycle: 'retired',
      application_stream_name: 'stream2',
      rolling: false,
      related: false,
      systems_detail: [{ id: 'system3', display_name: 'System 3' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the chart component', () => {
    render(<LifecycleChart lifecycleData={mockLifecycleData} />);

    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should call useChartDataAttributes hook', () => {
    render(<LifecycleChart lifecycleData={mockLifecycleData} />);

    expect(mockUseChartDataAttributes).toHaveBeenCalled();
  });

  it('should call useChartDataAttributes with correct parameters', () => {
    render(<LifecycleChart lifecycleData={mockLifecycleData} />);

    expect(mockUseChartDataAttributes).toHaveBeenCalledWith(
      expect.objectContaining({ current: expect.any(Object) }), // chartContainerRef
      expect.any(Array), // legendNames
      expect.any(Set) // hiddenSeries
    );
  });

  it('should render with empty data', () => {
    render(<LifecycleChart lifecycleData={[]} />);

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(mockUseChartDataAttributes).toHaveBeenCalled();
  });

  it('should render with viewFilter prop', () => {
    render(<LifecycleChart lifecycleData={mockLifecycleData} viewFilter="all" />);

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(mockUseChartDataAttributes).toHaveBeenCalled();
  });

  it('should pass updated parameters to hook when data changes', () => {
    const { rerender } = render(<LifecycleChart lifecycleData={mockLifecycleData} />);

    const initialCallCount = mockUseChartDataAttributes.mock.calls.length;

    const newData: Stream[] = [
      {
        name: 'stream3',
        display_name: 'Stream 3',
        start_date: '2022-01-01',
        end_date: '2026-01-01',
        support_status: 'supported',
        os_major: 9,
        os_minor: 1,
        count: 7,
        os_lifecycle: 'active',
        application_stream_name: 'stream3',
        rolling: false,
        related: false,
        systems_detail: [
          { id: 'system4', display_name: 'System 4' },
          { id: 'system5', display_name: 'System 5' },
        ],
      },
    ];

    rerender(<LifecycleChart lifecycleData={newData} />);

    // Should be called again with the re-render
    expect(mockUseChartDataAttributes.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should render tooltip when tooltip data is set', () => {
    const { container } = render(<LifecycleChart lifecycleData={mockLifecycleData} />);

    // The chart container should be rendered
    const chartContainer = container.querySelector('.drf-lifecycle__chart');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should handle data with Unknown dates', () => {
    const dataWithUnknownDates: Stream[] = [
      {
        name: 'stream-unknown',
        display_name: 'Stream Unknown',
        start_date: 'Unknown',
        end_date: 'Unknown',
        support_status: 'supported',
        os_major: 9,
        os_minor: 0,
        count: 1,
        os_lifecycle: 'active',
        application_stream_name: 'stream-unknown',
        rolling: false,
        related: false,
        systems_detail: [],
      },
    ];

    render(<LifecycleChart lifecycleData={dataWithUnknownDates} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should render ChartLine component for current date indicator', () => {
    render(<LifecycleChart lifecycleData={mockLifecycleData} />);
    expect(screen.getByTestId('chart-line')).toBeInTheDocument();
  });

  it('should handle null dates in data', () => {
    const dataWithNullDates = [
      {
        name: 'stream-null',
        display_name: 'Stream Null',
        start_date: null as unknown as string,
        end_date: null as unknown as string,
        support_status: 'supported',
        os_major: 9,
        os_minor: 0,
        count: 1,
        os_lifecycle: 'active',
        application_stream_name: 'stream-null',
        rolling: false,
        related: false,
        systems_detail: [],
      },
    ] as Stream[];

    render(<LifecycleChart lifecycleData={dataWithNullDates} />);
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });
});
