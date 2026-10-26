import math

import pytest
from fastapi.testclient import TestClient

from app.analise_akinator import analise
from app.api import app
from app.jogos import Akinator
from app.jogos.akinator import PERSONAGENS
from app.jogos.akinator_arvore import (
    ESTRATEGIAS, base_real, base_sintetica, construir_arvore, estatisticas,
    estatisticas_linear, folhas,
)


def caminho_ate(arvore: dict, nome: str) -> list[tuple[str, str]]:
    tracos = next(p["traits"] for p in PERSONAGENS if p["name"] == nome)
    caminho, no = [], arvore
    while no["tipo"] == "pergunta":
        resp = "sim" if no["traco"] in tracos else "nao"
        caminho.append((no["traco"], resp))
        no = no[resp]
    assert no["personagem"] == nome
    return caminho


@pytest.mark.parametrize("nome", [p["name"] for p in PERSONAGENS])
def test_partida_segue_exatamente_o_caminho_da_arvore(nome):
    arvore = construir_arvore(base_real())
    caminho = caminho_ate(arvore, nome)

    jogo = Akinator()
    for traco, resp in caminho:
        assert jogo.pergunta_atual == traco
        jogo.responder(resp)
    assert jogo.status == "palpite" and jogo.palpite.nome == nome
    assert jogo.estado()["caminho_na_arvore"] == [r for _, r in caminho]


def test_caminho_some_com_resposta_nao_firme():
    jogo = Akinator()
    jogo.responder("psim")
    assert jogo.estado()["caminho_na_arvore"] is None


@pytest.mark.parametrize("estrategia", list(ESTRATEGIAS))
def test_arvore_e_binaria_completa_com_uma_folha_por_personagem(estrategia):
    arvore = construir_arvore(base_real(), ESTRATEGIAS[estrategia]())
    est = estatisticas(arvore)
    nomes = sorted(f["personagem"] for f in folhas(arvore))
    assert nomes == sorted(p["name"] for p in PERSONAGENS)
    assert est["folhas"] == 24 and est["nos_pergunta"] == 23
    # 2^h >= n folhas
    assert est["altura"] >= math.ceil(math.log2(24))
    assert sum(est["distribuicao"].values()) == 24


def test_metade_atinge_o_limite_teorico_na_base_real():
    est = estatisticas(construir_arvore(base_real()))
    assert est["altura"] == est["limite_teorico"] == 5
    assert est["media_perguntas"] == pytest.approx(4.67)


def test_linear():
    est = estatisticas_linear(24)
    assert est["altura"] == 23 and est["melhor_caso"] == 1
    assert est["media_perguntas"] == pytest.approx((sum(range(1, 24)) + 23) / 24, abs=0.01)


def test_base_sintetica_tem_perfis_unicos():
    base = base_sintetica(500)
    assert len(base) == 500 and len({t for _, t in base}) == 500
    with pytest.raises(ValueError):
        base_sintetica(5000)


def test_metade_ganha_na_media_em_todas_as_bases():
    for linha in analise([100, 500]):
        metade = linha["metade"]["media_perguntas"]
        for outra in ("linear", "ordem_fixa", "aleatoria"):
            assert metade <= linha[outra]["media_perguntas"], (linha["base"], outra)
        assert linha["metade"]["altura"] >= linha["metade"]["limite_teorico"]


def test_api_arvore_e_analise():
    c = TestClient(app)
    r = c.get("/akinator/arvore").json()
    assert r["estrategia"] == "metade" and r["estatisticas"]["altura"] == 5
    assert r["arvore"]["tipo"] == "pergunta" and len(r["arvore"]["nomes"]) == 24
    assert c.get("/akinator/arvore?estrategia=ordem_fixa").status_code == 200
    assert c.get("/akinator/arvore?estrategia=xyz").status_code == 422

    linhas = c.get("/akinator/analise").json()
    assert linhas[0]["base"].startswith("real")
    assert {"linear", "ordem_fixa", "aleatoria", "metade"} <= set(linhas[0])
