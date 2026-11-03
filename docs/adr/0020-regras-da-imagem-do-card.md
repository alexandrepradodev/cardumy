# ADR 0020: regras da imagem do card

- Status: aceito
- Data: 2026-11-03

## Contexto

Com o upload direto ao storage (ADR 0019), a API recebe do cliente apenas
declarações e chaves, ambas fáceis de forjar. E o card (Postgres) e o arquivo
(bucket) moram em sistemas que não cabem numa mesma transação.

## Decisão

- **Tipos e tamanho no domínio** (`ImageFile`): só PNG, JPEG e WebP, de 1 byte
  a 5 MB. **SVG fica de fora**: é texto e pode carregar script (XSS).
- **Chave `cards/<cardId>/<imageId>.<ext>`**, com um `imageId` novo a cada
  upload (`CardImage`). Trocar a imagem nunca sobrescreve o arquivo antigo, o
  que evita cache velho e deixa a troca segura.
- **Defesa contra IDOR:** o card só aceita uma chave gerada para ele
  (`CardImage.belongsTo` confere o prefixo e o formato exato do nome). Uma
  chave de outro card é recusada com `400` antes de qualquer consulta ao
  storage.
- **Conferir tudo antes de mudar o card:** chave, existência e regras do
  arquivo; só depois `card.attachImage`. Um erro no meio não deixa o card
  meio alterado.
- **Ordem sem transação:** quem é apontado nasce primeiro e morre por último.
  O arquivo é enviado antes de o card apontar para ele; ao trocar, remover ou
  apagar card ou deck, o banco é salvo antes e o arquivo é apagado depois.
- **Confirmar duas vezes a mesma chave não muda nada** (idempotente): o
  cliente pode repetir com segurança se a resposta se perder.
- Um arquivo que chegou fora das regras é apagado na confirmação.
- No banco, a coluna `cards.image_key` (texto, aceita nulo) guarda só a chave.

## Consequências

- No pior caso, uma falha entre as duas operações deixa um **arquivo órfão**
  no bucket, nunca um card apontando para um arquivo que não existe. Uma
  regra de ciclo de vida do bucket para limpar órfãos fica para depois.
- As regras valem para qualquer porta de entrada (HTTP hoje, MCP depois),
  porque moram no domínio e nos casos de uso, não nas rotas.
