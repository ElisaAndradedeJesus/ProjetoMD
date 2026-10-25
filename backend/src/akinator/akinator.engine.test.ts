import assert from "node:assert/strict";
import { test } from "node:test";
import { PEOPLE } from "./akinator.data.ts";
import { TRAIT_KEYS, type AkinatorStateDTO, type PersonDTO } from "./akinator.dto.ts";
import { AkinatorError, AkinatorGame } from "./akinator.engine.ts";

process.env.BIGO_VERBOSE = "0";

const pergunta = (estado: AkinatorStateDTO) => {
  assert.equal(estado.phase, "pergunta");
  return estado.question!;
};

/** Responde Sim/Não com sinceridade, como quem pensou em `pessoa`. */
function jogarComo(pessoa: PersonDTO) {
  const jogo = new AkinatorGame();
  let estado = jogo.estado();
  while (estado.phase === "pergunta") {
    jogo.responder(estado.question.key, pessoa.traits.includes(estado.question.key) ? "sim" : "nao");
    estado = jogo.estado();
  }
  return { jogo, estado };
}

test("a primeira pergunta é o traço que divide os 24 perfis mais perto da metade", () => {
  const { key, number, split } = pergunta(new AkinatorGame().estado());
  const distancia = (k: string) => Math.abs(PEOPLE.filter((p) => p.traits.some((t) => t === k)).length - 12);

  assert.equal(number, 1);
  assert.equal(split.yes + split.no, 24);
  assert.equal(distancia(key), Math.min(...TRAIT_KEYS.map(distancia)));
});

test("Sim elimina quem não tem o traço", () => {
  const jogo = new AkinatorGame();
  const { key, split } = pergunta(jogo.estado());
  jogo.responder(key, "sim");
  const estado = jogo.estado();

  assert.equal(estado.remaining, split.yes);
  for (const c of estado.candidates) assert.equal(c.possible, c.traits.includes(key));
  assert.deepEqual(estado.deduced.confirmed.map((d) => d.key), [key]);
});

test("Não Sei avança a pergunta sem eliminar ninguém", () => {
  const jogo = new AkinatorGame();
  jogo.responder(pergunta(jogo.estado()).key, "nsei");
  const estado = jogo.estado();

  assert.equal(estado.remaining, 24);
  assert.equal(pergunta(estado).number, 2);
  assert.equal(estado.progress.answered, 1);
  assert.deepEqual(estado.deduced, { confirmed: [], eliminated: [] });
});

test("duas respostas prováveis contra um perfil somam custo 3 e o eliminam", () => {
  const ana = PEOPLE[0];
  const jogo = new AkinatorGame();
  const contraAna = () => {
    const { key } = pergunta(jogo.estado());
    jogo.responder(key, ana.traits.includes(key) ? "pnao" : "psim");
    return jogo.estado().candidates[0];
  };

  assert.deepEqual([contraAna().cost, jogo.estado().candidates[0].possible], [1.5, true]);
  assert.deepEqual([contraAna().cost, jogo.estado().candidates[0].possible], [3, false]);
  const deduzidos = [...jogo.estado().deduced.confirmed, ...jogo.estado().deduced.eliminated];
  assert.ok(deduzidos.every((d) => d.tentative));
});

test("acha qualquer um dos 24 perfis quando as respostas são sinceras", (t) => {
  const perguntas: number[] = [];
  for (const pessoa of PEOPLE) {
    const { estado } = jogarComo(pessoa);
    assert.equal(estado.phase, "palpite");
    assert.equal(estado.guess!.person.name, pessoa.name);
    assert.equal(estado.guess!.confidence, 1);
    assert.equal(estado.guess!.reason, "unico_candidato");
    perguntas.push(estado.progress.answered);
  }
  const media = perguntas.reduce((a, b) => a + b, 0) / perguntas.length;
  t.diagnostic(`perguntas por partida: mín ${Math.min(...perguntas)}, média ${media.toFixed(2)}, ` +
    `máx ${Math.max(...perguntas)} (ideal ⌈log2 24⌉ = 5)`);
  assert.ok(Math.max(...perguntas) <= TRAIT_KEYS.length);
});

test("só com Não Sei chega ao limite e chuta com confiança 1/24", () => {
  const jogo = new AkinatorGame();
  for (let i = 0; i < TRAIT_KEYS.length; i++) jogo.responder(pergunta(jogo.estado()).key, "nsei");
  const estado = jogo.estado();

  assert.equal(estado.phase, "palpite");
  assert.equal(estado.guess!.reason, "limite_perguntas");
  assert.equal(estado.guess!.person.name, "Ana");
  assert.equal(estado.guess!.confidence, Number((1 / 24).toFixed(4)));
  assert.equal(estado.progress.percent, 100);
});

test("recusa resposta para outra pergunta, resposta depois do palpite e confirmação antecipada", () => {
  const jogo = new AkinatorGame();
  const { key } = pergunta(jogo.estado());
  const outra = TRAIT_KEYS.find((k) => k !== key)!;
  const conflito = (err: unknown) => err instanceof AkinatorError && err.status === 409;

  assert.throws(() => jogo.responder(outra, "sim"), conflito);
  assert.throws(() => jogo.confirmar(true), conflito);

  const { jogo: terminado } = jogarComo(PEOPLE[5]);
  assert.throws(() => terminado.responder(key, "sim"), conflito);
});

test("confirmar fecha a partida com o número de perguntas", () => {
  const { jogo, estado } = jogarComo(PEOPLE[11]);
  jogo.confirmar(true);
  const fim = jogo.estado();

  assert.equal(fim.phase, "fim");
  assert.deepEqual(fim.result, { correct: true, questionsAsked: estado.progress.answered });
  assert.throws(() => jogo.confirmar(false), AkinatorError);
});
