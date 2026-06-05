---
theme: dashboard
toc: false
---

# ABS Data Explorer

```js
import { fetchABSData } from "./components/abs-toolkit.js";
```

```js
const API_KEY = view(Inputs.text({
    placeholder: "Enter ABS dataset ID e.g. CWD, BUILDING_ACTIVITY",
    label: "Dataset ID",
    value: "CWD"
}))
```

```js
const data = API_KEY ? await fetchABSData(API_KEY) : []
```

```js
const dimensions = data.length > 0
    ? Object.keys(data[0]).filter(k => k !== "time" && k !== "value")
    : []
```

```js
const form = view(Inputs.form(
    Object.fromEntries(
        dimensions.map(dim => [
            dim,
            Inputs.select(["All", ...new Set(data.map(d => d[dim]))], {label: dim})
        ])
    )
))
```

```js
const filtered = data.filter(d =>
    dimensions.every(dim => form[dim] === "All" || d[dim] === form[dim])
)
```

```js
Plot.plot({
    title: API_KEY,
    marginLeft: 80,
    width,
    x: {label: "Time"},
    y: {label: "Value", grid: true},
    marks: [
        Plot.lineY(filtered, {
            x: "time",
            y: "value",
            stroke: dimensions[0],
            tip: true
        })
    ]
})
```

```js
Inputs.table(filtered)
```