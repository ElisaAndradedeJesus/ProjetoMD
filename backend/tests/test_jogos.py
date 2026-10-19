import pytest
from fastapi.testclient import TestClient

from app.api import app
from app.jogos import DesafiarMaquina, MaquinaVidente


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
