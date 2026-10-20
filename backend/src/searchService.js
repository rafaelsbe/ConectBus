import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'data', 'seed.json');

const rawData = readFileSync(dataPath, 'utf8');
const lines = JSON.parse(rawData).lines || [];

export function normalizeText(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchLines(origin, destination) {
  if (!origin && !destination) {
    return [];
  }

  const originKey = normalizeText(origin);
  const destinationKey = normalizeText(destination);

  if (!originKey && !destinationKey) {
    return [];
  }

  const candidates = lines.filter((line) => {
    const searchable = [
      line.code,
      line.name,
      line.origin,
      line.destination,
      line.via,
      line.observations,
      line.routeSummary,
      line.routeName,
    ]
      .filter(Boolean)
      .join(' ');

    const search = normalizeText(searchable);

    if (!originKey && destinationKey) {
      return search.includes(destinationKey);
    }

    if (originKey && !destinationKey) {
      return search.includes(originKey);
    }

    return (
      search.includes(originKey) && search.includes(destinationKey) ||
      (normalizeText(line.origin).includes(originKey) && normalizeText(line.destination).includes(destinationKey)) ||
      (normalizeText(line.origin).includes(destinationKey) && normalizeText(line.destination).includes(originKey))
    );
  });

  return candidates
    .map((line) => ({
      id: line.id,
      code: line.code,
      name: line.name,
      origin: line.origin,
      destination: line.destination,
      via: line.via,
      observations: line.observations,
      status: line.status,
      source: line.source,
      lastVerified: line.lastVerified,
    }))
    .sort((a, b) => {
      const aRank = [a.origin, a.destination, a.name].join(' ').toLowerCase();
      const bRank = [b.origin, b.destination, b.name].join(' ').toLowerCase();
      return aRank.localeCompare(bRank);
    });
}

export const busLines = lines;
