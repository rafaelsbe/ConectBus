import { useEffect, useMemo, useState } from 'react';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  imageUrl: string | null;
};

type AlertItem = {
  id: string;
  title: string;
  description: string;
  affectedLines: string[];
  lineName: string;
  severity: string;
  status: string;
  occurredAt: string;
  sourceType: string;
  affectedSegment: string | null;
};

const officialSources = [
  { name: 'SMTT Aracaju', category: 'Transporte público', description: 'Comunicados, itinerários e informações municipais de trânsito.', url: 'https://smtt.aracaju.se.gov.br/' },
  { name: 'Prefeitura de Aracaju', category: 'Mobilidade urbana', description: 'Notícias e serviços oficiais da administração municipal.', url: 'https://www.aracaju.se.gov.br/' },
  { name: 'Governo de Sergipe', category: 'Infraestrutura', description: 'Agência de notícias e comunicados do Governo do Estado.', url: 'https://www.se.gov.br/agencia' },
  { name: 'AracajuCard', category: 'Transporte público', description: 'Informações oficiais sobre cartões e atendimento ao usuário.', url: 'https://aracajucard.com.br/' },
];

const cardTypes = [
  {
    name: 'Mais Aracaju Escolar',
    purpose: 'Cartão de meia-passagem para estudantes.',
    eligibility: 'Para estudantes. O procedimento oficial de primeira via solicita confirmação da instituição de ensino; estudantes universitários seguem instruções específicas.',
    documents: 'RG, CPF e comprovante de residência. Estudantes universitários também apresentam grade de horários do semestre com identificação, frequência semanal e validação da instituição; consulte exceções no canal oficial.',
    request: 'Preencha o formulário oficial e envie os documentos. Aguarde a confirmação da instituição (quando aplicável) e a análise da AracajuCard, informada em até cinco dias úteis. Após aprovação, compareça para captura de foto e retirada.',
    location: 'A página oficial consultada indica atendimento no CEAC da Rua do Turista, Rua Laranjeiras, 317, em dias úteis, das 7h às 16h.',
    fees: 'A página informa primeira via gratuita e entrega em até dois dias úteis após o atendimento. Reconfirme prazo e condições no canal oficial.',
    update: 'Instruções de cadastramento atualizadas em 28/01/2026.',
    url: 'https://aracajucard.com.br/escolar/',
    procedureUrl: 'https://aracajucard.com.br/escolar/cadastramento/',
    action: 'Acessar instruções de cadastramento',
  },
  {
    name: 'Mais Aracaju Vale-Transporte',
    purpose: 'Vale-transporte para deslocamento de trabalhadores no transporte coletivo.',
    eligibility: 'A página oficial descreve o cartão para pessoas com vínculo empregatício formal; empregadores pessoa física ou jurídica participam da aquisição dos créditos.',
    documents: 'A página do cartão não detalha a documentação de cada solicitação. Empresas devem consultar o VT Web Client e confirmar o processo vigente.',
    request: 'A solicitação e os pedidos de vale-transporte são tratados nos canais oficiais para empregadores. O cidadão deve confirmar com seu empregador qual procedimento se aplica.',
    location: 'Consulte os canais digitais e de atendimento da AracajuCard antes de se deslocar.',
    fees: 'Não há valor ou prazo geral confirmado para esta modalidade nesta página.',
    url: 'https://aracajucard.com.br/vale-transporte/',
    procedureUrl: 'https://aracajucard.com.br/vt-web-client/',
    action: 'Consultar serviços do VT Web Client',
  },
  {
    name: 'Mais Aracaju Pré-Pago',
    purpose: 'Crédito para uso no transporte coletivo; a página oficial descreve opções avulsa e nominal.',
    eligibility: 'A AracajuCard destina a modalidade ao público em geral, incluindo profissionais autônomos e trabalhadores informais.',
    documents: 'A versão avulsa não exige cadastro prévio. Para personalizar um cartão avulso, a página solicita foto do cartão, RG/CPF e comprovante de residência por e-mail; confirme o canal antes de enviar dados.',
    request: 'Avulso: adquira com agente comercial, posto oficial ou ponto credenciado. Nominal: solicite no canal VT Web Client indicado pela AracajuCard.',
    location: 'A página cita terminais e postos CEAC Rua do Turista, Rodoviária Nova e Parque Shopping, além da rede PIU. Consulte o mapa oficial de recarga antes de ir.',
    fees: 'A página consultada, atualizada em 25/09/2026, informa recarga inicial mínima de R$ 4,50 no avulso; para a modalidade nominal, mínimo equivalente a 10 tarifas vigentes e entrega em até dois dias úteis após confirmação do pagamento. Valores podem mudar.',
    update: 'Página da modalidade atualizada em 25/09/2026.',
    url: 'https://aracajucard.com.br/pre-pago/',
    procedureUrl: 'https://aracajucard.com.br/pre-pago/instrucoes-1a-e-2a-via-pre-pago/',
    action: 'Ver instruções da modalidade',
  },
  {
    name: 'Mais Aracaju Gratuidade — pessoas idosas',
    purpose: 'Modalidade de gratuidade para pessoas idosas e outras categorias profissionais descritas nas páginas oficiais.',
    eligibility: 'A página Sênior informa pessoas com 65 anos ou mais. As categorias profissionais têm critérios próprios; consulte a página de gratuidades.',
    documents: 'A página de gratuidades lista RG, CPF e comprovante de residência recente para pessoas idosas. Confirme a lista atual antes de solicitar.',
    request: 'O processo depende da categoria. A página oficial indica atendimento presencial e agendamento para algumas solicitações.',
    location: 'As páginas oficiais consultadas mencionam postos CEAC distintos conforme a categoria. Confirme unidade, horário e agendamento diretamente com a AracajuCard.',
    fees: 'Taxas, prazos e exigência de agendamento devem ser confirmados para cada categoria.',
    update: 'Conteúdo oficial consultado: página de gratuidade atualizada em 21/12/2022.',
    url: 'https://aracajucard.com.br/senior/',
    procedureUrl: 'https://aracajucard.com.br/gratuidades/',
    action: 'Consultar categorias e instruções',
  },
  {
    name: 'Mais Aracaju Gratuidade — categorias profissionais',
    purpose: 'Modalidade gratuita para categorias profissionais indicadas pela AracajuCard.',
    eligibility: 'A página oficial cita servidores ativos da SMTT, carteiros em serviço e oficiais de Justiça ativos. A lista e o enquadramento precisam ser confirmados com a AracajuCard.',
    documents: 'A página lista RG, CPF, comprovante de residência recente, último contracheque e requisição do órgão por e-mail para as categorias profissionais.',
    request: 'A página consultada informa solicitação presencial com agendamento prévio para algumas categorias. Confirme o processo, o canal e o agendamento atual.',
    location: 'A página menciona atendimento CEAC na Rua do Turista para categorias profissionais. Confirme endereço, horário e unidade antes de comparecer.',
    fees: 'Taxas e prazos dependem da categoria e devem ser confirmados no canal oficial.',
    update: 'Conteúdo oficial consultado: página de gratuidade atualizada em 21/12/2022.',
    url: 'https://aracajucard.com.br/gratuidades/',
    procedureUrl: 'https://aracajucard.com.br/gratuidades/instrucoes-gerais-1a-e-2a-via-gratuidade/',
    action: 'Consultar instruções oficiais',
  },
  {
    name: 'Mais Aracaju Especial',
    purpose: 'A página oficial descreve versões do cartão para pessoas com deficiência.',
    eligibility: 'A página oficial descreve versões amarela (sem acompanhante), roxa (com acompanhante, conforme concessão) e cinza para pessoas com deficiência.',
    documents: 'A página informa RG, CPF, comprovante de residência em Aracaju ou região metropolitana e laudo médico recente.',
    request: 'A página consultada informa cadastro pela SMTT. Confirme o fluxo atual, eventual agendamento e o atendimento responsável antes de comparecer.',
    location: 'Consulte a SMTT e a AracajuCard para confirmar o local de solicitação e retirada vigente.',
    fees: 'Não exibimos taxas ou prazos da página, pois as instruções disponíveis têm atualização antiga; confirme diretamente.',
    update: 'Página oficial consultada: atualização registrada em 30/05/2019.',
    url: 'https://aracajucard.com.br/especial/',
    procedureUrl: 'https://aracajucard.com.br/cartoes/',
    action: 'Consultar versões e instruções',
  },
  {
    name: 'Mais Aracaju Militar',
    purpose: 'Modalidade gratuita descrita para integrantes ativos de categorias de segurança pública e guarda municipal.',
    eligibility: 'A página oficial cita policiais militares e civis ativos, bombeiros militares ativos, agentes penitenciários ativos e guardas municipais das cidades indicadas na página.',
    documents: 'A página lista RG, último contracheque e requisição do órgão por e-mail para a primeira via. Confirme os documentos vigentes.',
    request: 'Consulte o órgão empregador e a página oficial para confirmar o canal e o agendamento.',
    location: 'A página consultada menciona atendimento CEAC e agendamento prévio. Confirme unidade, horário e disponibilidade.',
    fees: 'A página informa segunda via equivalente a dez tarifas vigentes; confirme o valor atual antes de pagar.',
    update: 'Conteúdo oficial consultado: atualizado em 25/08/2023.',
    url: 'https://aracajucard.com.br/maisaracaju/',
    procedureUrl: 'https://aracajucard.com.br/maisaracaju/instrucoes-gerais-1a-e-2a-via-militar/',
    action: 'Consultar instruções oficiais',
  },
  {
    name: 'Mais Aracaju Funcional',
    purpose: 'Cartão para colaboradores de empresas de transporte de passageiros indicadas pela AracajuCard.',
    eligibility: 'A página oficial restringe a modalidade a colaboradores de empresas de transporte de passageiros de Aracaju e municípios metropolitanos.',
    documents: 'A página lista RG e autorização da empresa por e-mail.',
    request: 'Solicite orientação e autorização ao empregador e confirme o processo atual com a AracajuCard.',
    location: 'Consulte a página oficial para endereço, horário e eventual agendamento.',
    fees: 'A página informa segunda via equivalente a dez tarifas vigentes; confirme o valor atual antes de pagar.',
    url: 'https://aracajucard.com.br/funcional/',
    procedureUrl: 'https://aracajucard.com.br/funcional/instrucoes-gerais-1a-e-2a-via-funcional/',
    action: 'Consultar instruções oficiais',
  },
  {
    name: 'Mais Aracaju Turista',
    purpose: 'Cartão pré-pago descrito para visitantes que utilizam o transporte público de Aracaju e região metropolitana.',
    eligibility: 'Modalidade apresentada pela AracajuCard para turistas. Consulte a página oficial para confirmar disponibilidade e condições atuais.',
    documents: 'A página consultada não detalha documentos ou solicitação.',
    request: 'Consulte a AracajuCard ou um ponto de venda oficial antes da viagem.',
    location: 'A página não informa um ponto de retirada atual.',
    fees: 'Valores, disponibilidade e prazos devem ser confirmados no canal oficial.',
    url: 'https://aracajucard.com.br/cartao-turista/',
    procedureUrl: 'https://aracajucard.com.br/recarregue-aqui/',
    action: 'Consultar pontos oficiais de recarga',
  },
  {
    name: 'Mais Aracaju Corporativo',
    purpose: 'Cartão voltado ao uso empresarial em situações específicas descritas pela AracajuCard.',
    eligibility: 'A página oficial descreve uso exclusivo de empresas. Confirme se a modalidade e suas condições seguem vigentes.',
    documents: 'A página indica solicitação impressa apresentada presencialmente; confirme documentos e o processo atual.',
    request: 'Consulte o empregador e a página oficial para obter o formulário e confirmar como protocolar o pedido.',
    location: 'A página consultada informa apresentação presencial à AracajuCard; confirme o endereço atual.',
    fees: 'Não reproduzimos limites nem valores da página porque ela tem atualização antiga. Confirme as condições atuais.',
    update: 'Página oficial consultada: atualização registrada em 30/01/2019.',
    url: 'https://aracajucard.com.br/cartao-corporativo/',
    procedureUrl: 'https://aracajucard.com.br/vale-transporte/formularios/solicitacao-da-1a-via-do-cartao-corporativo/',
    action: 'Consultar solicitação corporativa',
  },
];

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data não informada pela fonte' : date.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
};

