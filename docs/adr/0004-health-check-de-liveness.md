# ADR 0004: `/health` como checagem de liveness

- Status: aceito
- Data: 2026-10-21

## Contexto

Plataformas como Railway, ECS e Kubernetes chamam uma rota de saúde para
decidir se reiniciam o processo. Existem dois tipos de checagem: *liveness*
("o processo está vivo?") e *readiness* ("ele consegue atender agora, com as
dependências no ar?").

## Decisão

`GET /health` é uma checagem de **liveness**: responde `{"status":"ok"}` sem
consultar Postgres ou Redis. A API também faz desligamento gracioso em SIGTERM
e SIGINT (`app.close()`), terminando as requisições em andamento antes de sair.

## Consequências

- Um banco lento não faz a plataforma reiniciar uma API saudável, o que só
  pioraria a situação.
- Uma checagem de readiness que olhe as dependências fica para a etapa 3,
  quando a API passar a usar o banco.
