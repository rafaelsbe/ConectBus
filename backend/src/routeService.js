import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from '@xmldom/xmldom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routeDataPath = path.join(__dirname, '..', 'data', 'routes.json');
const routeDetailsPath = path.join(__dirname, '..', 'data', 'routeDetails.json');
const routeSources = JSON.parse(readFileSync(routeDataPath, 'utf8'));
const routeDetails = existsSync(routeDetailsPath)
  ? JSON.parse(readFileSync(routeDetailsPath, 'utf8'))
  : {};
const geometryCache = new Map();

export function getRouteSource(code) {
  const source = routeSources[code];
  if (!source) return null;

  return {
    sourceId: source.sourceId,
    modifiedAt: routeDetails[code]?.modifiedAt || source.modifiedAt,
    sourceUrl: `https://smtt.aracaju.se.gov.br/wp-json/wp/v2/linha_onibus/${source.sourceId}`,
  };
}

export function getRouteDetails(code) {
  return routeDetails[code] || null;
}

export function parseKmlRoute(xml) {
  const document = new DOMParser().parseFromString(xml, 'text/xml');
  const collection = kml(document);
  collection.features = collection.features.filter((feature) => feature.geometry);
  return collection;
}

export async function getRouteGeometry(code) {
  const source = routeSources[code];
  if (!source) return null;
  if (routeDetails[code]?.geometry) return routeDetails[code].geometry;
  if (geometryCache.has(code)) return geometryCache.get(code);

  const url = new URL('https://www.google.com/maps/d/kml');
  url.searchParams.set('mid', source.mapId);
  url.searchParams.set('forcekml', '1');

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`A origem da rota respondeu com HTTP ${response.status}.`);
  }

  const geometry = parseKmlRoute(await response.text());
  if (geometry.features.length === 0) {
    throw new Error('A origem não retornou geometria para esta linha.');
  }

  geometryCache.set(code, geometry);
  return geometry;
}