# MoveAracaju

Aplicação de mobilidade urbana para Aracaju, com base de linhas, pesquisa de trajetos, alertas e notícias.

## Requisitos

- Node.js 20+
- npm

## Configuração rápida

1. Copie o arquivo de ambiente do backend:
   - `cp backend/.env.example backend/.env`
2. Ajuste as variáveis conforme necessário.
3. Instale as dependências:
   - `npm run install:backend`
   - `npm run install:frontend`

## Executar

### Backend

```bash
cd backend
npm run dev
```

Para atualizar o banco local com itinerários e geometrias publicados pela SMTT:

```bash
npm run import:routes
```

O comando grava os itinerários e as geometrias GeoJSON em `backend/data/routeDetails.json`.
O mapa usa Leaflet com tiles do OpenStreetMap; as geometrias são as publicadas nos mapas da SMTT.

### Frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

## Testes

```bash
cd backend
npm test
```

## Build

```bash
cd frontend
npm run build
```

## Observações

- A base inicial de linhas foi carregada em `backend/data/seed.json`.
- A busca de trajetos é tratada por normalização de textos e considera ausência de dados confiáveis como limite da operação.
- Nenhuma base de GPS em tempo real foi implementada.
