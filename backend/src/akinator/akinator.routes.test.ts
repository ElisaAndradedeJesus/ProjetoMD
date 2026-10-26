import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { criarApp } from "../app.ts";
import { PEOPLE } from "./akinator.data.ts";
import type { AkinatorStateDTO } from "./akinator.dto.ts";

process.env.BIGO_VERBOSE = "0";

let base = "";
let fechar = () => {};

before(async () => {
  const servidor = criarApp().listen(0);
  await new Promise((ok) => servidor.once("listening", ok));
  base = `http://localhost:${(servidor.address() as AddressInfo).port}`;
  fechar = () => servidor.close();
});
after(() => fechar());

// `corpo` fica sem tipo: cada teste confere os campos que usa.
async function post(caminho: string, corpo?: unknown): Promise<{ status: number; corpo: any }> {
  const res = await fetch(`${base}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: res.status, corpo: await res.json() };
}

test("GET /people devolve os 24 perfis que o frontend espera", async () => {
  const res = await fetch(`${base}/api/akinator/people`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), PEOPLE);
});

test("fluxo completo: start -> answer até o palpite -> confirm", async () => {
  const lia = PEOPLE.find((p) => p.name === "Lia")!;
  const inicio = await post("/api/akinator/start");
  assert.equal(inicio.status, 201);

  let estado: AkinatorStateDTO = inicio.corpo;
  while (estado.phase === "pergunta") {
    const { key } = estado.question;
    const res = await post("/api/akinator/answer", {
      sessionId: estado.sessionId,
      questionKey: key,
      answer: lia.traits.includes(key) ? "sim" : "nao",
    });
    assert.equal(res.status, 200);
    estado = res.corpo;
  }
  assert.equal(estado.phase, "palpite");
  assert.equal(estado.guess?.person.name, "Lia");

  const fim = await post("/api/akinator/confirm", { sessionId: estado.sessionId, correct: true });
  assert.equal(fim.status, 200);
  assert.equal(fim.corpo.phase, "fim");
  assert.equal(fim.corpo.result.questionsAsked, estado.progress.answered);
  assert.equal(typeof fim.corpo.complexidade.total_operacoes, "number");
});

test("erros voltam como { detail } com 400, 404 e 409", async () => {
  const { corpo: inicio } = await post("/api/akinator/start");
  const outra = inicio.question.key === "curto" ? "loiro" : "curto";

  const semCorpo = await post("/api/akinator/answer");
  assert.equal(semCorpo.status, 400);
  assert.equal(typeof semCorpo.corpo.detail, "string");

  const respostaInvalida = await post("/api/akinator/answer", {
    sessionId: inicio.sessionId, questionKey: inicio.question.key, answer: "talvez",
  });
  assert.equal(respostaInvalida.status, 400);

  const desconhecida = await post("/api/akinator/answer", {
    sessionId: "nao-existe", questionKey: inicio.question.key, answer: "sim",
  });
  assert.equal(desconhecida.status, 404);

  const foraDeOrdem = await post("/api/akinator/answer", { sessionId: inicio.sessionId, questionKey: outra, answer: "sim" });
  assert.equal(foraDeOrdem.status, 409);

  const cedo = await post("/api/akinator/confirm", { sessionId: inicio.sessionId, correct: true });
  assert.equal(cedo.status, 409);

  const jsonQuebrado = await fetch(`${base}/api/akinator/answer`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
  });
  assert.equal(jsonQuebrado.status, 400);
  assert.equal(typeof ((await jsonQuebrado.json()) as { detail: unknown }).detail, "string");

  const rota = await fetch(`${base}/api/akinator/nada`);
  assert.equal(rota.status, 404);
  assert.deepEqual(await rota.json(), { detail: "Rota não encontrada." });
});

test("responde ao preflight de CORS", async () => {
  const res = await fetch(`${base}/api/akinator/start`, { method: "OPTIONS" });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});
