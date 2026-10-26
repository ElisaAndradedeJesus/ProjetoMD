"""
API HTTP dos três níveis de jogos (FastAPI).
Rodar:  uvicorn app.api:app --reload
Docs:   http://localhost:8000/docs

As partidas ficam em memória num dicionário: buscar uma partida pelo id
é O(1) em média (hash table).
"""
import uuid
from functools import lru_cache
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.complexidade import log
from app.jogos import Akinator, DesafiarMaquina, Genius, MaquinaVidente
from app.jogos.akinator import PERSONAGENS
from app.jogos.akinator_arvore import ESTRATEGIAS, base_real, construir_arvore, estatisticas
from app.analise_akinator import analise

app = FastAPI(title="Busca Binária — Jogos", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

partidas: dict[str, DesafiarMaquina | MaquinaVidente | Akinator | Genius] = {}


class PalpiteIn(BaseModel):
    numero: int


class FeedbackIn(BaseModel):
    feedback: Literal["maior", "menor", "acertou"]


class RespostaIn(BaseModel):
    resposta: Literal["sim", "nao", "nsei", "psim", "pnao"]


class ConfirmacaoIn(BaseModel):
    acertou: bool


def _buscar(partida_id: str, tipo: type):
    partida = partidas.get(partida_id)  # O(1) médio
    log(f"Busca da partida {partida_id[:8]} no dicionário: O(1)")
    if not isinstance(partida, tipo):
        raise HTTPException(404, "Partida não encontrada.")
    return partida


@app.get("/health")
def health():
    return {"ok": True}


# ---------- Modo 1: Desafiar a Máquina ----------
@app.post("/desafiar-maquina", status_code=201)
def novo_desafio():
    partida_id = str(uuid.uuid4())
    partidas[partida_id] = DesafiarMaquina()
    return {"id": partida_id, **partidas[partida_id].estado()}


@app.get("/desafiar-maquina/{partida_id}")
def estado_desafio(partida_id: str):
    return {"id": partida_id, **_buscar(partida_id, DesafiarMaquina).estado()}


@app.post("/desafiar-maquina/{partida_id}/palpite")
def palpitar(partida_id: str, body: PalpiteIn):
    partida = _buscar(partida_id, DesafiarMaquina)
    try:
        partida.palpitar(body.numero)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"id": partida_id, **partida.estado()}


# ---------- Modo 2: Máquina Vidente ----------
@app.post("/maquina-vidente", status_code=201)
def nova_vidente():
    partida_id = str(uuid.uuid4())
    partidas[partida_id] = MaquinaVidente()
    return {"id": partida_id, **partidas[partida_id].estado()}


@app.get("/maquina-vidente/{partida_id}")
def estado_vidente(partida_id: str):
    return {"id": partida_id, **_buscar(partida_id, MaquinaVidente).estado()}


@app.post("/maquina-vidente/{partida_id}/feedback")
def feedback(partida_id: str, body: FeedbackIn):
    partida = _buscar(partida_id, MaquinaVidente)
    try:
        partida.responder(body.feedback)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"id": partida_id, **partida.estado()}


# ---------- Modo 3: Akinator ----------
@app.get("/akinator/personagens")
def personagens():
    return PERSONAGENS


@app.get("/akinator/arvore")
def arvore(estrategia: Literal["metade", "ordem_fixa", "aleatoria"] = "metade"):
    """Árvore de decisão completa da estratégia escolhida."""
    raiz = construir_arvore(base_real(), ESTRATEGIAS[estrategia]())
    return {"estrategia": estrategia, "estatisticas": estatisticas(raiz), "arvore": raiz}


@lru_cache  # sementes fixas, o resultado nunca muda
def _analise_cache():
    return analise([100, 500, 1_000])


@app.get("/akinator/analise")
def analise_estrategias():
    """Média e pior caso de perguntas de cada estratégia."""
    return _analise_cache()


@app.post("/akinator", status_code=201)
def novo_akinator():
    partida_id = str(uuid.uuid4())
    partidas[partida_id] = Akinator()
    return {"id": partida_id, **partidas[partida_id].estado()}


@app.get("/akinator/{partida_id}")
def estado_akinator(partida_id: str):
    return {"id": partida_id, **_buscar(partida_id, Akinator).estado()}


@app.post("/akinator/{partida_id}/resposta")
def responder_akinator(partida_id: str, body: RespostaIn):
    partida = _buscar(partida_id, Akinator)
    try:
        partida.responder(body.resposta)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"id": partida_id, **partida.estado()}


@app.post("/akinator/{partida_id}/confirmacao")
def confirmar_akinator(partida_id: str, body: ConfirmacaoIn):
    partida = _buscar(partida_id, Akinator)
    try:
        partida.confirmar(body.acertou)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"id": partida_id, **partida.estado()}


class RespostaGeniusIn(BaseModel):
    resposta: bool


# ---------- Modo 3: Genius Característico ----------
@app.post("/genius", status_code=201)
def novo_genius():
    partida = Genius()
    partidas[partida.id] = partida
    return partida.estado()


@app.get("/genius/{partida_id}")
def estado_genius(partida_id: str):
    return _buscar(partida_id, Genius).estado()


@app.post("/genius/{partida_id}/resposta")
def responder_genius(partida_id: str, body: RespostaGeniusIn):
    partida = _buscar(partida_id, Genius)
    try:
        partida.responder(body.resposta)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return partida.estado()


@app.post("/genius/{partida_id}/confirmacao")
def confirmar_genius(partida_id: str, body: ConfirmacaoIn):
    partida = _buscar(partida_id, Genius)
    try:
        partida.confirmar(body.acertou)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return partida.estado()
