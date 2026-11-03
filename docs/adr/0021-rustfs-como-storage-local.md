# ADR 0021: RustFS como storage local, no lugar do MinIO

- Status: aceito (substitui, no ADR 0001, o MinIO como storage local)
- Data: 2026-11-03

## Contexto

O ADR 0001 previa o MinIO no Docker Compose para desenvolvimento. Ao montar o
storage, a imagem `minio/minio` já não podia ser baixada: o repositório saiu
do Docker Hub e o `quay.io` exige login, porque a MinIO deixou de distribuir
imagens da versão gratuita. Uma cópia em cache numa máquina não serve para o
CI nem para outra pessoa.

## Decisão

- **RustFS 1.0.4** (Apache 2.0, feito para substituir o MinIO), com a versão
  fixada, no Compose e nos testes.
- Antes de escolher, RustFS e SeaweedFS foram testados com o mesmo roteiro:
  upload certo (`200`), arquivo maior e tipo diferente do declarado (`403`),
  leitura de tipo e tamanho, download assinado, acesso anônimo recusado e
  exclusão. Os dois passaram; o RustFS ganhou pela configuração mais simples
  (um contêiner, duas variáveis, painel web).
- **Compose:** serviço `rustfs` (API S3 na porta 9000, painel na 9001) e um
  trabalho de uma vez só, `rustfs-init` (`amazon/aws-cli`), que cria o bucket
  `cardumy` se ele ainda não existir.
- **Testes:** um `globalSetup` sobe um RustFS pelo Testcontainers e cria o
  bucket. O contrato de `FileStorage` roda contra a memória e contra ele. O
  projeto `postgres` do Vitest (ADR 0013) passa a se chamar `containers`,
  com os dois `globalSetup`.
- Em produção nada muda: o mesmo adapter fala com o R2 pela configuração.

## Consequências

- Qualquer pessoa (e o CI) baixa a imagem sem conta.
- O RustFS é mais novo que o MinIO; se ele parar, a troca é só de imagem,
  porque o código fala a API S3 e o contrato de testes mostra se o substituto
  se comporta igual.
- O RustFS ignora o checksum automático do SDK, então esse detalhe do R2 não
  é coberto pelos testes locais (ADR 0019).
