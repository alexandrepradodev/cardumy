# ADR 0018: autenticação Bearer na borda

- Status: aceito (substitui o ADR 0008)
- Data: 2026-11-02

## Contexto

As rotas de estudo identificavam o usuário pelo cabeçalho `x-user-id` (ADR
0008), em que qualquer cliente podia dizer que era qualquer usuário. Com o
login emitindo JWT (ADR 0017), as rotas passam a exigir o token.

## Decisão

- O cliente manda `Authorization: Bearer <token>`. O hook `authenticate`
  continua na borda HTTP: confere a assinatura e a validade do token e guarda o
  `sub` em `request.userId`, como antes. **Nenhum caso de uso muda**: eles
  recebem o id do usuário pronto e não sabem como ele foi descoberto.
- Os erros do `@fastify/jwt` são traduzidos para três erros nossos, todos 401,
  para o cliente saber o que fazer:
  - `MissingTokenError`: o token não veio;
  - `ExpiredTokenError`: o token venceu, faça login de novo;
  - `InvalidTokenError`: assinatura, formato ou algoritmo inválidos.
- Rotas públicas: `/health`, `/docs`, `POST /auth/register` e
  `POST /auth/login` (com `security: []` na documentação). As rotas de decks e
  cards são protegidas.
- Na documentação, o esquema de segurança `bearerAuth` (`http`, `bearer`,
  `JWT`) substitui o `apiKey`, e o Swagger UI ganha o botão **Authorize**.
- `owner_id` em `decks` guarda o id do usuário de `accounts` **sem chave
  estrangeira**, de propósito: um módulo não lê as tabelas de outro (regra 5).
- Nos testes, `tokenFor()` monta o JWT à mão com `node:crypto`, e há casos para
  token ausente, vencido, com outro segredo, malformado e adulterado.

## Consequências

- A troca do `x-user-id` pelo JWT tocou só a borda, como o ADR 0008 previa.
- Autenticação (quem é você?) fica na borda; autorização (esse deck é seu?)
  continua no caso de uso.
- Decks criados com o `x-user-id` antigo ficam sem dono acessível.
- Sem chave estrangeira, um deck pode apontar para um usuário apagado. Quando
  existir exclusão de conta, `accounts` publica um evento e `study` limpa os
  dados do usuário.
