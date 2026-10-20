import test from 'node:test';
import assert from 'node:assert/strict';
import { getRouteDetails, getRouteGeometry, getRouteSource, parseKmlRoute } from '../src/routeService.js';

test('associa linhas locais à fonte oficial da SMTT', () => {
  const source = getRouteSource('091');
  assert.equal(source.sourceId, 18106);
  assert.match(source.sourceUrl, /linha_onibus\/18106$/);
  assert.equal(getRouteSource('999'), null);
});

test('converte coordenadas KML em GeoJSON no padrão longitude-latitude', () => {
  const xml = '<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>001</name><LineString><coordinates>-37.1,-10.9,0 -37.2,-11.0,0</coordinates></LineString></Placemark></Document></kml>';
  const route = parseKmlRoute(xml);

  assert.equal(route.type, 'FeatureCollection');
  assert.equal(route.features.length, 1);
  assert.deepEqual(route.features[0].geometry.coordinates[0], [-37.1, -10.9, 0]);
});

test('carrega itinerário e geometria da linha 001 a partir do banco local', async () => {
  const details = getRouteDetails('001');
  const geometry = await getRouteGeometry('001');

  assert.match(details.itinerary, /Augusto Franco/i);
  assert.ok(geometry.features.length > 0);
});