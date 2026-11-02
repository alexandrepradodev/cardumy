# ADR 0015: senhas com Argon2id

- Status: aceito
- Data: 2026-11-02

## Contexto

O cadastro guarda a senha do usuário. Se o banco vazar, a senha não pode ser
recuperada, e cada tentativa de adivinhá-la tem que custar caro. O login
também não pode revelar quais e-mails têm conta.

## Decisão

- **Hash com Argon2id** pela biblioteca `@node-rs/argon2` (binário nativo
  pronto, sem compilar na instalação), com os parâmetros mínimos da OWASP:
  19 MiB de memória, 2 iterações e paralelismo 1. O salt é aleatório e fica
  dentro da string PHC guardada em `password_hash`.
- O hash fica atrás da porta `PasswordHasher` (`hash`/`verify`), ligada no
  `container`. Os testes unitários usam o adaptador real, que é rápido o
  bastante com esses parâmetros.
- A senha é validada no domínio (`Password`: de 8 a 128 caracteres) e nunca
  sai do caso de uso: não é logada, não é devolvida e não vai no token.
- **Login sem enumeração:** e-mail desconhecido e senha errada devolvem o mesmo
  `InvalidCredentialsError` (401), com a mesma mensagem. Quando o e-mail não
  existe, o caso de uso calcula um hash mesmo assim, para que as duas respostas
  levem o mesmo tempo (defesa contra ataque de tempo).

## Consequências

- Um vazamento do banco não entrega senhas; quebrar cada uma custa memória e
  tempo.
- Cada login gasta dezenas de milissegundos de CPU de propósito. Quando houver
  muito tráfego, o rate limiting da etapa 8 protege a rota de login.
- Subir os parâmetros no futuro é seguro: a string PHC guarda os parâmetros
  usados, então senhas antigas continuam conferindo.
