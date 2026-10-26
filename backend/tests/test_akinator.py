import random

import pytest
from fastapi.testclient import TestClient

from app.api import app
from app.jogos import Akinator
from app.jogos.akinator import PERSONAGENS, TRACOS


def jogar_pensando_em(nome: str) -> Akinator:
    tracos = next(p["traits"] for p in PERSONAGENS if p["name"] == nome)
    jogo = Akinator()
    while jogo.status == "jogando":
        jogo.responder("sim" if jogo.pergunta_atual in tracos else "nao")
    return jogo


@pytest.mark.parametrize("nome", [p["name"] for p in PERSONAGENS])
def test_acha_qualquer_personagem_respondendo_certo(nome):
    jogo = jogar_pensando_em(nome)
    assert jogo.status == "palpite"
    assert jogo.palpite.nome == nome
    # ⌈log2 24⌉ = 5
    assert len(jogo.historico) <= 5


def test_nao_sei_nao_elimina_ninguem():
    jogo = Akinator()
    jogo.responder("nsei")
    assert jogo.estado()["quantidade_restantes"] == len(PERSONAGENS)


def test_provavelmente_precisa_de_duas_contradicoes():
    jogo = Akinator(personagens_base=[
        {"name": "A", "traits": ["curto", "oculos"]},
        {"name": "B", "traits": []},
        {"name": "C", "traits": ["curto"]},
        {"name": "D", "traits": ["oculos"]},
    ])
    assert jogo.pergunta_atual == "curto"
    jogo.responder("pnao")  # A e C ficam com 1,5, ainda no jogo
    assert jogo.estado()["quantidade_restantes"] == 4
    assert jogo.pergunta_atual == "oculos"
    jogo.responder("pnao")  # A chega a 3 e sai
    assert "A" not in jogo.estado()["candidatos_restantes"]


def test_respostas_invalidas_e_confirmacao():
    jogo = Akinator()
    with pytest.raises(ValueError):
        jogo.responder("talvez")
    with pytest.raises(ValueError):
        jogo.confirmar(True)
    jogo = jogar_pensando_em("Ana")
    with pytest.raises(ValueError):
        jogo.responder("sim")
    jogo.confirmar(True)
    assert jogo.status == "acertou"


def _referencia_front(log):
    """Cópia direta da lógica do Akinator.tsx, pra garantir que back e front decidem igual."""
    def custo(p):
        c = 0
        for key, ans in log:
            if ans == "nsei":
                continue
            disse_sim = ans in ("sim", "psim")
            if (key in p["traits"]) != disse_sim:
                c += 3 if ans in ("sim", "nao") else 1.5
        return c

    scored = [(p, custo(p)) for p in PERSONAGENS]
    remaining = [s for s in scored if s[1] < 3]
    asked, n = {k for k, _ in log}, len(remaining)
    best, best_gap = None, float("inf")
    for k in TRACOS:
        if k in asked:
            continue
        c = sum(1 for p, _ in remaining if k in p["traits"])
        if c in (0, n):
            continue
        if abs(c - n / 2) < best_gap:
            best, best_gap = k, abs(c - n / 2)
    finished = len(remaining) <= 1 or len(log) >= len(TRACOS) or best is None
    guess = min(remaining or scored, key=lambda s: s[1])[0]["name"]
    return [p["name"] for p, _ in remaining], (None if finished else best), guess, finished


@pytest.mark.parametrize("semente", range(200))
def test_igual_ao_frontend_com_respostas_aleatorias(semente):
    rnd = random.Random(semente)
    jogo, log = Akinator(), []
    while True:
        restantes, proxima, palpite, terminou = _referencia_front(log)
        assert [p.nome for p in jogo.restantes] == restantes
        if terminou:
            assert jogo.status == "palpite" and jogo.palpite.nome == palpite
            break
        assert jogo.pergunta_atual == proxima
        resp = rnd.choice(["sim", "nao", "nsei", "psim", "pnao"])
        log.append((proxima, resp))
        jogo.responder(resp)


def test_api_fluxo_completo():
    c = TestClient(app)
    assert len(c.get("/akinator/personagens").json()) == 24

    r = c.post("/akinator")
    assert r.status_code == 201
    estado = r.json()
    assert estado["pergunta_atual"]["numero"] == 1
    assert estado["quantidade_restantes"] == 24

    pid = estado["id"]
    assert c.post(f"/akinator/{pid}/resposta", json={"resposta": "talvez"}).status_code == 422
    assert c.post(f"/akinator/{pid}/confirmacao", json={"acertou": True}).status_code == 400

    while estado["status"] == "jogando":
        divisao = estado["pergunta_atual"]["divisao"]
        estado = c.post(f"/akinator/{pid}/resposta", json={"resposta": "nao"}).json()
        assert estado["historico"][-1]["divisao"] == divisao
    assert estado["palpite"] is not None and estado["pergunta_atual"] is None

    estado = c.post(f"/akinator/{pid}/confirmacao", json={"acertou": False}).json()
    assert estado["status"] == "errou"
    assert c.get("/akinator/nao-existe").status_code == 404
