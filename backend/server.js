import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchLines, normalizeText } from './src/searchService.js';
import { getRouteDetails, getRouteGeometry, getRouteSource } from './src/routeService.js';

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
  const alerts = [
    {
      id: 'alert-1',
      title: 'Atraso em linha 021',
      description: 'A linha 021 apresentou atraso na região do centro por causa de trânsito.',
      affectedLines: ['021'],
      category: 'delay',
      severity: 'medium',
      status: 'confirmed',
      occurredAt: '2026-10-20T08:15:00.000Z',
      createdAt: '2026-10-20T08:30:00.000Z',
      updatedAt: '2026-10-20T08:30:00.000Z',
      source: 'Relato da SMTT',
      validation: 'confirmed by admin'
    },
    {
      id: 'alert-2',
      title: 'Report de ônibus quebrado',
      description: 'Usuário reportou ônibus quebrado na linha 007.',
      affectedLines: ['007'],
      category: 'broken_bus',
      severity: 'high',
      status: 'pending',
      occurredAt: '2026-10-20T09:00:00.000Z',
      createdAt: '2026-10-20T09:05:00.000Z',
      updatedAt: '2026-10-20T09:05:00.000Z',
      source: 'Relato de usuário',
      validation: 'pending review'
    }
  ];

  res.json({ data: alerts, total: alerts.length });
});

app.get('/api/news', (req, res) => {
  const news = [
    {
      id: 'news-1',
      title: 'SMTT reforça comunicação sobre mudanças de itinerário',
      summary: 'A prefeitura publicou informações sobre ajustes e linhas em operação.',
      category: 'mobilidade',
      source: 'SMTT Aracaju',
      sourceUrl: 'https://smtt.aracaju.se.gov.br/',
      publishedAt: '2026-10-20T12:00:00.000Z',
      createdAt: '2026-10-20T12:00:00.000Z',
      status: 'published'
    },
    {
      id: 'news-2',
      title: 'Linha 022 altera trajeto devido às obras viárias',
      summary: 'A SMTT informa alterações no itinerário da linha 022 por obras no complexo viário.',
      category: 'transporte',
      source: 'SMTT Aracaju',
      sourceUrl: 'https://smtt.aracaju.se.gov.br/noticias/smtt-altera-itinerario-da-linha-022-barra-dia-devido-as-obras-do-complexo-viario-maria-do-carmo/',
      publishedAt: '2026-10-20T13:00:00.000Z',
      createdAt: '2026-10-20T13:00:00.000Z',
      status: 'published'
    }
  ];

  res.json({ data: news, total: news.length });
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
