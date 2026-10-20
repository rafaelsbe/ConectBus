import { useEffect, useMemo, useState } from 'react';
import RouteMap from './components/RouteMap';
import './App.css';

type RouteSource = {
  sourceId: number;
  sourceUrl: string;
  modifiedAt: string;
};

type BusLine = {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  via?: string;
  itinerary?: string | null;
  status: 'verified' | 'partial';
  route?: RouteSource | null;
};

type RouteCollection = GeoJSON.FeatureCollection;
type RouteResult = {
  code: string;
  data?: RouteCollection;
  error?: string;
};

const normalize = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const searchLines = (lines: BusLine[], origin: string, destination: string) => {
  const originKey = normalize(origin);
  const destinationKey = normalize(destination);

  return lines.filter((line) => {
    const searchable = normalize(
      `${line.code} ${line.name} ${line.origin} ${line.destination} ${line.via ?? ''}`,
    );

    if (!originKey && !destinationKey) return true;
    if (!originKey) return searchable.includes(destinationKey);
    if (!destinationKey) return searchable.includes(originKey);

    return searchable.includes(originKey) && searchable.includes(destinationKey);
  });
};

function App() {
  const [lines, setLines] = useState<BusLine[]>([]);
  const [origin, setOrigin] = useState('Fernando Collor');
  const [destination, setDestination] = useState('D.I.A.');
  const [submittedRoute, setSubmittedRoute] = useState({
    origin: 'Fernando Collor',
    destination: 'D.I.A.',
  });
  const [selectedCode, setSelectedCode] = useState('');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [loadingError, setLoadingError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/lines', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar as linhas da base local.');
        return response.json();
      })
      .then((payload: { data: BusLine[] }) => {
        setLines(payload.data);
        setLoadingError('');
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setLoadingError(error.message);
      });

    return () => controller.abort();
  }, []);

  const results = useMemo(
    () => searchLines(lines, submittedRoute.origin, submittedRoute.destination),
    [lines, submittedRoute],
  );
  const suggestions = useMemo(
    () => Array.from(new Set(lines.flatMap((line) => [line.origin, line.destination]))),
    [lines],
  );
  const selectedLine = results.find((line) => line.code === selectedCode) ?? results[0];

  useEffect(() => {
    if (!selectedLine?.route) return;

    const controller = new AbortController();

    fetch(`/api/lines/${encodeURIComponent(selectedLine.code)}/route`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar a geometria da linha.');
        return payload.data as RouteCollection;
      })
      .then((data) => setRouteResult({ code: selectedLine.code, data }))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') {
          setRouteResult({ code: selectedLine.code, error: error.message });
        }
      });

    return () => controller.abort();
  }, [selectedLine]);

  const routeData = routeResult?.code === selectedLine?.code ? routeResult.data ?? null : null;
  const routeError = !selectedLine?.route
    ? selectedLine ? 'Esta linha ainda não possui geometria oficial cadastrada.' : ''
    : routeResult?.code === selectedLine.code ? routeResult.error ?? '' : '';
  const routeLoading = Boolean(selectedLine?.route && routeResult?.code !== selectedLine.code);

  const handleSearch = () => {
    setSubmittedRoute({ origin, destination });
    setSelectedCode('');
  };

  const swapRoute = () => {
    setOrigin(destination);
    setDestination(origin);
    setSubmittedRoute({ origin: destination, destination: origin });
    setSelectedCode('');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio">ConectBus</a>
        <nav aria-label="Navegação principal">
          <a href="#inicio">Início</a>
          <a href="#linhas">Linhas</a>
          <a href="https://smtt.aracaju.se.gov.br/itinerario-e-horario-de-onibus/" target="_blank" rel="noreferrer">SMTT</a>
        </nav>
      </header>

      <main className="page" id="inicio">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Transporte coletivo · Aracaju e região</p>
            <h1>Linhas de ônibus no mapa</h1>
            <p className="hero-copy">Itinerários publicados pela SMTT, reunidos numa base local.</p>
          </div>

          <form className="search-box" onSubmit={(event) => { event.preventDefault(); handleSearch(); }}>
            <label>
              Origem
              <input value={origin} onChange={(event) => setOrigin(event.target.value)} list="places" />
            </label>
            <button type="button" className="swap-button" onClick={swapRoute} aria-label="Inverter origem e destino" title="Inverter origem e destino">⇅</button>
            <label>
              Destino
              <input value={destination} onChange={(event) => setDestination(event.target.value)} list="places" />
            </label>
            <button type="submit" className="primary-button">Pesquisar</button>
            <datalist id="places">
              {suggestions.map((place) => <option key={place} value={place} />)}
            </datalist>
          </form>
        </section>

        <section className="summary-row" aria-label="Resumo da base">
          <div><strong>Linhas na base</strong><span>{lines.length}</span></div>
          <div><strong>Rotas com geometria</strong><span>{lines.filter((line) => line.route).length}</span></div>
          <div><strong>Fonte de itinerários</strong><span className="summary-source">SMTT Aracaju</span></div>
        </section>

        {loadingError ? <p className="notice error-notice">{loadingError}</p> : null}

        <section className="route-workspace" id="linhas">
          <aside className="line-directory">
            <div className="directory-heading">
              <div>
                <p className="eyebrow">Resultados</p>
                <h2>{results.length} {results.length === 1 ? 'linha' : 'linhas'}</h2>
              </div>
              <span className="result-count">{lines.length} cadastradas</span>
            </div>
            <div className="line-list">
              {results.map((line) => (
                <button
                  key={line.code}
                  type="button"
                  className={`line-card ${selectedLine?.code === line.code ? 'selected' : ''}`}
                  onClick={() => setSelectedCode(line.code)}
                  aria-pressed={selectedLine?.code === line.code}
                >
                  <span className="line-card-top">
                    <span className="badge">{line.code}</span>
                    <span className={`route-status ${line.route ? 'available' : ''}`}>{line.route ? 'No mapa' : 'Sem mapa'}</span>
                  </span>
                  <strong>{line.name}</strong>
                  <span className="line-endpoints">{line.origin} <span aria-hidden="true">→</span> {line.destination}</span>
                </button>
              ))}
              {results.length === 0 && !loadingError ? (
                <p className="empty-state">Nenhuma linha encontrada para essa pesquisa.</p>
              ) : null}
              {lines.length === 0 && !loadingError ? <p className="empty-state">Carregando linhas...</p> : null}
            </div>
          </aside>

          <section className="map-panel" aria-label="Mapa da rota selecionada">
            <div className="map-heading">
              <div>
                <p className="eyebrow">Itinerário selecionado</p>
                <h2>{selectedLine ? `${selectedLine.code} · ${selectedLine.name}` : 'Selecione uma linha'}</h2>
                <p>{selectedLine ? `${selectedLine.origin} → ${selectedLine.destination}${selectedLine.via ? ` · Via ${selectedLine.via}` : ''}` : 'Ajuste a pesquisa ou escolha uma linha da lista.'}</p>
              </div>
              {selectedLine?.route ? (
                <a className="source-link" href={selectedLine.route.sourceUrl} target="_blank" rel="noreferrer">Ver fonte SMTT ↗</a>
              ) : null}
            </div>
            <RouteMap data={routeData} loading={routeLoading} error={routeError} />
            {selectedLine?.route ? <p className="route-meta">Mapa da SMTT atualizado em {new Date(selectedLine.route.modifiedAt).toLocaleDateString('pt-BR')} · Geometria carregada da fonte oficial.</p> : null}
            {selectedLine?.itinerary ? (
              <details className="itinerary-details">
                <summary>Ver itinerário completo</summary>
                <p>{selectedLine.itinerary}</p>
              </details>
            ) : null}
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;
