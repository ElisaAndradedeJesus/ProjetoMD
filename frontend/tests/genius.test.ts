import { test } from "node:test";
import assert from "node:assert/strict";
import { criarServicoLocal, criarServicoApi, perfis, categorias } from "../src/genius/service.ts";

test("54 perfis: perguntas úteis e equilibradas, sem eliminar o perfil verdadeiro e até sete respostas", async () => {
  let descobertas = 0, limites = 0;
  assert.equal(perfis.length, 54);
  for (const perfil of perfis) {
    const service = criarServicoLocal();
    let game = await service.iniciarPartida();
    while (game.status === "jogando") {
      const pergunta = game.pergunta!;
      const sim = game.candidatos.filter(p => p[pergunta.categoria] === pergunta.opcao).length;
      assert.ok(sim > 0 && sim < game.candidatos.length);
      const custo = Math.max(sim, game.candidatos.length - sim);
      if (game.candidatos.length < perfis.length) {
        for (const categoria of Object.keys(categorias) as (keyof typeof categorias)[]) {
          for (const opcao of categorias[categoria]) {
            const n = game.candidatos.filter(p => p[categoria] === opcao).length;
            if (n > 0 && n < game.candidatos.length) assert.ok(custo <= Math.max(n, game.candidatos.length - n));
          }
        }
      }
      game = await service.responder(game.id, perfil[pergunta.categoria] === pergunta.opcao);
      assert.ok(game.candidatos.some(p => JSON.stringify(p) === JSON.stringify(perfil)));
      assert.ok(game.usadas <= 7);
    }
    assert.equal(game.pergunta, null);
    if (game.status === "palpite") {
      descobertas++;
      assert.deepEqual(game.perfil, perfil);
      game = await service.confirmar(game.id, true);
      assert.equal(game.status, "descobriu");
    } else {
      limites++;
      assert.equal(game.usadas, 7);
      assert.ok(game.candidatos.length > 1);
      assert.equal(game.perfil, null);
    }
    await assert.rejects(service.responder(game.id, true), /terminou/);
  }
  assert.equal(descobertas, 54);
  assert.equal(limites, 0);
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
  await api.confirmar("partida", false);
  assert.deepEqual(chamadas, [
    { url: "http://example.test/genius", body: undefined },
    { url: "http://example.test/genius/partida/resposta", body: '{"resposta":false}' },
    { url: "http://example.test/genius/partida/confirmacao", body: '{"acertou":false}' },
  ]);
  const rede = criarServicoApi("", (async () => { throw new Error("offline"); }) as typeof fetch);
  await assert.rejects(rede.iniciarPartida(), /conectar/);
  const erro = criarServicoApi("", (async () => new Response("", { status: 500 })) as typeof fetch);
  await assert.rejects(erro.iniciarPartida(), /500/);
});

for (const acertou of [true, false]) {
  test(`sete respostas Não exigem confirmação; confirmação ${acertou}`, async () => {
    const service = criarServicoLocal();
    let game = await service.iniciarPartida();
    await assert.rejects(service.confirmar(game.id, true), /aguardando/);
    while (game.status === "jogando") game = await service.responder(game.id, false);
    assert.equal(game.usadas, 7);
    assert.equal(game.status, "palpite");
    assert.equal(game.candidatos.length, 1);
    assert.ok(game.perfil);
    const perfil = structuredClone(game.perfil);
    game.perfil.textura = "alterado";
    game = await service.confirmar(game.id, acertou);
    assert.equal(game.status, acertou ? "descobriu" : "sem_correspondencia");
    assert.deepEqual(game.perfil, perfil);
    assert.equal(game.usadas, 7);
    assert.equal(game.historico.length, 7);
    await assert.rejects(service.confirmar(game.id, true), /aguardando/);
  });
}
