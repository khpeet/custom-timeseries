import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  LineChart,
  AreaChart,
  NerdletStateContext,
  PlatformStateContext
} from "nr1";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default class CustomTimeseriesVisualization extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    //title: PropTypes.string,
    query: PropTypes.string,
    accountId: PropTypes.number,
    legend: PropTypes.string,
    lineColor: PropTypes.string,
    selectUnit: PropTypes.string,
    timestampUnit: PropTypes.object,
    chartType: PropTypes.string,
  };

  formatTimeseries(d, filters) {
    let chartTitle = this.props.legend;
    let chartType = this.props.chartType;
    if (filters) {
      chartTitle += ` WHERE ${filters}`;
    }
    let timeData = [
      {
        metadata: {
          id: "series-1",
          name: chartTitle,
          color: this.props.lineColor,
          viz: "main",
          units_data: {
            x: "TIMESTAMP",
            y: this.props.selectUnit,
          },
        },
        data: [],
      },
    ];
    for (let r of d) {
      let x = null;
      if (this.props.timestampUnit == "SECONDS") {
        x = Number(r.metadata.name) * 1000;
      }

      if (this.props.timestampUnit == "MILLISECONDS") {
        x = Number(r.metadata.name);
      }
      let y = r.data[0].y;
      // console.log({ x, y });
      if (!isNaN(x)) {
        timeData[0].data.push({ x: x, y: y });
      }
    }

    let sorted = timeData[0].data.sort(function (x, y) {
      return y.x - x.x;
    });

    timeData[0].data = sorted;

    return timeData;
  }

  formatBarChart(d, filters) {
    let chartTitle = this.props.legend;
    let chartType = this.props.chartType;

    if (filters) {
      chartTitle += ` WHERE ${filters}`;
    }

    let transformed = [];

    for (let r of d) {
      let x = null;
      if (this.props.timestampUnit == "SECONDS") {
        x = Number(r.metadata.name) * 1000;
      }

      if (this.props.timestampUnit == "MILLISECONDS") {
        x = Number(r.metadata.name);
      }
      let y = r.data[0].y;
      // console.log({ x, y });
      if (!isNaN(x)) {
        transformed.push({ x: x, [chartTitle]: y });
      }
    }

    let sorted = transformed.sort(function (x, y) {
      return x.x - y.x;
    });

    transformed = sorted;

    return transformed;
  }

  render() {
    const {
      query,
      accountId,
      legend,
      lineColor,
      selectUnit,
      timestampUnit,
      chartType,
    } = this.props;

    const nrqlQueryPropsAvailable =
      query && legend && lineColor && selectUnit && timestampUnit;
    accountId;

    if (!nrqlQueryPropsAvailable) {
      return <EmptyState />;
    }

    return (
      <>
        <PlatformStateContext.Consumer>
        {platformUrlState => {
          let since = '';

          if (platformUrlState && platformUrlState.timeRange) {
            if (platformUrlState.timeRange.duration) {
              since = ` since ${platformUrlState.timeRange.duration / 60 / 1000} MINUTES AGO`;
            } else if (platformUrlState.timeRange.begin_time && platformUrlState.timeRange.end_time) {
              since = ` since ${platformUrlState.timeRange.begin_time} until ${platformUrlState.timeRange.end_time}`;
            }
          }
          return (
            <NerdletStateContext.Consumer>
              {(nerdletState) => {
                const { filters } = nerdletState;

                let filteredQuery = query;
                if (filters) {
                  filteredQuery += ` WHERE ${filters} `;
                }

                if (since !== '') {
                  filteredQuery += since;
                }
                // console.log(filteredQuery)
                return (
                  <NrqlQuery
                    accountId={accountId}
                    query={filteredQuery}
                    pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
                  >
                    {({ data, loading, error }) => {
                      if (loading) {
                        return <Spinner />;
                      }

                      if (error) {
                        throw new Error(error.message);
                      }
                      // console.log({ nerdletState });
                      if (data) {
                        if (chartType === "line" || !chartType) {
                          const formattedData = this.formatTimeseries(data, filters);
                          return <LineChart data={formattedData} fullHeight fullWidth />
                        }

                        if (chartType === "area") {
                          const formattedData = this.formatTimeseries(data, filters);
                          return <AreaChart data={formattedData} fullHeight fullWidth />
                        }

                        if (chartType === "bar") {
                          const formattedData = this.formatBarChart(data, filters);
                          return (
                            <BarChart
                              width={600}
                              height={400}
                              data={formattedData}
                            >
                              <XAxis dataKey="x" tickFormatter={(date) => {
                                const d = new Date(date);
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const dd = String(d.getDate()).padStart(2, '0');
                                const hour = String(d.getHours()).padStart(2, '0');
                                const min = String(d.getMinutes()).padStart(2, '0');
                                return `${mm}-${dd} ${hour}:${min}`;
                              }} />
                              <YAxis />
                              <Tooltip labelFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleString();
                              }} />
                              <Legend />
                              <Bar dataKey={this.props.legend} fill={this.props.lineColor} />
                            </BarChart>
                          )
                        }
                      }
                    }}
                  </NrqlQuery>
                );
              }}
            </NerdletStateContext.Consumer>
          )
        }}
        </PlatformStateContext.Consumer>
      </>
    );
  }
}

const EmptyState = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Please validate all configuration fields have been filled.
      </HeadingText>
    </CardBody>
  </Card>
);

const ErrorState = () => (
  <Card className="ErrorState">
    <CardBody className="ErrorState-cardBody">
      <HeadingText
        className="ErrorState-headingText"
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Oops! Something went wrong.
      </HeadingText>
    </CardBody>
  </Card>
);
