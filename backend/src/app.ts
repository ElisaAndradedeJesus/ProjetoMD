/**
 * Aplicação Express do Akinator. Fica separada do server.ts para que os
 * testes subam a API numa porta livre sem precisar do processo principal.
 */
import express, { type ErrorRequestHandler } from "express";
import { criarRotasAkinator } from "./akinator/akinator.routes.ts";
import { AkinatorError } from "./akinator/akinator.engine.ts";

export function criarApp() {
  const app = express();

  // CORS aberto, como o CORSMiddleware da API em Python.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/akinator", criarRotasAkinator());

  app.use((_req, res) => {
    res.status(404).json({ detail: "Rota não encontrada." });
  });

  // Erros sempre como { detail }, o formato que frontend/src/api.ts já lê.
  const tratarErro: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AkinatorError) {
      res.status(err.status).json({ detail: err.message });
    } else if (err?.type === "entity.parse.failed") {
      res.status(400).json({ detail: "O corpo da requisição não é um JSON válido." });
    } else {
      console.error(err);
      res.status(500).json({ detail: "Erro interno no servidor." });
    }
  };
  app.use(tratarErro);

  return app;
}
