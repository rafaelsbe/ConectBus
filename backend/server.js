import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchLines, normalizeText } from './src/searchService.js';
import { getRouteDetails, getRouteGeometry, getRouteSource } from './src/routeService.js';
import { getOfficialNews } from './src/newsService.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, 'data', 'seed.json');
const seedData = JSON.parse(readFileSync(dataPath, 'utf8'));

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'MoveAracaju API', time: new Date().toISOString() });
});

app.get('/api/lines', (req, res) => {
  const query = String(req.query.q || '').trim();
  const status = req.query.status ? String(req.query.status) : undefined;
  const lines = seedData.lines.filter((line) => {
    const matchesQuery = !query ||
      [line.code, line.name, line.origin, line.destination, line.via].some((field) =>
        normalizeText(field).includes(normalizeText(query))
      );
    const matchesStatus = !status || line.status === status;
    return matchesQuery && matchesStatus;
  });

  res.json({
    data: lines.map((line) => ({
      ...line,
      route: getRouteSource(line.code),
      itinerary: getRouteDetails(line.code)?.itinerary || null,
    })),
    total: lines.length,
  });
});

app.get('/api/lines/search', (req, res) => {
  const { origin, destination, q } = req.query;
  const query = String(q || '').trim();
  const results = query
    ? searchLines(query, '')
    : searchLines(String(origin || ''), String(destination || ''));

  res.json({ data: results, total: results.length });
});

app.get('/api/lines/:idOrCode', (req, res) => {
  const idOrCode = String(req.params.idOrCode).trim();
  const line = seedData.lines.find((item) => item.id === idOrCode || item.code === idOrCode);

  if (!line) {
    return res.status(404).json({ error: 'Linha não encontrada.' });
  }

  return res.json({
    data: {
      ...line,
      route: getRouteSource(line.code),
      itinerary: getRouteDetails(line.code)?.itinerary || null,
    },
  });
});

app.get('/api/lines/:idOrCode/route', async (req, res) => {
  const idOrCode = String(req.params.idOrCode).trim();
  const line = seedData.lines.find((item) => item.id === idOrCode || item.code === idOrCode);

  if (!line || !getRouteSource(line.code)) {
    return res.status(404).json({ error: 'Geometria oficial não cadastrada para esta linha.' });
  }

  try {
    return res.json({ data: await getRouteGeometry(line.code) });
  } catch (error) {
    return res.status(502).json({ error: error.message || 'Não foi possível carregar a rota.' });
  }
});

app.get('/api/alerts', (req, res) => {
  const line = seedData.lines.find((item) => item.code === '001');
  const simulatedAt = new Date().toISOString();
  const alerts = [
    {
      id: 'simulation-mechanical-issue',
      title: 'Ônibus com problema mecânico',
      description: 'Esta ocorrência é uma simulação para demonstração. Não há confirmação de problema mecânico em veículos ou linhas em operação.',
      affectedLines: [line.code],
      lineName: line.name,
      category: 'mechanical_issue',
      severity: 'medium',
      status: 'simulation',
      occurredAt: simulatedAt,
      createdAt: simulatedAt,
      updatedAt: simulatedAt,
      source: 'Demonstração ConectBus',
      sourceType: 'simulation',
      validation: 'not_applicable',
      affectedSegment: null,
    }
  ];

  res.json({ data: alerts, total: alerts.length });
});

app.get('/api/news', async (req, res) => {
  try {
    return res.json(await getOfficialNews());
  } catch (error) {
    console.error('Não foi possível carregar notícias oficiais da SMTT:', error);
    return res.status(502).json({ error: 'Não foi possível consultar as notícias oficiais da SMTT. Tente novamente ou acesse o site da SMTT.' });
  }
});

app.post('/api/reports', (req, res) => {
  const { lineCode, problemType, location, description, occurredAt } = req.body || {};

  if (!lineCode || !problemType || !description) {
    return res.status(400).json({ error: 'Linha, tipo do problema e descrição são obrigatórios.' });
  }

  const report = {
    id: `report-${Date.now()}`,
    lineCode,
    problemType,
    location: location || 'Não informado',
    description,
    occurredAt: occurredAt || new Date().toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return res.status(201).json({ data: report });
});

app.listen(port, () => {
  console.log(`MoveAracaju API listening on http://localhost:${port}`);
});
