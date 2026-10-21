import test from 'node:test';
import assert from 'node:assert/strict';
import { getOfficialNews } from '../src/newsService.js';

test('converte publicações do feed oficial em notícias seguras para a interface', async () => {
  const posts = [{
    date: '2026-10-20T12:00:00',
    link: 'https://smtt.aracaju.se.gov.br/noticia-oficial/',
    title: { rendered: '<strong>Ônibus</strong> e itinerário' },
    excerpt: { rendered: '<p>Informação oficial&nbsp; publicada.</p>' },
    content: { rendered: '<p>Texto completo <a href="#">da publicação</a>.</p>' },
    _embedded: {
      'wp:term': [[{ name: 'Transporte' }]],
      'wp:featuredmedia': [{ source_url: 'https://smtt.aracaju.se.gov.br/imagem.jpg' }],
    },
  }];

  const result = await getOfficialNews({
    fetchImpl: async () => ({ ok: true, json: async () => posts }),
    now: Date.now(),
  });

  assert.equal(result.total, 1);
  assert.equal(result.data[0].title, 'Ônibus e itinerário');
  assert.match(result.data[0].summary, /Informação oficial/);
  assert.equal(result.data[0].category, 'Transporte público');
  assert.equal(result.data[0].sourceUrl, posts[0].link);
  assert.equal(result.data[0].content, 'Texto completo da publicação.');
});

test('rejeita links de notícias fora do domínio oficial', async () => {
  const resultTime = Date.now() + 10 * 60 * 1000;
  await assert.rejects(
    getOfficialNews({
      fetchImpl: async () => ({
        ok: true,
        json: async () => [{
          date: '2026-10-20T12:00:00',
          link: 'https://example.com/noticia/',
          title: { rendered: 'Notícia' },
          excerpt: { rendered: 'Resumo' },
          _embedded: {},
        }],
      }),
      now: resultTime,
    }),
    /link fora do domínio oficial/,
  );
});
