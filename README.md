# Custom Timeseries

Plots custom timestamp values sent to New Relic (instead of ingest timestamps). Useful to backfill timeseries charts with your own timestamps. Maintains any dashboard filters that are applied

## Getting Started Locally

```
npm install
npm start
```

Visit https://one.newrelic.com/?nerdpacks=local and :sparkles:

## Dashboard Deployment
Generate a new uuid (profile is optional):

```
nr1 nerdpack:uuid -gf --profile=profile
```

Publish & Subscribe:

```
nr1 nerdpack:publish --profile=profile
nr1 nerdpack:subscribe --profile=profile
```

Visit https://one.newrelic.com -> Apps -> Custom Visualizations -> Custom Timeseries
