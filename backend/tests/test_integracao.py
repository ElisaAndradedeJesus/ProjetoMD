"""Regressão: os jogos compartilham a API, mas têm contratos distintos."""
from fastapi.testclient import TestClient
from app.api import app


def test_genius_e_akinator_coexistem_sem_confundir_respostas_ou_sessoes():
    with TestClient(app) as client:
        genius = client.post("/genius").json()
        akinator = client.post("/akinator").json()
        assert client.post(f"/genius/{genius['id']}/resposta", json={"resposta": True}).status_code == 200
        assert client.post(f"/akinator/{akinator['id']}/resposta", json={"resposta": "sim"}).status_code == 200
        assert client.get(f"/genius/{akinator['id']}").status_code == 404
        assert client.get(f"/akinator/{genius['id']}").status_code == 404
        assert client.post(f"/genius/{genius['id']}/resposta", json={"resposta": "nsei"}).status_code == 422
        assert client.post(f"/akinator/{akinator['id']}/resposta", json={"resposta": True}).status_code == 422
