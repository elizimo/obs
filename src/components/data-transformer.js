// Function to transform ABS data into a format usable for observable.
// Input: Raw JSON data from ABS API
// Output: Array of objects with dimensions and time series values
function transformABSData(absData) {
	const dataset = absData.data.dataSets[0];
	const structure = absData.data.structures[0];
	const series = dataset.series;
	const dimensions = structure.dimensions.series;

	// Get the time periods from the observation dimension metadata
	const observationDimension = structure.dimensions.observation.find(d => d.id === "TIME_PERIOD");
	const timeValues = observationDimension?.values || [];

	// Build a lookup for dimension values (e.g., measure, industry, region)
	const dimLookups = dimensions.map(dim => Object.fromEntries(dim.values.map((v, i) => [i, v.name])));

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


// Function to fetch JSON data from a given API ID
// Input: API_KEY (string)
// Output: JSON data from ABS API
export async function fetchABSData(API_KEY) {
    const url = `https://data.api.abs.gov.au/rest/data/${API_KEY}/all?format=jsondata`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
    const json = await response.json();
    return transformABSData(json);
}