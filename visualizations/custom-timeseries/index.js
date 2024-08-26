import React, {useState, useEffect, useContext} from "react";
import {
  NrqlQuery,
  Spinner,
  LineChart,
  AreaChart,
  NerdletStateContext,
  PlatformStateContext
} from "nr1";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const TimeseriesViz = (props) => {
  let { chartType, queries } = props;
  const platformContext = useContext(PlatformStateContext);
  const nerdletContext = useContext(NerdletStateContext);
  const [nrqlResults, setNrqlResults] = useState(null);
  const [loading, setLoading] = useState(true);

  if (chartType == null) {
    chartType = 'line';
  }

  //render as long as at least 1 query + options configured
  let nrqlQueriesAvailable = queries && queries[0] && queries[0].accountId && queries[0].query && queries[0].selectUnit && queries[0].timestampUnit && queries[0].legend;

  const formatTimeData = (data, qs) => {
    let timeData = [];

    for (let i=0; i<data.length; i++) {
      let chartTitle = qs[i].legend;

      if (nerdletContext) {
        if (nerdletContext.filters) {
          chartTitle += ` WHERE ${nerdletContext.filters}`;
        }
      }

      let aSeries = {
        metadata: {
          id: `series-${i+1}`,
          name: chartTitle,
          color: qs[i].lineColor ? qs[i].lineColor : 'green',
          viz: "main",
          units_data: {
            x: "TIMESTAMP",
            y: qs[i].selectUnit
          },
        },
        data: [],
      };

      for (let r of data[i].data) {
        let x = null;
        if (qs[i].timestampUnit == "SECONDS") {
          x = Number(r.metadata.name) * 1000;
        }

        if (qs[i].timestampUnit == "MILLISECONDS") {
          x = Number(r.metadata.name);
        }
        let y = r.data[0].y;
        // console.log({ x, y });
        if (!isNaN(x)) {
          aSeries.data.push({ x: x, y: y });
        }
      }

      let sorted = aSeries.data.sort(function (x, y) {
        return y.x - x.x;
      });

      aSeries.data = sorted;
      timeData.push(aSeries);
    }

    return timeData;

  }

  const fetchData = async () => {
    let allData = [];
    for (let c=0; c<queries.length; c++) {
      let filteredQuery = queries[c].query;

      let since = '';

      if (platformContext && platformContext.timeRange) {
        if (platformContext.timeRange.duration) {
          since = ` since ${platformContext.timeRange.duration / 60 / 1000} MINUTES AGO`;
        } else if (platformContext.timeRange.begin_time && platformContext.timeRange.end_time) {
          since = ` since ${platformContext.timeRange.begin_time} until ${platformContext.timeRange.end_time}`;
        }
      }

      if (since !== '') {
        filteredQuery += since;
      }

      if (nerdletContext) {
        if (nerdletContext.filters) {
          filteredQuery += ` WHERE ${nerdletContext.filters} `;
        }
      }
      let resp = await NrqlQuery.query({ accountIds: [queries[c].accountId], query: filteredQuery });
      allData.push(resp);
    }

    return allData;
  }

  if (nrqlQueriesAvailable) {

    useEffect(async () => {
      let data = await fetchData();
      setNrqlResults(data);
      setLoading(false);
    }, [platformContext, nerdletContext, queries]);

    if (nrqlResults && !loading) {
      if (chartType == 'line') {
        const formattedData = formatTimeData(nrqlResults, queries);
        return <LineChart data={formattedData} fullHeight fullWidth />
      }
      if (chartType == 'area') {
        const formattedData = formatTimeData(nrqlResults, queries);
        return <AreaChart data={formattedData} fullHeight fullWidth />
      }
    }

    if (loading) {
      return <Spinner />
    }

    return <Spinner />


  } else {
    return <h1>Check configuration fields</h1>
  }
}

export default TimeseriesViz;
