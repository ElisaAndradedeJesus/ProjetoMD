# Busca Binária — Jogos de Adivinhação

Monorepo do trabalho de Matemática Discreta. Três modos de jogo para estudar complexidade (Big O):

| Modo | Quem adivinha | Intervalo | Tentativas | Complexidade |
|---|---|---|---|---|
| **Desafiar a Máquina** | o usuário | 1–100 | 7 | O(1) por palpite, O(k) por partida |
| **Máquina Vidente** | a máquina (busca binária) | 0–100 | 7 | O(log n) por partida |
| **Akinator** | a máquina (perguntas sim/não) | 24 personagens | até 16 (na prática 4–5) | O(t·n) por pergunta |

Por que 7 tentativas? A busca binária corta o intervalo pela metade a cada palpite.
Para 101 números: 101 → 50 → 25 → 12 → 6 → 3 → 1. Isso dá ⌈log2(101+1)⌉ = **7** passos no pior caso.

```
.
├── backend/            API em Python (FastAPI)
│   ├── app/
│   │   ├── complexidade.py      contador de operações + prints [BIG-O]
│   │   ├── jogos/
│   │   │   ├── desafiar_maquina.py
│   │   │   ├── maquina_vidente.py
│   │   │   ├── akinator.py
│   │   │   └── akinator_arvore.py   árvore de decisão + estratégias
│   │   ├── api.py               rotas HTTP
│   │   ├── cli.py               jogar pelo terminal
│   │   ├── analise.py           linear O(n) x binária O(log n)
│   │   └── analise_akinator.py  estratégias do Akinator comparadas
│   └── tests/
└── frontend/           (próxima etapa)
```

## Rodando o backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python -m app.cli                  # jogar no terminal vendo os prints de Big O
python -m app.analise              # tabela comparando busca linear e binária
python -m app.analise_akinator     # estratégias do Akinator: linear x ordem fixa x aleatória x metade
uvicorn app.api:app --reload       # API em http://localhost:8000/docs
python -m pytest                   # testes
```

## Rodando o backend no Ubuntu

```bash
sudo apt install python3-venv python3-pip   # só na primeira vez
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Para desligar os prints: `BIGO_VERBOSE=0`.

## Endpoints

**Desafiar a Máquina**
- `POST /desafiar-maquina` → cria partida (a máquina sorteia o número)
- `POST /desafiar-maquina/{id}/palpite` body `{"numero": 27}` → responde `maior`, `menor` ou `acertou`
- `GET  /desafiar-maquina/{id}` → estado e histórico. O `segredo` só aparece quando a partida termina.

**Máquina Vidente**
- `POST /maquina-vidente` → cria partida, já com o primeiro palpite (50)
- `POST /maquina-vidente/{id}/feedback` body `{"feedback": "maior" | "menor" | "acertou"}`
- `GET  /maquina-vidente/{id}` → estado, intervalo ativo, candidatos, histórico e "pensamento" de cada passo

**Akinator**
- `GET  /akinator/personagens` → lista `[{ "name": "Ana", "traits": ["loiro", ...] }]`
- `POST /akinator` → cria partida, já com a primeira pergunta
- `POST /akinator/{id}/resposta` body `{"resposta": "sim" | "nao" | "nsei" | "psim" | "pnao"}`
- `POST /akinator/{id}/confirmacao` body `{"acertou": true}` → depois do palpite
- `GET  /akinator/arvore?estrategia=metade|ordem_fixa|aleatoria` → árvore de decisão completa + estatísticas
- `GET  /akinator/analise` → comparação das estratégias (média e pior caso de perguntas)
- `GET  /akinator/{id}` → pergunta atual (com a divisão sim/não), candidatos restantes, traços confirmados/eliminados, palpite

Status: `jogando` → `palpite` → `acertou` ou `errou`.

O estado da partida tem `caminho_na_arvore` (ex.: `["sim", "nao", "sim"]`): enquanto
o usuário só responde Sim/Não, a partida segue exatamente esse caminho na árvore de
`/akinator/arvore`, então o front pode acender o caminho. Com "Não sei" ou "Provavelmente"
o jogo sai da árvore e o campo vem `null`.

Toda resposta traz um campo `complexidade` com as operações contadas e o tempo em ms.

## Análise de complexidade

