import pytest
from fastapi.testclient import TestClient

from app.api import app
from app.jogos import DesafiarMaquina, Genius, MaquinaVidente
from app.jogos.genius import PERFIS


def test_desafio_acerta_com_busca_binaria_para_qualquer_segredo():
    for segredo in range(1, 101):
        jogo = DesafiarMaquina(segredo=segredo)
        baixo, alto = 1, 100
        while jogo.status == "jogando":
            p = jogo.palpitar((baixo + alto) // 2)
            if p.resultado == "maior":
                baixo = p.numero + 1
            elif p.resultado == "menor":
                alto = p.numero - 1
        assert jogo.status == "venceu"
        assert jogo.tentativas_usadas <= 7


def test_desafio_perde_apos_7_e_revela_segredo():
    jogo = DesafiarMaquina(segredo=50)
    for _ in range(7):
        jogo.palpitar(1)
    assert jogo.status == "perdeu"
    assert jogo.estado()["segredo"] == 50
    with pytest.raises(ValueError):
        jogo.palpitar(50)


def test_desafio_esconde_segredo_durante_o_jogo():
    jogo = DesafiarMaquina(segredo=42)
    jogo.palpitar(10)
    assert jogo.estado()["segredo"] is None


@pytest.mark.parametrize("numero", range(0, 101))
def test_vidente_acha_qualquer_numero_em_ate_7(numero):
    jogo = MaquinaVidente()
    while jogo.status == "jogando":
        chute = jogo.palpite_atual.numero
        jogo.responder("acertou" if chute == numero else "maior" if numero > chute else "menor")
    assert jogo.status == "acertou"
    assert len(jogo.historico) <= 7


def test_vidente_detecta_dicas_contraditorias():
    jogo = MaquinaVidente(minimo=0, maximo=3)
    assert jogo.palpite_atual.numero == 1
    jogo.responder("maior")   # intervalo vira [2, 3]
    assert jogo.palpite_atual.numero == 2
    jogo.responder("menor")   # intervalo vira [2, 1] -> vazio
    assert jogo.status == "inconsistente"


def test_api_fluxo_completo():
    c = TestClient(app)
    r = c.post("/desafiar-maquina").json()
    r = c.post(f"/desafiar-maquina/{r['id']}/palpite", json={"numero": 50})
    assert r.status_code == 200 and len(r.json()["historico"]) == 1
    assert c.post(f"/desafiar-maquina/{r.json()['id']}/palpite", json={"numero": 500}).status_code == 400

    v = c.post("/maquina-vidente").json()
    assert v["palpite_atual"] == 50
    v = c.post(f"/maquina-vidente/{v['id']}/feedback", json={"feedback": "maior"}).json()
    assert v["intervalo_ativo"] == [51, 100] and v["palpite_atual"] == 75


@pytest.mark.parametrize("perfil", PERFIS)
def test_genius_para_todos_os_54_perfis(perfil):
    jogo = Genius()
    while jogo.status == "jogando":
        pergunta = jogo.pergunta
        assert pergunta is not None
        resposta = (perfil[pergunta.categoria] == pergunta.opcao)
        jogo.responder(resposta)
        assert any(p == perfil for p in jogo.candidatos)
        assert jogo.usadas <= 7

    assert jogo.pergunta is None
    if jogo.status == "descobriu":
        assert jogo.perfil == perfil
    else:
        assert jogo.status == "limite"
        assert jogo.usadas == 7
        assert len(jogo.candidatos) > 1
        assert jogo.perfil is None


def test_genius_erros_e_validacoes():
    jogo = Genius()
    with pytest.raises(ValueError, match="Resposta inválida"):
        jogo.responder("sim")  # type: ignore

    # Finaliza a partida
    while jogo.status == "jogando":
        jogo.responder(True)

    with pytest.raises(ValueError, match="já terminou"):
        jogo.responder(True)


def test_api_genius_fluxo_completo():
    c = TestClient(app)
    # Criar partida
    res = c.post("/genius")
    assert res.status_code == 201
    dados = res.json()
    assert dados["status"] == "jogando"
    assert dados["usadas"] == 0
    assert len(dados["candidatos"]) == 54
    assert dados["pergunta"] is not None
    partida_id = dados["id"]

    # Obter estado
    get_res = c.get(f"/genius/{partida_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == partida_id

    # Responder
    resp_res = c.post(f"/genius/{partida_id}/resposta", json={"resposta": True})
    assert resp_res.status_code == 200
    dados_resp = resp_res.json()
    assert dados_resp["usadas"] == 1
    assert len(dados_resp["historico"]) == 1

    # Partida inexistente
    assert c.get("/genius/id-inexistente").status_code == 404
    assert c.post("/genius/id-inexistente/resposta", json={"resposta": True}).status_code == 404

