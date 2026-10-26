# ProjetoMD — Jogos de Adivinhação

Trabalho de Matemática Discreta para a feira de ciência e tecnologia. Uma interface reúne três níveis para explorar busca binária, conjuntos, combinatória e árvores de decisão.

| Nível | Jogo | Como funciona |
| --- | --- | --- |
| 1 · Números | Desafiar a Máquina | Adivinhe um número de 1 a 100 em até 7 palpites. |
| 1 · Números | Máquina Vidente | Pense em um número de 0 a 100; a máquina usa busca binária, com até 7 palpites. |
| 2 · Características | Genius Característico | Pense em um dos 54 perfis; responda até 7 perguntas de Sim/Não. |
| 3 · Personagens | Akinator | Escolha um dos 24 personagens da lista e acompanhe a árvore de decisão. |

## Começar

Requisitos: Python 3.10 ou superior, Node.js 24 e pnpm 12.14.0. A demonstração completa usa **somente a API Python e o frontend**, na mesma cópia deste repositório.

Terminal 1, na raiz:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.api:app --host 127.0.0.1 --port 8000
```

No Windows: use `python` no lugar de `python3` e `.venv\Scripts\activate` para ativar o ambiente.

Terminal 2, na raiz:

```bash
cd frontend
corepack pnpm install --frozen-lockfile
corepack pnpm dev --host 127.0.0.1
```

Abra http://localhost:5173. Saúde da API: http://localhost:8000/health. Documentação interativa: http://localhost:8000/docs.
Se `corepack` não estiver instalado, instale o pnpm e use `pnpm` nos comandos.

## Documentação

- [Preparação e roteiro de apresentação](docs/apresentacao.md)
- [Backend, endpoints e complexidade](backend/README.md)
- [Frontend e configuração](frontend/README.md)
- [Resultados da validação](docs/validacao.md)
- [Mapa da integração das branches](docs/integracao.md)
- [Como contribuir](CONTRIBUTING.md)
- [Proteção da main](docs/protecao-github.md)

## Verificar a entrega

```bash
cd backend
python -m pytest -q
cd ../frontend
corepack pnpm test
corepack pnpm build
```

O build verifica TypeScript e gera `frontend/dist`. Depois use `corepack pnpm preview --host 127.0.0.1` para conferir a versão de produção. Mantenha a API ligada.

## Organização

`frontend/src` contém a interface React/TypeScript; `backend/app` contém todos os jogos e a API FastAPI; `backend/tests` contém os testes Python.
`backend/src` preserva uma implementação alternativa do Akinator em Express/TypeScript, com contrato próprio em `/api/akinator`. Ela não é usada pela interface integrada. Veja o [mapa da integração](docs/integracao.md).

As partidas ficam em memória. Reiniciar a API apaga as sessões; abra uma nova partida no menu. Instale as dependências antes da apresentação: com os pacotes instalados, os jogos não precisam de serviços externos.

## Como usar as tarefas (Issues)

Uma **issue** é uma ficha de tarefa: nela ficam o que precisa ser feito,
quem está cuidando e os comentários sobre a entrega. O **Project** é o quadro
que reúne essas tarefas e mostra o andamento.

### Para criar uma tarefa

1. Abra a aba [Issues](https://github.com/ElisaAndradedeJesus/ProjetoMD/issues)
   e confira se a tarefa já existe.
2. Clique em **New issue**. Use um título específico, como
   `[Grupo 1] Criar histórico de palpites`.
3. Explique o objetivo, o que precisa funcionar para a tarefa estar pronta
   e se ela depende de outra tarefa. Inclua referências, como o link do Figma.
4. Clique em **Create** para salvar. A issue receberá um número, como `#12`.
5. No campo **Projects** da issue, selecione o quadro da turma.
   Se não conseguir, peça ajuda a quem organiza o quadro.

### Para pegar uma tarefa e acompanhar o andamento

1. Escolha uma issue disponível e comente que quer trabalhar nela.
   Combine com o responsável se já houver alguém trabalhando.
2. Em **Assignees**, registre quem vai cuidar da tarefa. Se não tiver acesso
   para alterar esse campo, peça ajuda a um colaborador.
3. No quadro, atualize a situação conforme o trabalho avançar. Use os
   comentários da issue para registrar dúvidas, decisões e impedimentos.
4. Para enviar mudanças nos arquivos, siga o [guia de contribuição](CONTRIBUTING.md).
   No campo **Issue** da descrição do pull request, escreva `#12`, trocando
   pelo número da tarefa.
5. Se o pull request concluir toda a tarefa, use `Closes #12`. Por padrão,
   isso encerra a issue quando o PR entra na branch padrão do repositório.
   Se entregar só uma parte, mantenha apenas `#12` e deixe a issue aberta.

Para entregas sem pull request, como uma apresentação em link externo,
registre o resultado na issue. Depois que alguém conferir a entrega, use
**Close issue** e atualize a situação no quadro, se necessário.
