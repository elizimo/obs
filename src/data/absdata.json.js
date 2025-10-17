async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return await response.json();
}

const data = await json(`https://data.api.abs.gov.au/rest/data/AUSTRALIAN_INDUSTRY/all?format=jsondata`);

process.stdout.write(JSON.stringify(data));