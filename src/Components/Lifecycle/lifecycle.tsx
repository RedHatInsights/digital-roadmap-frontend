import React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { Chart, ChartAxis, ChartBar, ChartGroup, ChartLabel, ChartTooltip, ChartVoronoiContainer } from '@patternfly/react-charts';
import {Card} from '@patternfly/react-core'; 


const LifecycleTab: React.FC<React.PropsWithChildren> = () => {

    // Start = y0, end = y
    const alerts = [
      [
        {x: "Node.js 16", y0: new Date("2023-01"), y: new Date("2024-06"), packageType: 'Retired' }
      ],
      [
        {x: "gcc-toolset 12", y0: new Date("2023-01"), y: new Date("2025-10"), packageType: 'Support ends within 6 months' }
      ],
      [
        {x: "Ruby 3.1", y0: new Date("2024-08"), y: new Date("2025-06"), packageType: 'Not installed' }
      ],
      [
        {x: "gcc-toolset 12", y0: new Date("2023-01"), y: new Date("2027-10"), packageType: 'Supported' }
      ],
      [
        {x: "Ruby 3.0", y0: new Date("2024-08"), y: new Date("2025-06"), packageType: 'Upcoming release' }
      ],      
    ];

    // const getPackages = (alert: any[], index: number) => {
    //   const data: any[] = [];
    //   alert?.map((datum: { x: string; }) => {
    //     data = datum.x
    //   }
    // }

    const formatDate = (date: Date, isTime: boolean) => {
      const dateString = date?.toLocaleDateString("en-US", { year: 'numeric' });
      const timeString = date?.toLocaleTimeString("en-US", { hour12: false });
      return isTime ? `${dateString} ${timeString}` : dateString;
    };

    const getChart = (alert: any[], index: number) => {
      const data: any[] = [];

      alert?.map((datum: { packageType: string; }) => {
        data.push({
          ...datum,
          x: alerts.length - index,
          fill: datum.packageType === "Retired"
            ? "var(--pf-v5-global--danger-color--100)"
            : datum.packageType === "Support ends within 6 months"
              ? "var(--pf-v5-global--warning-color--100)"
              : datum.packageType === "Not installed"
                ? "var(--pf-v5-global--palette--blue-200)"
                : datum.packageType === "Supported"
                  ? "var(--pf-v5-global--success-color--100)"
                    : datum.packageType === "Upcoming release"
                      ? "var(--pf-v5-global--palette--blue-100)"
                      : "var(--pf-v5-global--default-color--300)",
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
            }
          }}
        />
      );
    };

    return (
      <Card>
        <div style={{ height: "400px", width: "450px" }}>
          <Chart
            ariaDesc="Support timelines of packages and RHEL versions"
            ariaTitle="Lifecycle bar chart"
            containerComponent={
              <ChartVoronoiContainer
                labelComponent={
                  <ChartTooltip constrainToVisibleArea labelComponent={<ChartLabel dx={-65} textAnchor="start" />} />
                }
                labels={({ datum }) => `Package: ${datum.x}\npackageType: ${datum.packageType}\nStart: ${formatDate(new Date(datum.y0), true)}\nEnd: ${formatDate(new Date(datum.y), true)}`}
              />
            }
            domainPadding={{ x: [20, 20], y: [40, 40] }}
            legendData={[
              { name: "Supported", symbol: { fill: "var(--pf-v5-global--success-color--100)" } },
              { name: "Support ends within 6 months", symbol: { fill: "var(--pf-v5-global--warning-color--100)" } },
              { name: "Retired", symbol: { fill: "var(--pf-v5-global--danger-color--100)" } },
              { name: "Not installed", symbol: { fill: "var(--pf-v5-global--palette--blue-200)" } },
              { name: "Upcoming release", symbol: { fill: "var(--pf-v5-global--palette--blue-100)" } }
            ]}
            legendPosition="bottom-left"
            height={500}
            name="chart5"
            padding={{
              bottom: 80, // Adjusted to accommodate legend
              left: 200,
              right: 50, // Adjusted to accommodate tooltip
              top: 50
            }}
            width={900}
          >
            <ChartAxis
              dependentAxis
              showGrid
              tickFormat={(t: string | number | Date) => new Date(t).toLocaleDateString("en-US", { year: 'numeric' })}
              tickValues={[new Date("2023"), new Date("2024"), new Date("2025"), new Date("2026"), new Date("2027"), new Date("2028"), new Date("2029"), new Date("2030"), new Date("2031"), new Date("2032"), new Date("2033")]}
            />
            <ChartAxis
              
              showGrid
              tickValues={["Node.js 16", "gcc-toolset 12", "Ruby 3.1", "gcc-toolset 12", "Ruby 3.0"]}
            />

            <ChartGroup horizontal>
              {alerts.map((alert, index) => getChart(alert, index))}
            </ChartGroup>
          </Chart>
        </div>
      </Card>
    );
};


export default LifecycleTab;