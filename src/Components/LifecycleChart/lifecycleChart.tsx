import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { Chart, ChartAxis, ChartBar, ChartGroup, ChartTooltip, ChartVoronoiContainer } from '@patternfly/react-charts';

interface LifecycleChartProps {
  lifecycleData: { x: string; y0: Date; y: Date; packageType: string }[][];
}

const LifecycleChart: React.FC<LifecycleChartProps> = ({ lifecycleData }: LifecycleChartProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => {
      setChartWidth(ref.current && ref.current?.offsetWidth > 976 ? ref.current?.offsetWidth - 50 : 976);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [ref]);

  const formatDate = (date: Date, isTime: boolean) => {
    const dateString = date?.toLocaleDateString('en-US');
    const timeString = date?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return isTime ? `${dateString} ${timeString}` : dateString;
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

  const getChart = (alert: any[], index: number) => {
    const data: any[] = [];

    alert?.map((datum: { packageType: string }) => {
      data.push({
        ...datum,
        x: lifecycleData.length - index,
        fill: getPackageColor(datum.packageType),
      });
    });

    if (data?.length === 0) {
      return null;
    }
    return (
      <ChartBar
        data={data}
        key={index}
        style={{
          data: {
            fill: ({ datum }) => datum.fill,
            stroke: ({ datum }) => datum.fill,
          },
        }}
      />
    );
  };

  return (
    <div ref={ref} className="drf-lifecycle__chart" tabIndex={0}>
      <Chart
        legendAllowWrap
        ariaDesc="Support timelines of packages and RHEL versions"
        ariaTitle="Lifecycle bar chart"
        containerComponent={
          <ChartVoronoiContainer
            labelComponent={<ChartTooltip constrainToVisibleArea />}
            labels={({ datum }) =>
              `Package: ${datum.x}\npackageType: ${datum.packageType}\nStart: ${formatDate(
                new Date(datum.y0),
                true
              )}\nEnd: ${formatDate(new Date(datum.y), true)}`
            }
          />
        }
        legendData={[
          { name: 'Supported', symbol: { fill: 'var(--pf-v5-global--success-color--100)' } },
          { name: 'Support ends within 6 months', symbol: { fill: 'var(--pf-v5-global--warning-color--100)' } },
          { name: 'Retired', symbol: { fill: 'var(--pf-v5-global--danger-color--100)' } },
          { name: 'Not installed', symbol: { fill: 'var(--pf-v5-global--palette--blue-200)' } },
          { name: 'Upcoming release', symbol: { fill: 'var(--pf-v5-global--palette--blue-100)' } },
        ]}
        legendPosition="bottom-left"
        name="chart5"
        padding={{
          bottom: 100, // Adjusted to accommodate legend
          left: 100,
          right: 50, // Adjusted to accommodate tooltip
          top: 50,
        }}
        width={chartWidth}
      >
        <ChartAxis
          dependentAxis
          showGrid
          tickFormat={(t: Date) => t.toLocaleDateString('en-US', { year: 'numeric' })}
          tickValues={[
            new Date('January 1 2023'),
            new Date('January 1 2024'),
            new Date('January 1 2025'),
            new Date('January 1 2026'),
            new Date('January 1 2027'),
            new Date('January 1 2028'),
            new Date('January 1 2029'),
            new Date('January 1 2030'),
            new Date('January 1 2031'),
            new Date('January 1 2032'),
            new Date('January 1 2033'),
          ]}
        />
        <ChartAxis
          showGrid
          tickValues={lifecycleData.map((data) => {
            return data[0].x;
          })}
        />

        <ChartGroup horizontal>{lifecycleData.map((data, index) => getChart(data, index))}</ChartGroup>
      </Chart>
    </div>
  );
};

export default LifecycleChart;
