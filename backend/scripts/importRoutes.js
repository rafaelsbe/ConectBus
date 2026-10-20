import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import { getRouteGeometry } from '../src/routeService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routeSources = JSON.parse(
  await readFile(path.join(__dirname, '..', 'data', 'routes.json'), 'utf8'),
);
const routeDetails = {};

for (const [code, source] of Object.entries(routeSources)) {
  const url = `https://smtt.aracaju.se.gov.br/wp-json/wp/v2/linha_onibus/${source.sourceId}?_fields=id,modified,title,itinerario`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Falha ao importar a linha ${code}: HTTP ${response.status}`);

  const officialLine = await response.json();
  routeDetails[code] = {
    name: parse(officialLine.title.rendered).text.trim(),
    itinerary: parse(officialLine.itinerario).text.trim(),
    sourceUrl: `https://smtt.aracaju.se.gov.br/wp-json/wp/v2/linha_onibus/${source.sourceId}`,
    modifiedAt: officialLine.modified,
    geometry: await getRouteGeometry(code),
  };
  console.log(`Importada linha ${code}`);
}

await writeFile(
  path.join(__dirname, '..', 'data', 'routeDetails.json'),
  `${JSON.stringify(routeDetails, null, 2)}\n`,
);
console.log(`Salvas ${Object.keys(routeDetails).length} linhas em data/routeDetails.json`);
