# ADR 0008: identificação provisória pelo cabeçalho `x-user-id`

- Status: aceito (temporário, substituído na etapa 3)
- Data: 2026-10-26

## Contexto

Os casos de uso precisam saber quem é o usuário para conferir o dono de decks e
cards. O login com JWT só chega na etapa 3, mas a API HTTP vem antes.

## Decisão

O cliente informa o usuário no cabeçalho `x-user-id`. Um hook `onRequest`
(`authenticate`) lê o cabeçalho, confere o formato (`[A-Za-z0-9_-]{1,64}`) e o
guarda em `request.userId`; sem ele, a resposta é 401. O hook é aplicado só
nos plugins das rotas de estudo: `/health` e `/docs` continuam públicos. Na
documentação, o cabeçalho aparece como esquema de segurança `apiKey`.

## Consequências

- **Não é seguro:** qualquer cliente pode dizer que é qualquer usuário. Serve
  apenas para desenvolvimento e estudo.
- A identificação mora só no balcão. Na etapa 3, `authenticate` passa a validar
  um JWT e nenhum caso de uso muda.
- Permite testar desde já que um usuário não acessa os dados de outro.
