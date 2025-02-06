import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { Chart, ChartAxis, ChartBar, ChartGroup, ChartTooltip, ChartVoronoiContainer } from '@patternfly/react-charts';
import { AppLifecycleChanges } from '../../types/AppLifecycleChanges';
import { SystemLifecycleChanges} from '../../types/SystemLifecycleChanges';

interface LifecycleChartProps {
  lifecycleData: AppLifecycleChanges[] | SystemLifecycleChanges[];

}

const LifecycleChart: React.FC<LifecycleChartProps> = ({ lifecycleData }: LifecycleChartProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = React.useState(0);

  //check data type and contruct a chart array for use

  const checkDataType = (lifecycleData: AppLifecycleChanges[] | SystemLifecycleChanges[]) => {
    if (!lifecycleData || lifecycleData.length === 0) {
      return '';
    }
    if ('module_name' in lifecycleData[0]) {
      return 'appLifecycle';
    }
    return 'lifecycle';
  };

  const lifecycleChartData = [
  [{ x: 'RHEL 8.3', y0: new Date('2023-01'), y: new Date('2024-06'), packageType: 'Retired' }],
  [
    {
      x: 'RHEL 8.7',
      y0: new Date('2023-01'),
      y: new Date('2025-10'),
      packageType: 'Support ends within 6 months',
    },
  ],
  [{ x: 'RHEL 9.0', y0: new Date('2024-08'), y: new Date('2025-06'), packageType: 'Not installed' }],
  [{ x: 'RHEL 9.1', y0: new Date('2023-01'), y: new Date('2027-10'), packageType: 'Supported' }],
  ];

  const dataType = checkDataType(lifecycleData);
  const updatedLifecycleData : any[][] = []


  const constructLifecycleData = (lifecycleData: AppLifecycleChanges[] | SystemLifecycleChanges[]) => {
    if (!dataType) {
      return;
    }
    console.log(dataType, "data")
    if (dataType === "appLifecycle") {
      console.log(1)
      updatedLifecycleData.push(lifecycleData.map((item: any) => ([{ x: item.module_name, y0: new Date(item.streams[0].start_date), y: new Date(item.streams[0].end_date), packageType: "Supported" }])));
    }
    else{
      console.log(2)
      updatedLifecycleData.push(lifecycleData.map((item: any) => ([{ x: item.name, y0: new Date(item.release_date), y: new Date(item.retirement_date), packageType: "Supported" }])));
    }
  };
  constructLifecycleData(lifecycleData)
  console.log(updatedLifecycleData, "new")



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

  const getChart = (alert: any, index: number) => {
    const data: any[] = [];

    alert?.map((datum: { packageType: string }) => {
      data.push({
        ...datum,
        x: lifecycleChartData.length - index,
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
          tickValues={lifecycleChartData.map((data) => {
            return data;
          })}
        />

        <ChartGroup horizontal>{lifecycleChartData.map((data, index) => getChart(data, index))}</ChartGroup>
      </Chart>
    </div>
  );
};
  
export default LifecycleChart;
