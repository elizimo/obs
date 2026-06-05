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
    if (stdDev === 0) return values.map(() => 0);
    return values.map(value => (value - avg) / stdDev);
}

/**
 * Function to detect anomalies based on z-score and a given threshold.
 * @param {Array<Object>} data - Array of data objects.
 * @param {string} [valueField="value"] - The field to analyse.
 * @param {number} [threshold=3] - The z-score threshold for anomaly detection.
 * @returns {Array<Object>} The original data objects enriched with zscore and anomaly fields.
 */
export function detectAnomalies(data, valueField = "value", threshold = 3) {
    const values = data.map(d => d[valueField]);
    const zScores = calculateZScores(values);
    return data.map((d, i) => ({
        ...d,
        zscore: zScores[i],
        anomaly: Math.abs(zScores[i]) > threshold
    }));
}

/**
 * Transforms raw ABS JSON data into a flat array of objects.
 * @param {Object} absData - Raw ABS API JSON response.
 * @returns {Array<Object>} Transformed flat array of data objects.
 */
export function transformABSData(absData) {
    const dataset = absData.data.dataSets[0];
    const structure = absData.data.structures[0];
    const series = dataset.series;
    const dimensions = structure.dimensions.series;
    const observationDimension = structure.dimensions.observation.find(d => d.id === "TIME_PERIOD");
    const timeValues = observationDimension?.values || [];
    const dimLookups = dimensions.map(dim =>
        Object.fromEntries(dim.values.map((v, i) => [i, v.name]))
    );
    const result = [];
    for (const seriesKey in series) {
        const seriesObj = series[seriesKey];
        const keyParts = seriesKey.split(":").map(Number);
        const seriesData = {};
        dimensions.forEach((dim, i) => {
            const valIdx = keyParts[i];
            seriesData[dim.name.toLowerCase()] = dimLookups[i][valIdx];
        });
        const observations = seriesObj.observations;
        for (const obsKey in observations) {
            const [value] = observations[obsKey];
            if (value === null) continue;
            const timeIndex = parseInt(obsKey, 10);
            const timeMeta = timeValues[timeIndex];
            const year = timeMeta?.name || timeMeta?.id || obsKey;
            result.push({ ...seriesData, time: year, value: value });
        }
    }
    return result;
}

/**
 * Fetches and transforms ABS data for a given dataset ID.
 * @param {string} API_KEY - The ABS dataset ID e.g. "AUSTRALIAN_INDUSTRY"
 * @returns {Array<Object>} Transformed flat array of data objects.
 */
export async function fetchABSData(API_KEY) {
    const url = `https://data.api.abs.gov.au/rest/data/${API_KEY}/all?format=jsondata`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
    const json = await response.json();
    return transformABSData(json);
}