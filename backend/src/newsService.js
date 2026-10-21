import { parse } from 'node-html-parser';

const feedUrl = new URL('https://smtt.aracaju.se.gov.br/wp-json/wp/v2/posts');
feedUrl.searchParams.set('per_page', '12');
feedUrl.searchParams.set('_embed', '1');
feedUrl.searchParams.set('_fields', 'date,link,title,excerpt,content,_embedded');

let cachedNews = null;
let cacheExpiresAt = 0;

function textFromHtml(value = '') {
  return parse(value).text.trim().replace(/\s+/g, ' ');
}

function categoryFor(title, excerpt, terms) {
  const text = `${title} ${excerpt} ${terms.join(' ')}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  if (/acessibil|calçada|ciclista|pedestre/.test(text)) return 'Acessibilidade e mobilidade';
  if (/transito|acidente|bloqueio|interdicao|sinistro/.test(text)) return 'Trânsito';
  if (/obra|infraestrutura|paviment|viario/.test(text)) return 'Infraestrutura';
  if (/onibus|linha|terminal|transporte|itinerario/.test(text)) return 'Transporte público';
  return 'Mobilidade urbana';
}

function mapPost(post) {
  const title = textFromHtml(post.title?.rendered);
  const summary = textFromHtml(post.excerpt?.rendered);
  const link = new URL(post.link);

  if (link.protocol !== 'https:' || link.hostname !== 'smtt.aracaju.se.gov.br') {
    throw new Error('O feed da SMTT retornou um link fora do domínio oficial.');
  }

  const terms = (post._embedded?.['wp:term'] || []).flat()
    .map((term) => term.name)
    .filter((name) => typeof name === 'string');
  const image = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

  return {
    id: post.link,
    title,
    summary,
    content: textFromHtml(post.content?.rendered),
    category: categoryFor(title, summary, terms),
    source: 'SMTT Aracaju',
    sourceUrl: link.toString(),
    publishedAt: post.date,
    imageUrl: typeof image === 'string' && image.startsWith('https://') ? image : null,
  };
}

export async function getOfficialNews({ fetchImpl = fetch, now = Date.now() } = {}) {
  if (cachedNews && cacheExpiresAt > now) return cachedNews;

  const response = await fetchImpl(feedUrl, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    throw new Error(`O feed oficial da SMTT respondeu com HTTP ${response.status}.`);
  }

  const posts = await response.json();
  if (!Array.isArray(posts)) {
    throw new Error('O feed oficial da SMTT retornou um formato inválido.');
  }

  const data = posts.map(mapPost);
  cachedNews = { data, total: data.length, source: 'SMTT Aracaju' };
  cacheExpiresAt = now + 5 * 60 * 1000;
  return cachedNews;
}
