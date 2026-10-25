/**
 * Rotas HTTP do Akinator, montadas em /api/akinator.
 *
 * As partidas ficam em memória num Map: buscar uma partida pelo id é O(1)
 * em média (hash table), como o dicionário da API em Python.
 */
import { Router } from "express";
import { log } from "../complexidade.ts";
import { PEOPLE } from "./akinator.data.ts";
import { isAnswerRequest, isConfirmRequest } from "./akinator.dto.ts";
import { AkinatorError, AkinatorGame } from "./akinator.engine.ts";

export function criarRotasAkinator(): Router {
  const partidas = new Map<string, AkinatorGame>();
  const router = Router();

  const buscar = (sessionId: string) => {
    const partida = partidas.get(sessionId); // O(1) médio
    log(`Busca da partida ${sessionId.slice(0, 8)} no Map: O(1)`);
    if (!partida) throw new AkinatorError(404, "Partida não encontrada.");
    return partida;
  };

  router.get("/people", (_req, res) => {
    res.json(PEOPLE);
  });

  router.post("/start", (_req, res) => {
    const partida = new AkinatorGame();
    partidas.set(partida.sessionId, partida);
    res.status(201).json(partida.estado());
  });

  router.post("/answer", (req, res) => {
    if (!isAnswerRequest(req.body)) {
      throw new AkinatorError(400, "Envie sessionId, questionKey e answer (sim, nao, nsei, psim ou pnao).");
    }
    const partida = buscar(req.body.sessionId);
    partida.responder(req.body.questionKey, req.body.answer);
    res.json(partida.estado());
  });

  router.post("/confirm", (req, res) => {
    if (!isConfirmRequest(req.body)) throw new AkinatorError(400, "Envie sessionId e correct (true ou false).");
    const partida = buscar(req.body.sessionId);
    partida.confirmar(req.body.correct);
    res.json(partida.estado());
  });

  return router;
}
