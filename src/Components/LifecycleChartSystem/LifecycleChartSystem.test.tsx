import React from 'react';
import { render, screen } from '@testing-library/react';
import LifecycleChartSystem from './LifecycleChartSystem';
import { useChartDataAttributes } from '../../utils/utils';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
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

describe('LifecycleChartSystem', () => {
  const mockLifecycleData: SystemLifecycleChanges[] = [
    {
      name: 'RHEL 9.0',
      display_name: 'RHEL 9.0',
      start_date: '2020-01-01',
      end_date: '2025-01-01',
      support_status: 'supported',
      major: 9,
      minor: 0,
      count: 5,
      lifecycle_type: 'standard',
      related: false,
      systems_detail: [
        { id: 'system1', display_name: 'System 1' },
        { id: 'system2', display_name: 'System 2' },
      ],
    },
    {
      name: 'RHEL 8.0',
      display_name: 'RHEL 8.0',
      start_date: '2021-01-01',
      end_date: '2024-01-01',
      support_status: 'retired',
      major: 8,
      minor: 0,
      count: 3,
      lifecycle_type: 'standard',
      related: false,
      systems_detail: [{ id: 'system3', display_name: 'System 3' }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the chart component', () => {
    render(<LifecycleChartSystem lifecycleData={mockLifecycleData} />);

    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should call useChartDataAttributes hook', () => {
    render(<LifecycleChartSystem lifecycleData={mockLifecycleData} />);

    expect(mockUseChartDataAttributes).toHaveBeenCalled();
  });

  it('should call useChartDataAttributes with correct parameters', () => {
    render(<LifecycleChartSystem lifecycleData={mockLifecycleData} />);

    expect(mockUseChartDataAttributes).toHaveBeenCalledWith(
      expect.objectContaining({ current: expect.any(Object) }), // chartContainerRef
      expect.any(Array), // legendNames
      expect.any(Set) // hiddenSeries
    );
  });

  it('should render with empty data', () => {
    render(<LifecycleChartSystem lifecycleData={[]} />);

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(mockUseChartDataAttributes).toHaveBeenCalled();
  });

  it('should render with viewFilter prop', () => {
    render(<LifecycleChartSystem lifecycleData={mockLifecycleData} viewFilter="all" />);

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(mockUseChartDataAttributes).toHaveBeenCalled();
  });

  it('should pass updated parameters to hook when data changes', () => {
    const { rerender } = render(<LifecycleChartSystem lifecycleData={mockLifecycleData} />);

    const initialCallCount = mockUseChartDataAttributes.mock.calls.length;

    const newData: SystemLifecycleChanges[] = [
      {
        name: 'RHEL 9.1',
        display_name: 'RHEL 9.1',
        start_date: '2022-01-01',
        end_date: '2026-01-01',
        support_status: 'supported',
        major: 9,
        minor: 1,
        count: 7,
        lifecycle_type: 'standard',
        related: false,
        systems_detail: [
          { id: 'system4', display_name: 'System 4' },
          { id: 'system5', display_name: 'System 5' },
        ],
      },
    ];

    rerender(<LifecycleChartSystem lifecycleData={newData} />);

    // Should be called again with the re-render
    expect(mockUseChartDataAttributes.mock.calls.length).toBeGreaterThan(initialCallCount);
  });
});