| Operação | Custo | Por quê |
|---|---|---|
| Sortear o número | O(1) | `random.randint` |
| Avaliar um palpite | O(1) | no máximo 2 comparações |
| Calcular o meio do intervalo | O(1) | `(baixo + alto) // 2` |
| Guardar no histórico | O(1) amortizado | `list.append` |
| Buscar partida pelo id | O(1) médio | dicionário (hash table) |
| Partida da Máquina Vidente | **O(log n)** | o intervalo cai pela metade a cada passo |
| Busca linear (comparação) | O(n) | testa número por número |

Resultado de `python -m app.analise` (pior caso, nº de comparações):

| n | linear O(n) | binária O(log n) |
|---:|---:|---:|
| 100 | 100 | 7 |
| 1.000 | 1.000 | 10 |
| 1.000.000 | 1.000.000 | 20 |
| 1.000.000.000 | 1.000.000.000 | 30 |

### Akinator: busca binária com perguntas

O Akinator não busca num intervalo de números, mas a ideia é a mesma: a cada
pergunta a máquina escolhe o traço que divide os candidatos restantes o mais
perto possível de 50% / 50%. Uma divisão perfeita descarta metade a cada resposta:
24 → 12 → 6 → 3 → 2 → 1.

Como cada resposta sim/não só separa em 2 grupos, **nenhum** algoritmo garante
achar 1 entre 24 com menos de ⌈log2 24⌉ = 5 perguntas. Testando os 24 personagens
respondendo certo, a máquina acerta em 4 perguntas (8 personagens) ou 5 (16 personagens),
ou seja, atinge esse limite.

| Operação | Custo | Por quê |
|---|---|---|
| Atualizar custos após uma resposta | O(n) | 1 verificação por personagem (traços guardados em conjunto, `in` é O(1)) |
| Escolher a próxima pergunta | O(t·n) | para cada traço (t = 16), conta quem o tem (n = 24) |
| Escolher o palpite | O(n) | menor custo entre os restantes |

Respostas "provavelmente" contam metade: um personagem só é eliminado com uma
contradição firme (Sim/Não) ou duas "provavelmente" contraditórias. "Não sei" não elimina ninguém.

### Árvore de decisão

Toda estratégia de perguntas sim/não é uma **árvore binária**: cada nó é uma
pergunta, cada aresta é uma resposta e cada folha é um personagem. O número de
perguntas até um personagem é a **profundidade** da folha dele, e o pior caso
é a **altura** da árvore.

Uma árvore binária de altura h tem no máximo 2^h folhas. Para caber n personagens,
2^h ≥ n, ou seja, **h ≥ ⌈log2 n⌉** para qualquer estratégia. Na base real, a
estratégia "metade" gera uma árvore de altura 5 = ⌈log2 24⌉, com 24 folhas e
23 perguntas (toda árvore binária completa tem n − 1 nós internos).

Construir a árvore custa O(t·n) por nível (os nós de um nível somam no máximo n
candidatos), logo O(t·n·h) ≈ O(t·n·log n).

### Comparando estratégias

Resultado de `python -m app.analise_akinator` (perguntas por partida: média / pior caso).
As bases sintéticas têm personagens inventados com a **mesma frequência de traços da
base real** (ruivo é raro, sorriso é comum):

| base | ⌈log2 n⌉ | linear | ordem fixa | aleatória | metade |
|---|---:|---:|---:|---:|---:|
| real (24) | 5 | 12,46 / 23 | 5,12 / 7 | 5,08 / 8 | **4,67 / 5** |
| n = 100 | 7 | 50,49 / 99 | 7,19 / 10 | 7,54 / 12 | **6,78 / 9** |
| n = 500 | 9 | 250,50 / 499 | 9,61 / 13 | 10,26 / 16 | **9,14 / 11** |
| n = 1.000 | 10 | 500,50 / 999 | 10,63 / 16 | 11,37 / 16 | **10,19 / 14** |
| n = 2.000 | 11 | 1.000,50 / 1.999 | 11,63 / 16 | 12,36 / 16 | **11,25 / 15** |

- **linear** ("É a Ana? É o Bruno?…"): O(n), uma árvore "torta" de altura n − 1.
- **metade**: média colada em log2 n, O(log n). Ganha das outras em todas as bases.
- **ordem fixa / aleatória**: perto na média, mas com pior caso maior, porque
  fazem perguntas que dividem mal ("é ruivo?" separa só 2 de 24).
- O pior caso da "metade" passa de ⌈log2 n⌉ nas bases grandes porque com só 16
  traços nem sempre existe uma pergunta que divida exatamente ao meio.
