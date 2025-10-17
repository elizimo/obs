---
theme: dashboard
toc: false
---


# ABS Data

```js
const absdata = FileAttachment("./data/absdata.json").json();
```

```js
absdata
```

```js
function transformABSData(absData) {
  const dataset = absData.data.dataSets[0];
  const structure = absData.data.structures[0];
  const series = dataset.series;
  const dimensions = structure.dimensions.series;

  // Get the time periods from the observation dimension metadata
  const observationDimension = structure.dimensions.observation.find(d => d.id === "TIME_PERIOD");
  const timeValues = observationDimension?.values || [];

  // Build a lookup for dimension values (e.g., measure, industry, region)
  const dimLookups = dimensions.map(dim =>
    Object.fromEntries(dim.values.map((v, i) => [i, v.name]))
  );

  const result = [];

  for (const seriesKey in series) {
    const seriesObj = series[seriesKey];
    const keyParts = seriesKey.split(":").map(Number);

    // Map series dimensions to labels
    const seriesData = {};
    dimensions.forEach((dim, i) => {
      const valIdx = keyParts[i];
      seriesData[dim.name.toLowerCase()] = dimLookups[i][valIdx];
    });

    // Observations (time series data)
    const observations = seriesObj.observations;
    for (const obsKey in observations) {
      const [value] = observations[obsKey];
      if (value === null) continue;

      // Convert obsKey (index) to actual year using timeValues metadata
      const timeIndex = parseInt(obsKey, 10);
      const timeMeta = timeValues[timeIndex];
      const year = timeMeta?.name || timeMeta?.id || obsKey; // Fallback if missing

      result.push({
        ...seriesData,
        time: year,  // Replaces index with actual year (e.g., "2024")
        value: value
      });
    }
  }

  return result;
}

```

```js
const transdata = transformABSData(absdata)
```

```js
var selected = view(Inputs.table(transdata))
```

```js
selected
```

```js
const wages = transdata.filter(x => x.measure=="Wages and salaries (including capitalised wages)")
```

```js
Plot.plot({
    title: "Wages and Salaries",
    marginLeft: 60,
    // width,
    x: {label: null},
    // y: {grid: true, inset: 10},
    marks: [
      Plot.lineY(wages, {
        x: "time",
        y: "value",
        // z: null, // varying color, not series
        stroke: "industry",
        tip: "x"
      })
        // Plot.ruleY([x]),
    ]
  })
```

```js
const search = view(Inputs.search(wages, {placeholder: "Search data"}));
```

```js
Inputs.table(search)
```

```js
Plot.plot({
    title: "Wages and Salaries",
    marginLeft: 60,
    // width,
    x: {label: null},
    // y: {grid: true, inset: 10},
    marks: [
      Plot.lineY(search, {
        x: "time",
        y: "value",
        fx: "basis",  // facets for seperating data
        fy: "region",
        // z: null, // varying color, not series
        stroke: "industry",
        tip: true,
        channels: {basis: "basis", region: "region", frequency: "frequency"
        },
        // strokeOpacity: 0.5,
      })
        // Plot.ruleY([x]),
    ]
  })
```