import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartLabel,
  ChartTooltip,
  ChartVoronoiContainer,
} from '@patternfly/react-charts';
import { Card } from '@patternfly/react-core';

interface LifecycleChartProps {
  lifecycleData: { x: string; y0: Date; y: Date; packageType: string }[][];
}

const LifecycleChart: React.FC<LifecycleChartProps> = ({ lifecycleData }: LifecycleChartProps) => {
  const formatDate = (date: Date, isTime: boolean) => {
    const dateString = date?.toLocaleDateString('en-US', { year: 'numeric' });
    const timeString = date?.toLocaleTimeString('en-US', { hour12: false });
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
    <Card>
      <div style={{ height: '400px', width: '450px' }}>
        <Chart
          ariaDesc="Support timelines of packages and RHEL versions"
          ariaTitle="Lifecycle bar chart"
          containerComponent={
            <ChartVoronoiContainer
              labelComponent={
                <ChartTooltip constrainToVisibleArea labelComponent={<ChartLabel dx={-65} textAnchor="start" />} />
              }
              labels={({ datum }) =>
                `Package: ${datum.x}\npackageType: ${datum.packageType}\nStart: ${formatDate(
                  new Date(datum.y0),
                  true
                )}\nEnd: ${formatDate(new Date(datum.y), true)}`
              }
            />
          }
          domainPadding={{ x: [20, 20], y: [40, 40] }}
          legendData={[
            { name: 'Supported', symbol: { fill: 'var(--pf-v5-global--success-color--100)' } },
            { name: 'Support ends within 6 months', symbol: { fill: 'var(--pf-v5-global--warning-color--100)' } },
            { name: 'Retired', symbol: { fill: 'var(--pf-v5-global--danger-color--100)' } },
            { name: 'Not installed', symbol: { fill: 'var(--pf-v5-global--palette--blue-200)' } },
            { name: 'Upcoming release', symbol: { fill: 'var(--pf-v5-global--palette--blue-100)' } },
          ]}
          legendPosition="bottom-left"
          height={400}
          name="chart5"
          padding={{
            bottom: 80, // Adjusted to accommodate legend
            left: 200,
            right: 50, // Adjusted to accommodate tooltip
            top: 50,
          }}
          width={900}
        >
          <ChartAxis
            dependentAxis
            showGrid
            tickFormat={(t: string | number | Date) => new Date(t).toLocaleDateString('en-US', { year: 'numeric' })}
            tickValues={[
              new Date('2023'),
              new Date('2024'),
              new Date('2025'),
              new Date('2026'),
              new Date('2027'),
              new Date('2028'),
              new Date('2029'),
              new Date('2030'),
              new Date('2031'),
              new Date('2032'),
              new Date('2033'),
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
    </Card>
  );
};

export default LifecycleChart;
