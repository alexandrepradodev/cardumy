# ADR 0016: e-mail único garantido pelo índice do banco

- Status: aceito
- Data: 2026-11-02

## Contexto

Dois cadastros com o mesmo e-mail podem chegar ao mesmo tempo. Os dois
perguntam "esse e-mail já existe?", os dois ouvem "não" e os dois salvam
(condição de corrida). A checagem no caso de uso sozinha não impede isso.

## Decisão

- **Defesa em profundidade:** o `RegisterUser` confere o e-mail antes de salvar
  (dá a resposta rápida e clara no caso comum), e um **índice único**
  `users_email_unique` no Postgres é a garantia final.
- O adaptador traduz a violação do índice (código `23505` do Postgres) para o
  erro do domínio `EmailAlreadyInUseError` (409). Como o Drizzle embrulha o
  erro do driver num `DrizzleQueryError`, o utilitário `isUniqueViolation`
  procura o código em `error.cause` e confere o nome do índice.
- O repositório em memória rejeita o mesmo caso, e a suíte de contrato cobre os
  dois adaptadores.

## Consequências

- Mesmo numa corrida, só um cadastro vence; o outro recebe o mesmo 409 do caso
  comum, sem vazar erro de banco.
- Foi verificado por mutação: com a checagem do caso de uso desligada, o teste
  de corrida continua passando só com o índice.
- O e-mail é guardado normalizado (minúsculas, sem espaços), então o índice
  também barra variações como `Ana@x.com` e `ana@x.com`.
