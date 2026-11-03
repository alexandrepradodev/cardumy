# Etapa 3: Persistência

Data: 2026-10-27 a 2026-11-03 · Branches: `etapa-03a-banco-de-dados`,
`etapa-03b-login`, `etapa-03b-jwt-auth`, `etapa-03c-file-storage`

## O que foi construído

O Cardumy deixou de esquecer tudo ao reiniciar, ganhou contas de verdade e
cards com imagem. A etapa veio em três blocos:

**Bloco A: banco de dados.**
- Schema Drizzle e migrações versionadas para `decks` e `cards`.
- Repositórios Postgres com mappers entre a linha e a entidade.
- Apagar um deck é atômico, pela porta `TransactionRunner`.
- Testes de contrato: os mesmos testes rodam contra a memória e contra um
  Postgres real do Testcontainers.

**Bloco B: contas e login.**
- Módulo `accounts`: `Email`, `Password`, `User`, cadastro e login.
- Senhas com Argon2id; e-mail único garantido por um índice do banco.
- Login devolve um JWT (HS256, 1 hora). As rotas de estudo exigem
  `Authorization: Bearer`, no lugar do `x-user-id` provisório.

**Bloco C: imagens dos cards.**
- Regras no domínio: `ImageFile` (PNG, JPEG ou WebP, até 5 MB) e `CardImage`
  (chave `cards/<cardId>/<imageId>.<ext>`, só aceita a do próprio card).
- Porta `FileStorage` no kernel compartilhado; casos de uso para pedir o
  upload, confirmar e remover a imagem; arquivos apagados junto com o card ou
  o deck.
- Coluna `cards.image_key` no Postgres.
- Adapter `S3FileStorage` (AWS SDK v3): fala com o R2 em produção e com o
  RustFS no Compose.
- Rotas `POST /cards/:id/image/upload`, `PUT /cards/:id/image` e
  `DELETE /cards/:id/image`; todo card traz `imageUrl`.
- 264 testes. O fluxo inteiro foi conferido com curl contra a API, o Postgres
  e o RustFS reais.

## Conceitos, em poucas palavras

**Migração.** As atualizações do celular: cada mudança no banco é um arquivo
numerado, aplicado em ordem. O banco anota quais já rodou, então qualquer
banco chega ao mesmo formato só aplicando as que faltam. Coluna nova numa
tabela com dados nasce opcional, porque as linhas antigas não têm valor.

**Mapper.** O manual de montagem da estante: desmonta a entidade em colunas
para caber no banco e monta de volta na leitura. Só ele conhece o formato da
tabela.

**Transação.** Tudo ou nada: ou os cards e o deck somem juntos, ou nada muda.

**Teste de contrato.** A mesma prova para todos os candidatos. Se a memória e
o Postgres (ou a memória e o RustFS) passam nos mesmos testes, são
intercambiáveis.

**Hash de senha.** Um moedor: a carne vira carne moída, mas a moída nunca
volta a ser bife. O Argon2id é lento de propósito, e o sal faz senhas iguais
virarem hashes diferentes.

**JWT.** Um crachá com selo. Qualquer um lê o que está escrito, mas só quem
tem o segredo consegue fazer o selo (HMAC), e qualquer mudança no texto
quebra o selo.

**Object storage.** O guarda-volumes: o arquivo fica lá, e o banco guarda só
a ficha (a chave).

**URL pré-assinada.** O cartão-chave do hotel: a recepção (API) libera uma
porta, por um tempo, para uma mala de um tamanho, mas não carrega a mala. O
storage refaz o selo com o que chegou; se o tamanho ou o tipo mudou, `403`.
Tudo que fica fora da assinatura é como o valor em branco de um cheque
assinado.

**Nunca confiar no cliente.** A alfândega lê o formulário, mas passa a mala
no raio-X: a API confere o que foi declarado e, depois, o que realmente
chegou.

**Ordem sem transação.** Banco e bucket não cabem numa transação. Quem é
apontado nasce primeiro e morre por último: o pior caso é um arquivo órfão,
nunca um card apontando para o nada.

**Idempotência.** O botão do elevador: apertar dez vezes não traz dez
elevadores. Confirmar o mesmo upload duas vezes não muda nada.

