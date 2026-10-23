# ADR 0006: revisão espaçada com FSRS simplificado

- Status: aceito
- Data: 2026-10-23

## Contexto

O agendamento das revisões é o núcleo do produto. O SM-2 (algoritmo antigo do
Anki) usa um fator de facilidade fixo. O FSRS modela a memória com
estabilidade e dificuldade, mas o original treina 19 ou mais parâmetros com o
histórico de revisões de cada aluno.

## Decisão

Implementar um FSRS simplificado em `ReviewSchedule`:

- mesma curva do esquecimento do FSRS: `R = (1 + 19/81 · t/S)^-0.5`, que vale
  90% quando o tempo decorrido é igual à estabilidade;
- próxima revisão em `S` dias (retenção alvo de 90%), arredondada e com mínimo
  de 1 dia; "again" volta em 10 minutos;
- estabilidade e dificuldade iniciais por nota, e crescimento da estabilidade
  maior para notas melhores, cards mais fáceis e lembranças quase esquecidas;
- constantes fixas, escolhidas à mão e documentadas no código.

`ReviewSchedule` é um objeto de valor imutável: cada revisão devolve um novo.

## Consequências

- Captura as ideias principais do FSRS com código curto e fácil de testar.
- Os intervalos não se adaptam a cada aluno. Uma evolução futura pode guardar o
  histórico de revisões e otimizar os parâmetros, sem mudar a interface de
  `Card.review()`.
