import { test } from "node:test";
import assert from "node:assert/strict";
import { criarServicoLocal, criarServicoApi, perfis, categorias } from "../src/genius/service.ts";

test("54 perfis: perguntas úteis e equilibradas, sem eliminar o perfil verdadeiro e até seis respostas", async () => {
  let descobertas = 0, limites = 0, descobertasNaSexta = 0;
  assert.equal(perfis.length, 54);
  for (const perfil of perfis) {
    const service = criarServicoLocal();
    let game = await service.iniciarPartida();
    while (game.status === "jogando") {
      const pergunta = game.pergunta!;
      const sim = game.candidatos.filter(p => p[pergunta.categoria] === pergunta.opcao).length;
      assert.ok(sim > 0 && sim < game.candidatos.length);
      const custo = Math.max(sim, game.candidatos.length - sim);
      for (const categoria of Object.keys(categorias) as (keyof typeof categorias)[]) {
        for (const opcao of categorias[categoria]) {
          const n = game.candidatos.filter(p => p[categoria] === opcao).length;
          if (n > 0 && n < game.candidatos.length) assert.ok(custo <= Math.max(n, game.candidatos.length - n));
        }
      }
      game = await service.responder(game.id, perfil[pergunta.categoria] === pergunta.opcao);
      assert.ok(game.candidatos.some(p => JSON.stringify(p) === JSON.stringify(perfil)));
      assert.ok(game.usadas <= 6);
    }
    assert.equal(game.pergunta, null);
    if (game.status === "descobriu") {
      descobertas++;
      if (game.usadas === 6) descobertasNaSexta++;
      assert.deepEqual(game.perfil, perfil);
    } else {
      limites++;
      assert.equal(game.usadas, 6);
      assert.ok(game.candidatos.length > 1);
      assert.equal(game.perfil, null);
    }
    await assert.rejects(service.responder(game.id, true), /terminou/);
  }
  assert.ok(descobertas > 0 && limites > 0 && descobertasNaSexta > 0);
});

test("reinício, isolamento dos dados e entradas inválidas", async () => {
  const service = criarServicoLocal();
  const game = await service.iniciarPartida();
  await assert.rejects(service.responder("inexistente", true), /não encontrada/);
  await assert.rejects(service.responder(game.id, "sim" as unknown as boolean), /inválida/);
  game.candidatos.length = 0;
  const next = await service.responder(game.id, true);
  assert.ok(next.candidatos.length > 0);
  const novo = await service.iniciarPartida();
  assert.equal(novo.usadas, 0);
  assert.equal(novo.candidatos.length, 54);
  await assert.rejects(service.responder(game.id, true), /não encontrada/);
});

test("API: contrato de criação e resposta e tratamento de falhas", async () => {
  const estado = await criarServicoLocal().iniciarPartida();
  const chamadas: { url: string; body: unknown }[] = [];
  const fetchMock = (async (url, init) => {
    assert.equal(init?.method, "POST");
    chamadas.push({ url: String(url), body: init?.body });
    return Response.json(estado);
  }) as typeof fetch;
  const api = criarServicoApi("http://example.test/", fetchMock);
  assert.deepEqual(await api.iniciarPartida(), estado);
  await api.responder("partida", false);
  assert.deepEqual(chamadas, [
    { url: "http://example.test/genius", body: undefined },
    { url: "http://example.test/genius/partida/resposta", body: '{"resposta":false}' },
  ]);
  const rede = criarServicoApi("", (async () => { throw new Error("offline"); }) as typeof fetch);
  await assert.rejects(rede.iniciarPartida(), /conectar/);
  const erro = criarServicoApi("", (async () => new Response("", { status: 500 })) as typeof fetch);
  await assert.rejects(erro.iniciarPartida(), /500/);
});