## Decisões

- Postgres com Drizzle e migrações versionadas
  ([ADR 0011](../adr/0011-postgres-com-drizzle-e-migracoes.md)).
- Transações pela porta `TransactionRunner`
  ([ADR 0012](../adr/0012-transacoes-pela-porta-transaction-runner.md)).
- Testes de contrato com Testcontainers
  ([ADR 0013](../adr/0013-testes-de-contrato-com-testcontainers.md)).
- Kernel compartilhado em `src/shared`
  ([ADR 0014](../adr/0014-kernel-compartilhado.md)).
- Senhas com Argon2id e login sem enumeração
  ([ADR 0015](../adr/0015-senhas-com-argon2id.md)).
- E-mail único garantido pelo índice do banco
  ([ADR 0016](../adr/0016-email-unico-pelo-indice-do-banco.md)).
- Access token JWT com HS256
  ([ADR 0017](../adr/0017-access-token-jwt-hs256.md)).
- Autenticação Bearer na borda
  ([ADR 0018](../adr/0018-autenticacao-bearer-na-borda.md)).
- Arquivos por URL pré-assinada, atrás da porta `FileStorage`
  ([ADR 0019](../adr/0019-arquivos-por-url-pre-assinada.md)).
- Regras da imagem do card
  ([ADR 0020](../adr/0020-regras-da-imagem-do-card.md)).
- RustFS como storage local, no lugar do MinIO
  ([ADR 0021](../adr/0021-rustfs-como-storage-local.md)).

## Tropeços do caminho

- **O caso de uso mudava o card antes de conferir.** Na primeira versão do
  `AttachCardImage`, o card recebia a imagem e só depois a API olhava o
  bucket. Como o repositório em memória compartilha o objeto, um erro deixava
  o card "com imagem" sem arquivo. A correção foi conferir tudo primeiro.
- **A imagem do MinIO sumiu.** O repositório saiu do Docker Hub; testamos
  RustFS e SeaweedFS com o mesmo roteiro antes de trocar.
- **O SDK não assina o `content-type` por padrão.** Um upload `image/png`
  aceitava SVG com `200`. Com `signableHeaders`, passou a dar `403`; tirar a
  correção de propósito fez o teste falhar, o que prova que ele protege a
  regra.
- **Checksum de corpo vazio.** O SDK punha na URL o checksum de um corpo
  vazio. O RustFS ignora, mas o R2 recusaria: desligado com `WHEN_REQUIRED`,
  ainda sem prova contra o R2 de verdade.
- O Drizzle embrulha o erro do driver; o código `23505` do índice único fica
  em `error.cause`.

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `pnpm infra:up` | Liga Postgres, Redis e RustFS (e cria o bucket) |
| `pnpm db:migrate` | Aplica as migrações que faltam |
| `pnpm db:generate --name <nome>` | Gera uma migração a partir do schema |
| `pnpm db:studio` | Abre os dados do banco no navegador |
| abrir `http://localhost:9001` | Painel do RustFS (`cardumy` / `cardumy-local-secret`) |
| `pnpm test` | Roda os 264 testes (precisa do Docker) |
| `pnpm test:fast` | Só os testes em memória, sem Docker |

## Como eu explicaria numa entrevista

> "Troquei os repositórios em memória por Postgres com Drizzle sem tocar nos
> casos de uso: cada adaptador implementa a mesma porta, e um teste de
> contrato roda as mesmas expectativas na memória e num Postgres real do
> Testcontainers. Operações que precisam ser atômicas passam por uma porta de
> transação. Criei contas com senha em Argon2id e login por JWT, com a
> autenticação na borda HTTP e a autorização no caso de uso. Para as imagens,
> a API nunca carrega o arquivo: ela gera uma URL pré-assinada que só aceita
> o tipo e o tamanho declarados, e depois confere no bucket o que realmente
> chegou antes de prender a imagem ao card. Como banco e bucket não cabem numa
> transação, ordeno as operações para que o pior caso seja um arquivo órfão,
> nunca um registro quebrado. O mesmo adapter S3 fala com o R2 em produção e
> com o RustFS localmente."
