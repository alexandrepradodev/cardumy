# ADR 0002: ferramentas da fundação

- Status: aceito
- Data: 2026-10-21

## Contexto

A etapa 0 precisava escolher a versão do Node, a do TypeScript, o linter e o
executor de testes. O `CLAUDE.md` citava Node 22, já em manutenção, e a versão
mais nova do TypeScript (7.0, reescrita em Go) acabava de sair.

## Decisão

1. **Node 24 LTS**, fixado em `.nvmrc` e em `engines` (`>=24`). É a LTS ativa
   e a versão que empresas usam em produção.
2. **TypeScript 6.0** (`~6.0.3`) em vez do 7.0. O typescript-eslint aceita só
   TypeScript abaixo de 6.1, porque o TS 7 ainda não tem a API JavaScript que
   as regras que usam tipos precisam. A linguagem e as checagens são as mesmas.
3. **ESLint + typescript-eslint + Prettier** em vez de Biome. É o conjunto mais
   comum no mercado, e as regras que usam tipos (como `no-floating-promises`)
   não têm equivalente completo no Biome.
4. **Vitest** em vez de Jest. Entende TypeScript e ESM sem configuração extra e
   mantém a API do Jest.

## Consequências

- O build fica um pouco mais lento do que seria com o TS 7. Quando o
  typescript-eslint suportar o TS 7, a troca é uma linha no `package.json`.
- Duas ferramentas (ESLint e Prettier) em vez de uma; o
  `eslint-config-prettier` evita que elas briguem.
