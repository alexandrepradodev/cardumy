# ADR 0003: configuração validada na inicialização

- Status: aceito
- Data: 2026-10-21

## Contexto

A porta, o host e o nível de log mudam entre ambientes (local, CI, Railway,
AWS). Ler `process.env` espalhado pelo código deixa erros de configuração
aparecerem tarde e longe da causa.

## Decisão

Toda a configuração passa por `loadConfig()` em `src/infra/config.ts`:

- um schema TypeBox descreve cada variável, com tipo, limites e valor padrão;
- texto vira o tipo certo (`"8080"` → `8080`) e variáveis vazias contam como
  não definidas;
- se algo estiver inválido, a função lança `ConfigError` listando **todos** os
  problemas, e a API encerra com código 1 antes de abrir a porta (*fail fast*);
- a função recebe o ambiente como parâmetro, então os testes não mexem em
  `process.env`.

O `.env` local é carregado pelo próprio Node (`--env-file-if-exists`), sem
dependência extra. O `.env` fica fora do git; o `.env.example` documenta as
variáveis.

## Consequências

- Só `infra/` lê o ambiente; o resto do código recebe um objeto `Config` tipado.
- Cada variável nova precisa entrar no schema, ou será ignorada.
- TypeBox é a mesma biblioteca dos schemas HTTP (etapa 2): um só jeito de
  validar no projeto.
