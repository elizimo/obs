---
theme: dashboard
toc: false
---

# ABS Datasets

```js
const dataflows = FileAttachment("./data/dataflows.json").json()
```

```js
const search = view(Inputs.search(dataflows, {placeholder: "Search ABS datasets..."}))
```

```js
const selected = view(Inputs.table(search, {
    width: "100%",
    rows: 20,
    columns: ["id", "name"],
    header: {
        id: "ID",
        name: "Name"
    },
    widths: {
        id: 200,
        name: 500
    },
    layout: "auto"
}))
```

```js
selected.length > 0 ? htl.html`
    <div>
        ${selected.map(d => htl.html`
            <div style="padding: 1rem; border: 1px solid #ccc; border-radius: 8px; margin-top: 1rem;">
                <h3 style="margin: 0 0 0.5rem 0">${d.name}</h3>
                <code style="font-size: 0.8rem; color: gray">${d.id}</code>
                <p style="margin-top: 0.5rem">${d.description}</p>
            </div>
        `)}
    </div>
` : htl.html`<p style="color: gray">Select rows to see full details</p>`
```