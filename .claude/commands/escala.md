---
description: Registrar o que aconteceu (ou não) numa reunião e remanejar a escala
---

O Felipe vai descrever uma reunião. Descubra qual dos casos é:

- **não houve reunião** → acrescente a data em `CANCELLED`
- **houve reunião, faltou a aula** → `AULA_ADIADA`
- **houve reunião e aula, faltou o caso** → `CASO_ADIADO`
- **alguém apresentou fora do nível previsto** → `NIVEL_EXCECOES`, chaveado pelo **nome do tema**
- **troca entre duas pessoas** → card novo na aba Trocas

Se a descrição não distinguir esses casos, **pergunte antes de editar**. "A reunião não
rolou" e "a aula não rolou" levam a escalas diferentes.

Depois de editar:

1. `node escala_schedule_invariants.cjs`
2. Mostre o antes/depois em datas: quem apresenta o quê mudou de dia, e qual é a última aula do ano.
3. Se surgir conflito de férias novo, **pare e pergunte** — nunca reatribua por conta própria.
4. Abra PR com o resumo. Não faça merge sem autorização explícita.

Leia o `CLAUDE.md` da raiz antes de mexer: ele explica as duas trilhas e as regras que não se quebram.
