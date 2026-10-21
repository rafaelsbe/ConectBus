# MoveAracaju

Aplicação de mobilidade urbana para Aracaju, com linhas e itinerários da SMTT, notícias do feed oficial, orientações de cartões e uma ocorrência claramente identificada como demonstração.

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
- `/api/news` consulta o feed público do WordPress da SMTT (cache de cinco minutos). Uma falha da fonte é apresentada como erro, sem substituir as notícias por conteúdo inventado.
- `/api/alerts` disponibiliza somente uma ocorrência de demonstração, com horário de geração e identificação explícita de simulação; não representa uma integração operacional.
- As informações sobre cartões são orientativas e direcionam para os canais oficiais. O ConectBus não emite cartões, realiza recargas ou envia solicitações.
- O perfil é inteiramente demonstrativo e não implementa autenticação ou armazenamento de informações pessoais.
