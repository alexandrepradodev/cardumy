# ADR 0017: access token JWT com HS256

- Status: aceito
- Data: 2026-11-02

## Contexto

Depois do login, o cliente precisa provar quem é em cada requisição, sem
mandar a senha de novo. A API tem um único emissor e um único verificador de
tokens (ela mesma), e o objetivo da etapa é uma autenticação simples.

## Decisão

- **JWT assinado com HS256** (HMAC com SHA-256) pelo `@fastify/jwt`. O
  algoritmo é fixado também na verificação (`algorithms: ['HS256']`), para que
  um token com outro algoritmo seja recusado.
- **Só access token**, válido por 1 hora (`ACCESS_TOKEN_TTL_SECONDS`). O
  payload leva apenas `sub` (o id do usuário), além de `iat` e `exp`; nenhum
  dado sensível, porque o conteúdo do JWT é legível por qualquer um.
- A resposta do login segue o formato do OAuth 2:
  `{ accessToken, tokenType: 'Bearer', expiresIn }`.
- **`JWT_SECRET`** vem da configuração validada (ADR 0003), com no mínimo 32
  caracteres. Em desenvolvimento há um valor local padrão; em produção a API
  não sobe sem ele.

## Alternativas descartadas

- **RS256 (chave pública e privada):** útil quando outros serviços verificam o
  token sem poder emiti-lo. Aqui só a API verifica, então um segredo basta.
- **Refresh token:** daria sessões longas sem login frequente, mas exige
  guardar e revogar tokens. Fica para quando houver um frontend.
- **Sessão no servidor (cookie + Redis):** permite revogar na hora, mas guarda
  estado a cada requisição. O JWT dispensa consulta ao banco para autenticar.

## Consequências

- Não dá para revogar um token antes de vencer; a validade curta limita o
  estrago de um token vazado.
- Quem tiver o `JWT_SECRET` consegue emitir tokens de qualquer usuário: trocar
  o segredo invalida todos os tokens de uma vez.
- Depois de 1 hora o usuário precisa fazer login de novo.
