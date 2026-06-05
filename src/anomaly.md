---
theme: dashboard
toc: false
---

# Anomaly Detection

```js
import { fetchABSData, detectAnomalies } from "./components/abs-toolkit.js";
```

```js
const API_KEY = view(Inputs.text({
    placeholder: "Enter ABS dataset ID e.g. AUSTRALIAN_INDUSTRY, CWD",
    label: "Dataset ID",
    value: "AUSTRALIAN_INDUSTRY"
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
const threshold = view(Inputs.range([1, 4], {
    step: 0.1,
    value: 2,
    label: "Anomaly Threshold (Z-score)"
}))
```

```js
const withAnomalies = detectAnomalies(filtered, "value", threshold)
```

```js
const anomalyCount = withAnomalies.filter(d => d.anomaly).length
```

```js
Plot.plot({
    title: `Anomaly Detection — ${API_KEY}`,
    marginLeft: 80,
    width,
    x: {label: "Year"},
    y: {label: "Value", grid: true},
    marks: [
        Plot.ruleX(["2020", "2021", "2022"], {
            stroke: "red",
            strokeDasharray: "4 2",
            strokeOpacity: 0.4
        }),
        Plot.text(["2020", "2021", "2022"], {
            x: d => d,
            y: 0,
            text: d => d === "2020" ? "COVID" : d === "2021" ? "Vaccine" : "Omicron",
            rotate: -90,
            fontSize: 9,
            fill: "red",
            textAnchor: "start",
            dy: 4
        }),
        Plot.lineY(withAnomalies, {
            x: "time",
            y: "value",
            stroke: "steelblue",
            strokeWidth: 2
        }),
        Plot.dot(withAnomalies.filter(d => !d.anomaly), {
            x: "time",
            y: "value",
            fill: "steelblue",
            r: 4,
            tip: true,
            title: d => `${d.time}: ${d.value}\nZ-score: ${d.zscore.toFixed(2)}`
        }),
        Plot.dot(withAnomalies.filter(d => d.anomaly), {
            x: "time",
            y: "value",
            fill: "red",
            stroke: "darkred",
            r: 8,
            tip: true,
            title: d => `⚠️ ANOMALY\n${d.time}: ${d.value}\nZ-score: ${d.zscore.toFixed(2)}`
        }),
        Plot.text(withAnomalies.filter(d => d.anomaly), {
            x: "time",
            y: "value",
            text: d => `⚠️ ${d.time}`,
            dy: -15,
            fontSize: 11,
            fill: "red",
            fontWeight: "bold"
        })
    ]
})
```

```js
htl.html`<div style="padding: 1rem; border: 1px solid #ffcccc; border-radius: 8px; margin-top: 1rem;">
    <strong>🔍 Anomaly Summary</strong><br/>
    <p>Detected <strong>${anomalyCount}</strong> anomalous periods out of <strong>${withAnomalies.length}</strong> data points using a Z-score threshold of <strong>±${threshold}</strong>.</p>
    ${withAnomalies.filter(d => d.anomaly).map(d =>
        htl.html`<p>⚠️ <strong>${d.time}</strong> — Value: ${d.value}, Z-score: ${d.zscore.toFixed(2)}</p>`
    )}
</div>`
```