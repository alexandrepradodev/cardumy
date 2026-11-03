# ADR 0019: arquivos por URL pré-assinada, atrás da porta FileStorage

- Status: aceito
- Data: 2026-11-03

## Contexto

Um card pode ter uma imagem. Imagens não cabem bem no banco: incham os
backups e cada leitura arrasta megabytes pela conexão. O ADR 0001 já escolheu
o Cloudflare R2 (API S3) e uploads que não passam pela API. Falta decidir
como a API autoriza um envio que ela não carrega e como confere o resultado.

## Decisão

- **Porta `FileStorage` no kernel compartilhado** (`src/shared/ports/`), porque
  outros módulos também vão guardar arquivos. Quatro operações:
  `createUploadUrl`, `createDownloadUrl`, `describe` (tipo e tamanho do que
  chegou, ou `null`) e `delete` (apagar o que não existe não é erro).
- **Upload em duas etapas:**
  1. `POST /cards/:cardId/image/upload`: o cliente declara tipo e tamanho; a
     API valida, gera a chave e devolve uma URL pré-assinada de `PUT`, válida
     por **5 minutos**, com os cabeçalhos que o cliente deve mandar.
  2. `PUT /cards/:cardId/image`: o cliente avisa que terminou; a API consulta
     o storage (`describe`), confere de novo o arquivo que **realmente**
     chegou e só então prende a imagem ao card. Sem arquivo, `409`.
- **A assinatura cobre `content-type` e `content-length`.** O SDK da AWS, por
  padrão, assina o tamanho mas não o tipo; listamos os dois em
  `signableHeaders`. Assim o próprio storage recusa (`403`) um arquivo maior
  ou de outro tipo que o declarado, antes de qualquer byte chegar.
- **Bucket privado.** Toda resposta de card traz `imageUrl`, uma URL
  pré-assinada de download válida por **1 hora**, ou `null`.
- **Adapter `S3FileStorage`** com o AWS SDK v3, `forcePathStyle` e checksum
  automático desligado (`WHEN_REQUIRED`): sem isso, o SDK põe na URL o
  checksum de um corpo vazio, e o R2 e a AWS recusariam o arquivo real.
- **Configuração `S3_*`** validada na subida (endereço, região, bucket,
  chaves), obrigatória em produção.

## Alternativas descartadas

- **Upload pela API (multipart):** a API carregaria cada arquivo na memória e
  na conexão, ficando lenta para todos e pagando a banda duas vezes.
- **Bucket público:** dispensaria a URL de download, mas qualquer pessoa com
  o endereço veria a imagem de qualquer card.
- **Confiar no que o cliente declarou:** o pedido pode vir de um curl, e o
  arquivo enviado pode não ser o declarado. Conferimos antes e depois.

## Consequências

- A API nunca carrega bytes de arquivo; só assina e confere.
- O `imageUrl` muda a cada leitura e vence em 1 hora: o cliente não deve
  guardá-lo, e sim pedir o card de novo.
- O checksum desligado não é verificável localmente (o RustFS o ignora): só um
  teste contra o R2 de verdade o comprova.
