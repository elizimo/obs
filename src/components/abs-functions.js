
/**
* Function to transform ABS data into a format usable for observable.
 * @param {Object} absData - The raw data object returned from the ABS API.
 * @returns {Array} An array of objects with properties: measure, industry, region, time, value.
 */

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

/**
 * Fetches JSON data from the ABS API for a given API key.
 * @param {string} API_KEY - The API key for the ABS data.
 * @returns {Promise<Array>} A promise resolving to the transformed ABS data.
 */
export async function fetchABSData(API_KEY) {
    const url = `https://data.api.abs.gov.au/rest/data/${API_KEY}/all?format=jsondata`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
    const json = await response.json();
    return transformABSData(json);
}

/**
 * Function to calculate the mean of an array of numbers.
 * @param {Array<number>} values - An array of numbers.
 * @returns {number} The mean (average) of the input values.
 */
function mean(values) {
	const sum = values.reduce((acc, val) => acc + val, 0);
	return sum / values.length;
}

/**
 * Function to calculate the standard deviation of an array of numbers.
 * @param {Array<number>} values - An array of numbers.
 * @returns {number} The standard deviation of the input values.
 */
function standardDeviation(values) {
	const avg = mean(values);
	const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
	return Math.sqrt(variance);
}

/**
 * Function to calculate z-scores for an array of numbers.
 * @param {Array<number>} values - An array of numbers.
 * @returns {Array<number>} An array of z-scores corresponding to the input values.
 */
function calculateZScores(values) {
	const avg = mean(values);
	const stdDev = standardDeviation(values);
	
	if (stdDev === 0) {
		// If all values are the same, return an array of zeros (or handle as needed)
		return values.map(() => 0);
	}

	return values.map(value => (value - avg) / stdDev);
}

/**
 * Function to detect anomalies based on z-score and a given threshold.
 * @param {Array<Object>|Array<number>} data - An array of data objects or numbers.
 * @param {string|number} [valueFieldOrThreshold="value"] - The field to analyse or threshold if passing numbers.
 * @param {number} [threshold=3] - The z-score threshold for anomaly detection.
 * @returns {Array<Object>} The original data objects enriched with zscore and anomaly fields.
 */
export function detectAnomalies(data, valueField = "value", threshold = 2) {
  const values = data.map(d => d[valueField]);
  const zScores = calculateZScores(values);

  return data.map((d, i) => ({
    ...d,
    zscore: zScores[i],
    anomaly: Math.abs(zScores[i]) > threshold
  }));
}