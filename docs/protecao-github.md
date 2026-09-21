# Como proteger a versão principal no GitHub

**Este guia é para quem administra o repositório. O restante do grupo pode
seguir apenas o [guia de participação](../CONTRIBUTING.md).**

Já deixamos um arquivo com as regras prontas. Falta colocá-las em funcionamento
nas configurações do GitHub. Só ter o arquivo no projeto não ativa a proteção.

Depois de configurar, para uma mudança entrar na `main`, ela precisará de:

- Um pedido de alteração (pull request, ou PR).
- Aprovação de outra pessoa.
- Um título no formato combinado pelo grupo.
- Comentários da revisão resolvidos.

O GitHub também vai impedir que alguém apague a `main` ou substitua seu histórico
à força. Se alguém mudar o código depois de receber aprovação, será preciso
aprovar novamente.

## 1. Coloque estes arquivos no GitHub

Esta primeira configuração está na branch `chore/politicas-contribuicao`.
Quem está preparando esses arquivos deve salvá-los em um commit e enviar essa
branch para o GitHub, seguindo os passos 5 e 6 do guia de participação.

Abra o pedido para `main` com o título:

```text
chore: adiciona políticas de contribuição
```

No pedido, procure a verificação chamada `pr-policy` e confira se passou.
Se o GitHub pedir autorização para executar a verificação pela primeira vez,
quem administra o repositório precisa autorizar.

Peça para outra pessoa revisar e use **Squash and merge** para colocar os arquivos
na `main`. Esse botão transforma as mudanças do pedido em um único registro.

Faça isso antes do próximo passo: o GitHub precisa conhecer a verificação antes
de exigir que ela passe. Termine a configuração antes de liberar o uso pelo grupo.

## 2. Escolha como os pedidos serão aceitos

Na página do repositório, abra **Settings → General**. Settings significa
“Configurações”. Encontre a seção **Pull Requests** e deixe assim:

- **Allow squash merging:** marcado. É o botão que o grupo vai usar.
- Na opção de mensagem do squash, escolha **Pull request title**. Assim, o título
  do pedido será usado como mensagem do registro na `main`.
- **Allow merge commits:** desmarcado.
- **Allow rebase merging:** desmarcado.
- **Automatically delete head branches:** marcado. Apaga do GitHub a branch
  da tarefa depois que o pedido é aceito; a `main` continua existindo.

## 3. Carregue o arquivo de proteção

1. Abra **Settings → Rules → Rulesets**. Rulesets são conjuntos de regras.
2. Clique em **New ruleset → Import a ruleset** para carregar um arquivo de regras.
3. Selecione o arquivo `.github/main-ruleset.json` da pasta do projeto no seu
   computador. [Este é o arquivo](../.github/main-ruleset.json).
4. Confira se aparece **Active**, que significa que as regras estão ligadas.
5. Confira se a branch protegida é `main`.
6. Deixe a **Bypass list** vazia. Essa é a lista de quem pode ignorar as regras;
   não queremos liberar exceções.
7. Confira se a verificação exigida é `pr-policy`, com origem em **GitHub Actions**,
   o serviço do GitHub que executa nossa verificação automática.
8. Salve as regras.

O arquivo também exige que a branch esteja atualizada com a `main` e que a
aprovação venha de alguém diferente de quem enviou as últimas mudanças.

As regras valem inclusive para quem administra o projeto. Mas administradores
conseguem desligá-las nas configurações, então não dê acesso de administrador
para toda a turma.

## 4. Confira se funcionou

Faça um pedido pequeno, mudando apenas um texto:

1. Coloque o título `alterei o texto`. A verificação `pr-policy` deve falhar.
2. Edite o título para `docs: melhora explicação do projeto`. Ela deve passar.
3. Sem aprovação de outra pessoa, o botão de aceitar a mudança deve continuar
   bloqueado.
4. Peça aprovação a outro colaborador com permissão de escrita. Depois que
   todos os requisitos forem cumpridos, **Squash and merge** deve ficar disponível.

Uma aprovação é suficiente para começar. Exigir duas pode travar o trabalho
se só duas pessoas estiverem participando, pois ninguém aprova o próprio pedido.

## Se a opção de regras não aparecer

A disponibilidade depende do plano do GitHub e de o repositório ser público
ou privado. Em repositórios públicos, esse recurso está disponível no plano
Free. Se não estiver disponível no seu caso, os arquivos do projeto, sozinhos,
não conseguem impedir mudanças na `main`.

## O que ainda vamos adicionar?

Por enquanto, a verificação automática só confere o título do pedido.
Quando escolhermos a linguagem e as ferramentas, poderemos incluir verificações
que executam o programa e procuram erros antes de aceitar mudanças.

Quem revisa também deve conferir mudanças na pasta `.github/`: é nela que ficam
as regras e a verificação. Não mude o nome `pr-policy` sem atualizar a regra que
exige essa verificação, ou os pedidos podem ficar bloqueados.

Para consultar os detalhes no site do GitHub:

- [Como criar e importar regras](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [O que cada regra faz](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
