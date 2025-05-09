import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartLegend,
  ChartLine,
  ChartTooltip,
  getInteractiveLegendEvents,
  getInteractiveLegendItemStyles,
} from '@patternfly/react-charts';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';

interface LifecycleChartProps {
  lifecycleData: Stream[] | SystemLifecycleChanges[];
  viewFilter?: string;
}

interface ChartDataObject {
  x: string;
  y0: Date;
  y: Date;
  packageType: string;
  version: string;
  numSystems: string;
  typeID?: number | null;
  name: string;
}

const LifecycleChart: React.FC<LifecycleChartProps> = ({ lifecycleData }: LifecycleChartProps) => {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = React.useState({
    width: 900,
    height: 300,
  });

  // Tooltip state
  const [tooltipData, setTooltipData] = React.useState<any>(null);
  const [showTooltip, setShowTooltip] = React.useState<boolean>(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  //check data type and contruct a chart array
  const checkDataType = (lifecycleData: Stream[] | SystemLifecycleChanges[]) => {
    if (!lifecycleData || lifecycleData.length === 0) {
      return '';
    }
    if ('application_stream_name' in lifecycleData[0]) {
      return 'appLifecycle';
    }
    return 'lifecycle';
  };

  const dataType = checkDataType(lifecycleData);
  const updatedLifecycleData: ChartDataObject[][] = [];
  const years: { [key: string]: Date } = {};
  const [hiddenSeries, setHiddenSeries] = React.useState(new Set());

  const formatChartData = (
    name: string,
    startDate: string,
    endDate: string,
    packageType: string,
    version: string,
    numSystems: string
  ) => {
    return updatedLifecycleData.push([
      {
        x: name,
        y0: new Date(startDate),
        y: new Date(endDate),
        packageType,
        version,
        numSystems,
        name: name,
      },
    ]);
  };
  const addInterstitialYears = (yearsObject: { [key: string]: Date }) => {
    const years = Object.keys(yearsObject).sort();
    if (years.length < 2) {
      return yearsObject;
    }

    let startYear = parseInt(years[0]);
    const endYear = parseInt(years[years.length - 1]);

    while (startYear < endYear) {
      const yearString = String(startYear);
      if (!(yearString in yearsObject)) {
        yearsObject[yearString] = new Date(`January 1 ${yearString}`);
      }
      startYear++;
    }

    return yearsObject;
  };

  // We use this to deduplicate years and add on the last year as a data point
  // Years always start with January, but the end date may be June 2023
  // We want the axis to end with January 1 of the following year if the end date isn't already January
  const formatYearAxisData = (start: string, end: string) => {
    const endDate = new Date(end);
    const startYear = new Date(start).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
    });
    const endYear = endDate.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
    });
    years[startYear] = new Date(`January 1 ${startYear}`);
    years[endYear] = new Date(`January 1 ${endYear}`);
    if (endDate.getMonth() > 0) {
      endDate.setFullYear(endDate.getFullYear() + 1);
      const endDateAsString = endDate.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
      });
      years[endDateAsString] = new Date(`January 1 ${endDateAsString}`);
    }
  };

  const constructLifecycleData = (lifecycleData: Stream[] | SystemLifecycleChanges[]) => {
    if (!dataType) {
      return;
    }
    if (dataType === 'appLifecycle') {
      (lifecycleData as Stream[]).forEach((item) => {
        if (
          item.start_date === 'Unknown' ||
          item.end_date === 'Unknown' ||
          item.start_date === null ||
          item.end_date === null
        ) {
          return;
        }
        formatChartData(
          `${item.display_name}`,
          item.start_date,
          item.end_date,
          item.support_status,
          `${item.os_major}`,
          `${item.count ?? 'N/A'}`
        );
        formatYearAxisData(item.start_date, item.end_date);
      });
    } else {
      (lifecycleData as SystemLifecycleChanges[]).forEach((item) => {
        if (item.start_date === 'Unknown' || item.end_date === 'Unknown') {
          return;
        }
        formatChartData(
          item.name,
          item.start_date,
          item.end_date,
          item.support_status,
          `${item.major}.${item.minor}`,
          `${item.count ?? 'N/A'}`
        );
        formatYearAxisData(item.start_date, item.end_date);
      });
    }
    addInterstitialYears(years);
  };
  constructLifecycleData(lifecycleData);

  const DEFAULT_LEGEND_NAMES: {
    packageType: string;
    datapoints: ChartDataObject[];
  }[] = [
    { packageType: 'Supported', datapoints: [] },
    { packageType: 'Support ends within 6 months', datapoints: [] },
    { packageType: 'Retired', datapoints: [] },
    { packageType: 'Not installed', datapoints: [] },
    { packageType: 'Upcoming release', datapoints: [] },
  ];

  const calculateLegendNames = () => {
    return DEFAULT_LEGEND_NAMES.map((legend) => {
      return {
        packageType: legend.packageType,
        datapoints: updatedLifecycleData
          .flat()
          .filter((d) => d.packageType === legend.packageType)
          .map((d) => ({
            name: d.name,
            packageType: d.packageType,
            version: d.version,
            numSystems: d.numSystems,
            x: d.x,
            y: d.y,
            y0: d.y0,
          })),
      };
    });
  };

  const legendNames = React.useMemo(calculateLegendNames, [updatedLifecycleData]);

  const getLegendData = () =>
    legendNames.map((s, index) => ({
      childName: `series-${index}`,
      name: s.packageType,
      symbol: { fill: `${getPackageColor(s.packageType)}` },
      ...getInteractiveLegendItemStyles(hiddenSeries.has(index)),
    }));

  const handleLegendClick = (props: { index: number }) => {
    if (!hiddenSeries.delete(props.index)) {
      hiddenSeries.add(props.index);
    }
    setHiddenSeries(new Set(hiddenSeries));
  };

  const formatDate = (date: Date) => {
    const dateString = date?.toLocaleDateString('en-US', { timeZone: 'UTC' });
    return dateString;
  };

  const getPackageColor = (datum: string) => {
    switch (datum) {
      case 'Retired':
        return 'var(--pf-v5-global--danger-color--100)';
      case 'Support ends within 6 months':
        return 'var(--pf-v5-global--warning-color--100)';
      case 'Not installed':
        return 'var(--pf-v5-global--palette--blue-200)';
      case 'Supported':
        return 'var(--pf-v5-global--success-color--100)';
      case 'Upcoming release':
        return 'var(--pf-v5-global--palette--blue-100)';
      default:
        return 'var(--pf-v5-global--default-color--300)';
    }
  };

  const fetchTicks = () => {
    return updatedLifecycleData.map((data) => {
      return data[0].x;
    });
  };

  const isHidden = (index: number) => hiddenSeries.has(index);

  // needs to be a specific tuple format or filter on hover breaks
  const chartNames = legendNames.map((_, i) => [`series-${i}`]) as [string[]];

  // Custom tooltip component with fixed positioning
  const renderTooltip = () => {
    if (!showTooltip || !tooltipData) return null;

    let content = '';
    if (tooltipData._name === 'Current-date') {
      content = `Current Date: ${formatDate(new Date())}`;
    } else if (tooltipData.packageType && tooltipData.y0) {
      content = `Name: ${tooltipData.name}\nRelease: ${tooltipData.version}\nSupport Type: ${
        tooltipData.packageType
      }\nSystems: ${tooltipData.numSystems}\nStart: ${formatDate(new Date(tooltipData.y0))}\nEnd: ${formatDate(
        new Date(tooltipData.y)
      )}`;
    }

    return (
      <div
        style={{
          position: 'fixed',
          left: `${mousePosition.x + 15}px`,
          top: `${mousePosition.y - 15}px`,
          backgroundColor: 'black',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,
          pointerEvents: 'none',
          whiteSpace: 'pre-line',
          border: '1px solid #888',
          maxWidth: '250px',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        {content}
      </div>
    );
  };

  // Update mouse position on move
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Handle resize observation
  React.useEffect(() => {
    if (!chartContainerRef.current) return;

    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const { width } = chartContainerRef.current.getBoundingClientRect();
        // Calculate height based on data length
        const height = Math.max(updatedLifecycleData.length * 15 + 300, 300);

        setChartDimensions({
          width: Math.max(width, 400), // Set minimum width
          height,
        });
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(chartContainerRef.current);

    // Handle zoom events
    const handleZoom = () => {
      updateDimensions();
    };

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('zoom', handleZoom);

    return () => {
      if (chartContainerRef.current) {
        resizeObserver.unobserve(chartContainerRef.current);
      }
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('zoom', handleZoom);
    };
  }, [updatedLifecycleData.length]);

  // Calculate padding based on the longest name
  const calculateLeftPadding = () => {
    if (updatedLifecycleData.length === 0) {
      return 160; // Default padding if no data
    }

    // Get all names
    const names = updatedLifecycleData.map((data) => data[0].x);

    // Find the longest name
    const longestName = names.reduce(
      (longest, current) => (current.length > longest.length ? current : longest),
      ''
    );

    // Calculate padding: base padding (60) + character count * character width factor
    const charWidthFactor = 6;
    const basePadding = 60;
    const calculatedPadding = basePadding + longestName.length * charWidthFactor;

    // Set a minimum and maximum boundary
    return Math.max(160, Math.min(calculatedPadding, 250));
  };

  const leftPadding = calculateLeftPadding();

  // Explicitly return the entire div structure
  return (
    <div className="drf-lifecycle__chart" tabIndex={0} ref={chartContainerRef}>
      {showTooltip && renderTooltip()}
      <Chart
        legendAllowWrap
        ariaDesc="Support timelines of packages and RHEL versions"
        events={getInteractiveLegendEvents({
          chartNames,
          isHidden,
          legendName: 'chart5-ChartLegend',
          onLegendClick: handleLegendClick,
        })}
        legendComponent={<ChartLegend name="chart5-ChartLegend" data={getLegendData()} height={50} gutter={20} />}
        legendPosition="bottom-left"
        name="chart5"
        padding={{
          bottom: 60, // Adjusted to accommodate legend
          left: leftPadding, // Dynamically calculated based on the longest name
          right: 75, // Adjusted to accommodate tooltip
          top: 30,
        }}
        domainPadding={{ x: [13, 13] }}
        height={chartDimensions.height}
        width={chartDimensions.width}
      >
        {/*X axis with date timeline for the bottom of the chart */}
        {Object.values(years).length > 0 && (
          <ChartAxis
            dependentAxis
            showGrid
            tickValues={Object.values(years)}
            tickFormat={(t: Date) => t.toLocaleDateString('en-US', { year: 'numeric' })}
          />
        )}
        {/*X axis with date timeline for the top of the chart */}
        {Object.values(years).length > 0 && (
          <ChartAxis
            dependentAxis
            showGrid={false}
            orientation="top"
            tickValues={Object.values(years)}
            tickFormat={(t: Date) => t.toLocaleDateString('en-US', { year: 'numeric' })}
          />
        )}
        {/*Y axis with the name of each stream/operating system */}
        <ChartAxis
          showGrid
          tickValues={fetchTicks()}
          style={{
            tickLabels: {
              fontSize: () => Math.max(10, Math.min(14, chartDimensions.width / 60)),
            },
          }}
        />
        <ChartGroup horizontal>
          {legendNames.map((s, index) => {
            if (s.datapoints.length === 0) {
              return null;
            }
            return (
              <ChartBar
                data={
                  !hiddenSeries.has(index)
                    ? s.datapoints
                    : s.datapoints.map((d) => {
                        return { ...d, x: null };
                      })
                }
                key={`bar-${index}`}
                name={`series-${index}`}
                barWidth={10}
                style={{
                  data: {
                    fill: getPackageColor(s.packageType),
                    stroke: getPackageColor(s.packageType),
                  },
                }}
                // Add direct event handlers for tooltips
                events={[
                  {
                    target: 'data',
                    eventHandlers: {
                      onMouseOver: () => {
                        return [
                          {
                            target: 'data',
                            mutation: (props) => {
                              setTooltipData(props.datum);
                              setShowTooltip(true);
                              return {
                                style: {
                                  ...props.style,
                                  strokeWidth: 3,
                                  stroke: getPackageColor(s.packageType),
                                  fillOpacity: 0.9,
                                },
                              };
                            },
                          },
                        ];
                      },
                      onMouseOut: () => {
                        return [
                          {
                            target: 'data',
                            mutation: () => {
                              setShowTooltip(false);
                              setTooltipData(null);
                              return null;
                            },
                          },
                        ];
                      },
                    },
                  },
                ]}
                // Empty tooltip component to satisfy PatternFly requirements
                labelComponent={<ChartTooltip text={() => ''} active={false} />}
              />
            );
          })}
        </ChartGroup>
        {updatedLifecycleData.length > 0 && (
          <ChartLine
            name="Current-date"
            y={() => Date.now()}
            y0={() => Date.now()}
            style={{
              data: {
                stroke: 'black',
                strokeWidth: 2,
              },
            }}
            events={[
              {
                target: 'data',
                eventHandlers: {
                  onMouseOver: () => {
                    return [
                      {
                        target: 'data',
                        mutation: () => {
                          setTooltipData({ _name: 'Current-date' });
                          setShowTooltip(true);
                          return {
                            style: {
                              stroke: 'black',
                              strokeWidth: 3,
                            },
                          };
                        },
                      },
                    ];
                  },
                  onMouseOut: () => {
                    return [
                      {
                        target: 'data',
                        mutation: () => {
                          setShowTooltip(false);
                          setTooltipData(null);
                          return {
                            style: {
                              stroke: '#151515',
                              strokeWidth: 2,
                            },
                          };
                        },
                      },
                    ];
                  },
                },
              },
            ]}
            // Empty tooltip component to satisfy PatternFly requirements
            labelComponent={<ChartTooltip text={() => ''} active={false} />}
          />
        )}
      </Chart>
    </div>
  );
};

export default LifecycleChart;
