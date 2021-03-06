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
} from "nr1";

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
      console.log({ x, y });
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
      <NerdletStateContext.Consumer>
        {(nerdletState) => {
          const { filters } = nerdletState;

          let filteredQuery = query;
          if (filters) {
            filteredQuery += ` WHERE ${filters}`;
          }
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
                console.log({ nerdletState });
                if (data) {
                  const formattedData = this.formatTimeseries(data, filters);
                  return chartType === "line" || !chartType ? (
                    <LineChart data={formattedData} fullHeight fullWidth />
                  ) : (
                    <AreaChart data={formattedData} fullHeight fullWidth />
                  );
                }
              }}
            </NrqlQuery>
          );
        }}
      </NerdletStateContext.Consumer>
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
