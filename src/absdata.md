---
theme: dashboard
toc: false
---

# ABS Data

```js
import { fetchABSData } from "./components/data-transformer.js";
const transdata = await fetchABSData("AUSTRALIAN_INDUSTRY")
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

# Testing Section
```js
const testraw = await fetch("https://data.api.abs.gov.au/rest/data/CWD/all?format=jsondata").then(r => r.json())
```

```js
testraw
```