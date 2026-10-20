import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, searchLines } from '../src/searchService.js';

test('normaliza textos sem diferenciar maiúsculas, acentos e espaços extras', () => {
  assert.equal(normalizeText('  Fernando   Collor  '), 'fernando collor');
  assert.equal(normalizeText('D.I.A.'), 'dia');
  assert.equal(normalizeText('SÃO JOÃO'), 'sao joao');
});

test('pesquisa por origem e destino retorna linhas compatíveis', () => {
  const results = searchLines('Fernando Collor', 'D.I.A.');
  assert.ok(results.some((line) => line.code === '002'));
  assert.equal(results.some((line) => line.code === '007'), false);
});

test('pesquisa inexistente retorna vazio sem inventar rota', () => {
  const results = searchLines('Local Inexistente', 'Outro Local');
  assert.deepEqual(results, []);
});

test('busca por código e nome encontra a linha correta', () => {
  const byCode = searchLines('091');
  const byName = searchLines('Campus');
  assert.ok(byCode.some((line) => line.code === '091'));
  assert.ok(byName.some((line) => line.code === '091'));
});
