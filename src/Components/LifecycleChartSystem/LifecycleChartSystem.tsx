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

const LifecycleChartSystem: React.FC<LifecycleChartProps> = ({
  lifecycleData,
  viewFilter,
}: LifecycleChartProps) => {
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = React.useState({
    width: 900,
    height: 300,
  });

  // Bar tooltip state
  const [tooltipData, setTooltipData] = React.useState<any>(null);
  const [showTooltip, setShowTooltip] = React.useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  // Date line tooltip state - separate from bar tooltip
  const [showDateTooltip, setShowDateTooltip] = React.useState<boolean>(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  // Hidden series state with forced re-render counter
  const [hiddenSeries, setHiddenSeries] = React.useState(new Set());
  const [renderKey, setRenderKey] = React.useState(0);

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
          `${item.os_major}.${item.os_minor ?? 0}`,
          `${item.count ?? 'N/A'}`
        );
        formatYearAxisData(item.start_date, item.end_date);
      });
    } else {
      (lifecycleData as SystemLifecycleChanges[]).forEach((item) => {
        if (
          item.start_date === 'Unknown' ||
          item.end_date === 'Unknown' ||
          item.start_date === null ||
          item.end_date === null
        ) {
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

  const getFilteredLegendNames = () => {
    if (viewFilter === 'all') {
      return DEFAULT_LEGEND_NAMES.filter((legend) => legend.packageType !== 'Not installed');
    }
    return DEFAULT_LEGEND_NAMES;
  };

  const calculateLegendNames = () => {
    return getFilteredLegendNames().map((legend) => {
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
    setHiddenSeries((prevHiddenSeries) => {
      const newHiddenSeries = new Set(prevHiddenSeries);

      // Get the count of series that have actual data
      const totalVisibleSeries = legendNames.filter((s) => s.datapoints.length > 0).length;

      // Convert Set to Array with proper typing
      const hiddenIndices = Array.from(prevHiddenSeries) as number[];
      const currentlyHiddenCount = hiddenIndices.filter((index: number) => {
        return (
          typeof index === 'number' &&
          index >= 0 &&
          index < legendNames.length &&
          legendNames[index] &&
          legendNames[index].datapoints.length > 0
        );
      }).length;

      const isCurrentlyHidden = newHiddenSeries.has(props.index);

      // If we're trying to hide the last visible series, don't allow it
      if (!isCurrentlyHidden && currentlyHiddenCount >= totalVisibleSeries - 1) {
        // Optionally show a message or just ignore the click
        console.log('Cannot hide all series - at least one must remain visible');
        return prevHiddenSeries; // Return unchanged state
      }

      // If we're trying to show a series when all are hidden, show this one and clear others
      if (isCurrentlyHidden && currentlyHiddenCount === totalVisibleSeries) {
        // Clear all hidden series to show everything
        return new Set<number>();
      }

      // Normal toggle behavior
      if (isCurrentlyHidden) {
        newHiddenSeries.delete(props.index);
      } else {
        newHiddenSeries.add(props.index);
      }

      return newHiddenSeries;
    });

    // Force a re-render by updating the render key
    setRenderKey((prev) => prev + 1);

    // Clear any active tooltips when legend is clicked
    setShowTooltip(false);
    setShowDateTooltip(false);
    setTooltipData(null);
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

  // Get only the visible ticks based on hidden series
  const getVisibleTicks = () => {
    const visibleNames = new Set<string>();

    legendNames.forEach((series, index) => {
      if (!hiddenSeries.has(index)) {
        series.datapoints.forEach((datapoint) => {
          visibleNames.add(datapoint.x);
        });
      }
    });

    // Maintain the original order from updatedLifecycleData
    return updatedLifecycleData.map((data) => data[0].x).filter((name) => visibleNames.has(name));
  };

  const isHidden = (index: number) => hiddenSeries.has(index);

  // needs to be a specific tuple format or filter on hover breaks
  const chartNames = legendNames.map((_, i) => [`series-${i}`]) as [string[]];

  // Function to position tooltip - always to the right of the bar
  const calculateTooltipPosition = (x: number): number => {
    // Always position tooltip to the right of the bar with a consistent offset
    return x + 20;
  };

  // Update mouse position on move for date line tooltip
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

  // Render the regular bar tooltip
  const renderTooltip = () => {
    if (!showTooltip || !tooltipData) return null;

    const content = `Name: ${tooltipData.name}
Release: ${tooltipData.version}
Support Type: ${tooltipData.packageType}
Systems: ${tooltipData.numSystems}
Start: ${formatDate(new Date(tooltipData.y0))}
End: ${formatDate(new Date(tooltipData.y))}`;

    return (
      <div
        style={{
          position: 'absolute',
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
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
          transform: 'translate(10px, -50%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            left: '-10px',
            top: '50%',
            transform: 'translateY(-50%)',
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderRight: '10px solid black',
          }}
        />
        {content}
      </div>
    );
  };

  // Render the date line tooltip using mouse position
  const renderDateTooltip = () => {
    if (!showDateTooltip) return null;

    // Calculate offset for better positioning
    const xOffset = 15;
    const yOffset = -15;

    return (
      <div
        style={{
          position: 'fixed',
          left: `${mousePosition.x + xOffset}px`,
          top: `${mousePosition.y + yOffset}px`,
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
        <div
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            left: '-10px',
            top: '50%',
            transform: 'translateY(-50%)',
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderRight: '10px solid black',
          }}
        />
        Current Date: {formatDate(new Date())}
      </div>
    );
  };

  const isHiddenSeries = (index: number) => hiddenSeries.has(index);

  // Handle resize observation
  React.useEffect(() => {
    if (!chartContainerRef.current) return;

    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const { width } = chartContainerRef.current.getBoundingClientRect();

        // Get unique display names that are currently visible
        // This can be removed once we remove duplicates from the backend api
        const visibleNames = new Set<string>();

        legendNames.forEach((series, index) => {
          if (!hiddenSeries.has(index)) {
            series.datapoints.forEach((datapoint) => {
              visibleNames.add(datapoint.name);
            });
          }
        });

        const uniqueItemCount = visibleNames.size;

        let currentHeight = 0;

        // Adjust height per item based on total count to prevent excessive gaps
        if (uniqueItemCount > 100) {
          currentHeight = Math.max(uniqueItemCount * 3 + 300, 600);
        } else if (uniqueItemCount > 30) {
          currentHeight = Math.max(uniqueItemCount * 15 + 400, 300);
        } else {
          currentHeight = Math.max(uniqueItemCount * 15 + 300, 300);
        }

        setChartDimensions({
          width: Math.max(width, 400), // Set minimum width
          height: currentHeight,
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
  }, [updatedLifecycleData.length, hiddenSeries, renderKey]);

  // Clear tooltips when mouse leaves the chart
  React.useEffect(() => {
    const handleMouseLeave = () => {
      setShowTooltip(false);
      setShowDateTooltip(false);
    };

    if (chartContainerRef.current) {
      chartContainerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [chartContainerRef.current]);

  // Calculate padding based on the longest visible name
  const calculateLeftPadding = () => {
    const visibleTicks = getVisibleTicks();

    if (visibleTicks.length === 0) {
      return 160; // Default padding if no data
    }

    // Find the longest visible name
    const longestName = visibleTicks.reduce(
      (longest, current) => (current.length > longest.length ? current : longest),
      ''
    );

    // Calculate padding: base padding (60) + character count * character width factor
    const charWidthFactor = 6;
    const basePadding = 60;
    const calculatedPadding = basePadding + longestName.length * charWidthFactor;

    // Set a minimum and maximum boundary
    return Math.max(160, Math.min(calculatedPadding, 400));
  };

  const leftPadding = calculateLeftPadding();

  // Explicitly return the entire div structure
  return (
    <div className="drf-lifecycle__chart" tabIndex={0} ref={chartContainerRef} style={{ position: 'relative' }}>
      {/* Regular tooltip for bars */}
      {showTooltip && renderTooltip()}

      {/* Tooltip for date line - using mouse positioning */}
      {showDateTooltip && renderDateTooltip()}

      <Chart
        key={renderKey} // Force re-render when renderKey changes
        legendAllowWrap
        ariaDesc="Support timelines of packages and RHEL versions"
        events={getInteractiveLegendEvents({
          chartNames,
          isHidden: isHiddenSeries,
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
          tickValues={getVisibleTicks()}
          style={{
            tickLabels: {
              fontSize: () => Math.max(10, Math.min(14, chartDimensions.width / 60)),
            },
          }}
        />
        <ChartGroup horizontal>
          {legendNames.map((s, index) => {
            // Skip rendering entirely if the series is hidden
            if (hiddenSeries.has(index) || s.datapoints.length === 0) {
              return null;
            }
            return (
              <ChartBar
                data={s.datapoints}
                key={`bar-${index}-${renderKey}`} // Include renderKey for forced re-render
                name={`series-${index}`}
                barWidth={10}
                style={{
                  data: {
                    fill: getPackageColor(s.packageType),
                    stroke: getPackageColor(s.packageType),
                    fillOpacity: hiddenSeries.has(index) ? 0.3 : 1, // Ensure proper opacity based on hidden state
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
                              const { datum, x, y } = props;

                              // Don't show tooltip if series is hidden
                              if (hiddenSeries.has(index)) {
                                return null;
                              }

                              // Regular bar tooltip positioning
                              const tooltipX = calculateTooltipPosition(x);
                              setTooltipPosition({
                                x: tooltipX,
                                y: y,
                              });

                              setTooltipData(datum);
                              setShowTooltip(true);

                              // Hide date tooltip when hovering over bars
                              setShowDateTooltip(false);

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
                          // Show date tooltip
                          setShowDateTooltip(true);

                          // Hide bar tooltip when hovering over date line
                          setShowTooltip(false);

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
                          // Hide date tooltip when not hovering
                          setShowDateTooltip(false);

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

export default LifecycleChartSystem;