export function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/news', { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar as notícias oficiais.');
        return payload.data as NewsItem[];
      })
      .then((data) => setNews(data))
      .catch((reason: Error) => {
        if (reason.name !== 'AbortError') setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(news.map((item) => item.category)))], [news]);
  const latestPublication = useMemo(
    () => news.reduce<NewsItem | null>((latest, item) => !latest || new Date(item.publishedAt) > new Date(latest.publishedAt) ? item : latest, null),
    [news],
  );
  const filteredNews = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return news.filter((item) => (category === 'Todas' || item.category === category) &&
      (!normalizedQuery || `${item.title} ${item.summary} ${item.source}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)));
  }, [category, news, query]);

  return (
    <main className="page info-page">
      <section className="page-intro">
        <p className="eyebrow">Informação verificada</p>
        <h1>Notícias e mobilidade</h1>
        <p>Publicações da SMTT carregadas do feed oficial. As matérias são exibidas com a data e o link da publicação original.</p>
      </section>
      <section className="news-tools" aria-label="Pesquisa de notícias">
        <label>Pesquisar notícias<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite um assunto" /></label>
        <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      </section>
      {!loading && !error && latestPublication ? (
        <p className="feed-freshness">Publicação mais recente disponível no feed consultado: {formatDate(latestPublication.publishedAt)}. A data de publicação não garante que um comunicado ainda esteja em vigor; confirme no canal original antes de agir.</p>
      ) : null}
      {loading ? <p className="page-message" role="status">Carregando publicações oficiais…</p> : null}
      {error ? <div className="page-message error-notice" role="alert">{error} <a href={officialSources[0].url} target="_blank" rel="noreferrer">Acessar o site da SMTT ↗</a></div> : null}
      {!loading && !error && filteredNews.length === 0 ? <p className="page-message">Nenhuma notícia encontrada para esses filtros. Consulte diretamente as fontes oficiais abaixo.</p> : null}
      <section className="news-grid" aria-label="Notícias oficiais">
        {filteredNews.map((item) => (
          <article className="news-card" key={item.id}>
            {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : null}
            <span className="category-tag">{item.category}</span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <details>
              <summary>Ler resumo completo</summary>
              <p>{item.content || item.summary}</p>
            </details>
            <div className="news-meta"><span>{item.source} · {formatDate(item.publishedAt)}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer">Publicação original ↗</a></div>
          </article>
        ))}
      </section>
      <section className="source-directory">
        <div><p className="eyebrow">Canais oficiais</p><h2>Mais fontes de informação</h2></div>
        <div className="source-grid">{officialSources.map((source) => (
          <a className="source-card" href={source.url} target="_blank" rel="noreferrer" key={source.name}>
            <span className="category-tag">{source.category}</span><strong>{source.name}</strong><span>{source.description}</span><b>Visitar fonte ↗</b>
          </a>
        ))}</div>
      </section>
    </main>
  );
}

export function CardsPage() {
  return (
    <main className="page info-page">
      <section className="page-intro">
        <p className="eyebrow">Guia oficial de cartões</p>
        <h1>Mais Aracaju</h1>
        <p>Orientações por modalidade, com links para a AracajuCard. Requisitos, documentos, valores e prazos podem mudar; confirme os detalhes no canal oficial antes de solicitar.</p>
      </section>
      <section className="card-grid" aria-label="Modalidades de cartão">
        {cardTypes.map((card, index) => (
          <article className="mobility-card" key={card.name}>
            <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
            <h2>{card.name}</h2>
            <p>{card.purpose}</p>
            {card.update ? <p className="card-source-date">{card.update} Reconfirme as condições atuais no canal oficial.</p> : null}
            <details><summary>Elegibilidade e documentos</summary><p><strong>Quem pode solicitar:</strong> {card.eligibility}</p><p><strong>Documentos:</strong> {card.documents}</p></details>
            <details><summary>Primeira via, retirada e prazos</summary><p>{card.request}</p><p><strong>Onde e quando:</strong> {card.location}</p><p><strong>Taxas e prazos publicados:</strong> {card.fees}</p></details>
            <details><summary>Recarga e segunda via</summary><p>Para consultar pontos de recarga, use o mapa oficial. Confirme se a recarga se aplica à modalidade escolhida.</p><p>As regras e taxas de segunda via variam por cartão; consulte as instruções específicas ou fale com a AracajuCard antes de pagar.</p>
              <a href="https://aracajucard.com.br/recarregue-aqui/" target="_blank" rel="noreferrer">Mapa oficial de recarga ↗</a>
              {' '}·{' '}
              <a href="https://aracajucard.com.br/solicitar-segunda-via-do-cartao/" target="_blank" rel="noreferrer">Orientações de segunda via ↗</a>
            </details>
            <div className="card-links">
              <a className="text-link" href={card.url} target="_blank" rel="noreferrer">Página da modalidade ↗</a>
              <a className="text-link" href={card.procedureUrl} target="_blank" rel="noreferrer">{card.action} ↗</a>
            </div>
          </article>
        ))}
      </section>
      <section className="request-guide">
        <div><p className="eyebrow">Como se orientar</p><h2>Etapas para solicitar ou renovar</h2><p>O envio de pedido e a emissão do cartão são feitos exclusivamente nos canais oficiais, não neste aplicativo.</p></div>
        <ol className="step-list">
          <li><span>1</span><div><strong>Escolha a modalidade</strong><p>Identifique o cartão adequado no catálogo da AracajuCard.</p></div></li>
          <li><span>2</span><div><strong>Confirme os requisitos atuais</strong><p>Verifique elegibilidade, documentos, taxas, prazo, local e agendamento na página específica.</p></div></li>
          <li><span>3</span><div><strong>Use o canal correspondente</strong><p>O Portal do Usuário oferece serviços como cadastramento/recadastramento escolar, consulta de saldo e extrato, bloqueio e segunda via.</p></div></li>
          <li><span>4</span><div><strong>Acompanhe ou peça ajuda</strong><p>Consulte o Portal do Usuário ou fale com a AracajuCard para confirmar a situação do pedido.</p></div></li>
        </ol>
      </section>
      <section className="service-links">
        <h2>Atendimento e serviços oficiais</h2>
        <a href="https://aracajucard.com.br/portal-do-usuario/" target="_blank" rel="noreferrer">Portal do Usuário ↗</a>
        <a href="https://aracajucard.com.br/recarregue-aqui/" target="_blank" rel="noreferrer">Mapa oficial de recarga ↗</a>
        <a href="https://aracajucard.com.br/atendimentopresencial/" target="_blank" rel="noreferrer">Atendimento presencial ↗</a>
        <a href="https://aracajucard.com.br/fale-conosco/" target="_blank" rel="noreferrer">Fale com a AracajuCard ↗</a>
      </section>
      <section className="faq-section">
        <h2>Perguntas frequentes</h2>
        <details><summary>Os documentos e requisitos são iguais para todos os cartões?</summary><p>Não. Cada modalidade tem regras próprias. Confirme a documentação e elegibilidade na página oficial correspondente.</p></details>
        <details><summary>Posso solicitar ou emitir o cartão por aqui?</summary><p>Não. Esta página é informativa e não coleta dados pessoais, processa pagamentos nem envia solicitações à AracajuCard.</p></details>
        <details><summary>Onde consulto saldo, extrato ou solicito segunda via?</summary><p>A AracajuCard informa esses serviços no Portal do Usuário. O acesso e a autenticação acontecem somente no site oficial.</p></details>
        <details><summary>Há taxa, prazo ou necessidade de agendamento?</summary><p>Esses detalhes dependem da modalidade e podem mudar. Confirme diretamente no site ou no atendimento oficial antes de se deslocar.</p></details>
      </section>
    </main>
  );
}

export function AlertsPage({ onOpenRoute }: { onOpenRoute: (lineCode: string) => void }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/alerts', { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Não foi possível carregar os avisos.');
        return payload.data as AlertItem[];
      })
      .then((data) => setAlerts(data))
      .catch((reason: Error) => {
        if (reason.name !== 'AbortError') setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <main className="page info-page">
      <section className="page-intro">
        <p className="eyebrow">Avisos de operação</p><h1>Alertas de ônibus</h1>
        <p>Esta demonstração não está conectada a um sistema de ocorrências em tempo real. Confirme qualquer mudança de serviço com a fonte oficial.</p>
      </section>
      {loading ? <p className="page-message" role="status">Carregando avisos…</p> : null}
      {error ? <p className="page-message error-notice" role="alert">{error}</p> : null}
      <section className="alert-list" aria-label="Ocorrências">
        {alerts.map((alert) => (
          <article className="alert-card" key={alert.id}>
            <div className="alert-symbol" aria-hidden="true">!</div>
            <div className="alert-content">
              <div className="alert-heading"><span className="simulation-badge">SIMULAÇÃO · NÃO É UM ALERTA REAL</span><span className="severity-label">Atenção demonstrativa</span></div>
              <h2>{alert.title}</h2>
              <p className="alert-line">Linha {alert.affectedLines.join(', ')} · {alert.lineName}</p>
              <p>{alert.description}</p>
              <details><summary>Detalhes da ocorrência</summary><p>Status: demonstração. Registrada para esta sessão em {formatDate(alert.occurredAt)}. Sem informação de trecho ou paradas afetadas.</p></details>
              <div className="alert-actions">
                <button className="primary-button" type="button" onClick={() => onOpenRoute(alert.affectedLines[0])}>Consultar alternativa de trajeto</button>
                <a href="https://smtt.aracaju.se.gov.br/" target="_blank" rel="noreferrer">Consultar SMTT ↗</a>
              </div>
            </div>
          </article>
        ))}
      </section>
      {!loading && !error && alerts.length === 0 ? <p className="page-message">Não há avisos disponíveis.</p> : null}
    </main>
  );
}

export function ProfilePage() {
  const [reducedMotion, setReducedMotion] = useState(false);
  return (
    <main className={`page info-page profile-page ${reducedMotion ? 'reduce-motion' : ''}`}>
      <section className="page-intro">
        <p className="eyebrow">Área pessoal</p><h1>Perfil demonstrativo</h1>
        <p>Esta tela é apenas uma demonstração visual. Não há login, conta, autenticação ou dados pessoais reais.</p>
      </section>
      <section className="profile-card">
        <div className="profile-avatar" aria-hidden="true">UD</div>
        <div><span className="simulation-badge">PERFIL FICTÍCIO</span><h2>Usuário Demonstrativo</h2><p>Passageiro · Aracaju - SE</p></div>
      </section>
      <div className="profile-grid">
        <section className="profile-panel"><h2>Rotas recentes demonstrativas</h2><ul><li>Fernando Collor → D.I.A.</li><li>Augusto Franco → Bugio</li><li>Santa Maria → Mercado</li></ul><p>Exemplos de rotas; nenhuma pesquisa pessoal foi armazenada.</p></section>
        <section className="profile-panel"><h2>Preferência de interface</h2><p>Reduzir animações nesta demonstração.</p><button className="swap-button" type="button" aria-pressed={reducedMotion} onClick={() => setReducedMotion(!reducedMotion)}>{reducedMotion ? 'Animações reduzidas: ativado' : 'Ativar menos animações'}</button><p>Também respeitamos a preferência de movimento configurada no dispositivo.</p></section>
        <section className="profile-panel profile-shortcuts"><h2>Acessos rápidos</h2><a href="#noticias">Notícias e mobilidade</a><a href="#cartoes">Cartões Mais Aracaju</a><a href="#alertas">Alertas demonstrativos</a></section>
      </div>
    </main>
  );
}
