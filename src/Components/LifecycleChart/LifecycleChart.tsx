import * as React from "react";
import "@patternfly/react-core/dist/styles/base.css";
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartLine,
  ChartTooltip,
  ChartLegend,
  ChartVoronoiContainer,
  createContainer,
  getInteractiveLegendEvents,
  getInteractiveLegendItemStyles,
  ChartLegendTooltip,
} from "@patternfly/react-charts";
import { SystemLifecycleChanges } from "../../types/SystemLifecycleChanges";
import { Stream } from "../../types/Stream";

interface LifecycleChartProps {
  lifecycleData: Stream[] | SystemLifecycleChanges[];
}

interface ChartDataObject {
  x: string;
  y0: Date;
  y: Date;
  packageType: string;
}

const LifecycleChart: React.FC<LifecycleChartProps> = ({
  lifecycleData,
}: LifecycleChartProps) => {
  //check data type and contruct a chart array
  const checkDataType = (
    lifecycleData: Stream[] | SystemLifecycleChanges[]
  ) => {
    if (!lifecycleData || lifecycleData.length === 0) {
      return "";
    }
    if ("arch" in lifecycleData[0]) {
      return "appLifecycle";
    }
    return "lifecycle";
  };

  const dataType = checkDataType(lifecycleData);
  const updatedLifecycleData: ChartDataObject[][] = []; // series in the patternfly example
  const years: { [key: string]: Date } = {};
  const [hiddenSeries, setHiddenSeries] = React.useState<Set<number>>(
    new Set()
  );

  const getChartNames = (): [string | string[]] => {
    if (updatedLifecycleData.length === 0) {
      return [[]]; // Return an array with an empty array if there's no data
    }
    return updatedLifecycleData.map((_, index) => [`bar-${index}`]) as [
      string | string[]
    ];
  };

  // Get onMouseOver, onMouseOut, and onClick events for the interactive legend
  const getEvents = () =>
    getInteractiveLegendEvents({
      chartNames: getChartNames(),
      isHidden: (index) => hiddenSeries.has(index),
      legendName: "lifecycle-chart-legend",
      onLegendClick: handleLegendClick,
    });

  // Hide each data series individually
  const handleLegendClick = (props: { index: number }) => {
    if (!hiddenSeries.delete(props.index)) {
      hiddenSeries.add(props.index);
    }
    setHiddenSeries(new Set(hiddenSeries));
  };

  // Get legend data styled per hiddenSeries
  const getLegendData = () => {
    return updatedLifecycleData.map((_, index) => {
      return {
        childName: `bar-${index}`, // Sync tooltip legend with the series associated with given chart name
        name: `Package ${index + 1}`, // Example name, adjust as needed
        ...getInteractiveLegendItemStyles(hiddenSeries.has(index)), // hidden styles
      };
    });
  };

  // Returns true if data series is hidden
  const isHidden = (index: number) => {
    return hiddenSeries.has(index);
  };

  // Note: Container order is important
  const CursorVoronoiContainer = createContainer("voronoi", "cursor");

  

  const formatChartData = (
    name: string,
    startDate: string,
    endDate: string,
    packageType: string
  ) => {
    updatedLifecycleData.push([
      {
        x: name,
        y0: new Date(startDate),
        y: new Date(endDate),
        packageType,
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
    const startYear = new Date(start).toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
    });
    const endYear = endDate.toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
    });
    years[startYear] = new Date(`January 1 ${startYear}`);
    years[endYear] = new Date(`January 1 ${endYear}`);
    if (endDate.getMonth() > 0) {
      endDate.setFullYear(endDate.getFullYear() + 1);
      const endDateAsString = endDate.toLocaleDateString("en-US", {
        timeZone: "UTC",
        year: "numeric",
      });
      years[endDateAsString] = new Date(`January 1 ${endDateAsString}`);
    }
  };

  const constructLifecycleData = (
    lifecycleData: Stream[] | SystemLifecycleChanges[]
  ) => {
    if (!dataType) {
      return;
    }
    if (dataType === "appLifecycle") {
      (lifecycleData as Stream[]).forEach((item) => {
        if (
          item.start_date === "Unknown" ||
          item.end_date === "Unknown" ||
          item.rhel_major_version === 8
        ) {
          return;
        }
        formatChartData(
          `${item.name} ${item.stream}`,
          item.start_date,
          item.end_date,
          "Supported"
        );
        formatYearAxisData(item.start_date, item.end_date);
      });
    } else {
      (lifecycleData as SystemLifecycleChanges[]).forEach((item) => {
        if (
          item.release_date === "Unknown" ||
          item.retirement_date === "Unknown"
        ) {
          return;
        }
        formatChartData(
          item.name,
          item.release_date,
          item.retirement_date,
          "Supported"
        );
        formatYearAxisData(item.release_date, item.retirement_date);
      });
    }
    addInterstitialYears(years);
  };

  constructLifecycleData(lifecycleData);




  const formatDate = (date: Date) => {
    const dateString = date?.toLocaleDateString("en-US", { timeZone: "UTC" });
    return dateString;
  };

  const getPackageColor = (datum: string) => {
    switch (datum) {
      case "Retired":
        return "var(--pf-v5-global--danger-color--100)";
      case "Support ends within 6 months":
        return "var(--pf-v5-global--warning-color--100)";
      case "Not installed":
        return "var(--pf-v5-global--palette--blue-200)";
      case "Supported":
        return "var(--pf-v5-global--success-color--100)";
      case "Upcoming release":
        return "var(--pf-v5-global--palette--blue-100)";
      default:
        return "var(--pf-v5-global--default-color--300)";
    }
  };

  const getChart = (lifecycle: ChartDataObject[], index: number) => {
    const data: any[] = [];

    lifecycle?.forEach((datum: { packageType: string; x: string }) => {
      data.push({
        ...datum,
        name: datum.x,
        x: (index += 1),
        fill: getPackageColor(datum.packageType),
      });
    });

    if (data?.length === 0) {
      return null;
    }
    return (
      <ChartBar
        data={data}
        key={`bar-${index}`}
        style={{
          data: {
            fill: ({ datum }) => datum.fill,
            stroke: ({ datum }) => datum.fill,
          },
        }}
      />
    );
  };

  const fetchTicks = () => {
    return updatedLifecycleData.map((data) => {
      return data[0].x;
    });
  };

  const cursorVoronoiContainer = (
    <CursorVoronoiContainer
      cursorDimension="x"
      labels={({ datum }: { datum: ChartDataObject }) =>
        `Name: ${datum.x}\nSupport Type: ${
          datum.packageType
        }\nStart: ${formatDate(new Date(datum.y0))}\nEnd: ${formatDate(
          new Date(datum.y)
        )}`
      }
      labelComponent={
        <ChartTooltip constrainToVisibleArea />
      }
      mouseFollowTooltips
      voronoiDimension="x"
    />
  );

  return (
    <div className="drf-lifecycle__chart" tabIndex={0}>
      <Chart
        legendAllowWrap
        ariaDesc="Support timelines of packages and RHEL versions"
        ariaTitle="Lifecycle bar chart"
        containerComponent={
          cursorVoronoiContainer
        }
        events={getEvents()}
        legendComponent={<ChartLegend name={'lifecycle-chart-legend'} data={getLegendData()} />}
        legendPosition="bottom-left"
        name="lifecycle-chart"
        padding={{
          bottom: 100, // Adjusted to accommodate legend
          left: 160,
          right: 50, // Adjusted to accommodate tooltip
          top: 50,
        }}
        // adjust this by number of items
        height={updatedLifecycleData.length * 15 + 300}
        width={900}
      >
        {Object.values(years).length > 0 && (
          <ChartAxis
            dependentAxis
            showGrid
            tickValues={Object.values(years)}
            tickFormat={(t: Date) =>
              t.toLocaleDateString("en-US", { year: "numeric" })
            }
          />
        )}
        <ChartAxis showGrid tickValues={fetchTicks()} />
        <ChartGroup horizontal>
          {updatedLifecycleData.map((data, index) => getChart(data, index))}
        </ChartGroup>
        <ChartLine
          y={() => Date.now()}
          y0={() => Date.now()}
          style={{
            data: {
              stroke: "black",
              strokeWidth: 0.5,
            },
          }}
        />
      </Chart>
    </div>
  );
};

export default LifecycleChart;
