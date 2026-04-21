// Preloads all datasets available through ABS API at buildtime. 
import { XMLParser } from "fast-xml-parser";

async function json(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
	return await response.text();
}

const xml = await json("https://data.api.abs.gov.au/rest/dataflow/ABS");

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const parsed = parser.parse(xml);

const dataflows = parsed["message:Structure"]["message:Structures"]["structure:Dataflows"]["structure:Dataflow"];

const result = dataflows.map(d => ({
	id: d["@_id"],
	name: d["common:Name"]?.["#text"] || d["common:Name"] || "",
	description: (d["common:Description"]?.["#text"] || d["common:Description"] || "").replace(/^Dataset:.*?\.\s*/, "")
}));

process.stdout.write(JSON.stringify(result));