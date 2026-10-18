# Escala Residência R2 Retina

App de página única (`index.html`) com a escala do programa: calendário de plantões,
Aulas e Casos, Ciclos A–H, Trocas e Changelog. Sem build, sem dependências — é só abrir
o arquivo no navegador.

## O modelo (leia antes de mexer)

A escala **não é armazenada**: `acBuildSchedule()` recalcula tudo a cada carregamento.
São **duas trilhas independentes**, e confundi-las é o erro mais fácil de cometer:

| trilha | o que é | quando anda |
|---|---|---|
| **aulas** | 36 temas de `TOP2`, em ordem fixa, cada um com seu apresentador | a cada aula dada |
| **casos** | ciclo `Fellow/Fellow/R3/R2` (antes do CBO) ou `Fellow/Fellow/R2/R1` (a partir de 15/09/2026) | a cada caso apresentado |

Três listas registram o que não aconteceu. **Elas são a única coisa que você edita para
remanejar a escala** — nunca mexa nas atribuições à mão:

| constante | significa | efeito |
|---|---|---|
| `CANCELLED` | não houve reunião | as duas trilhas param |
| `AULA_ADIADA` | houve reunião, a aula não foi dada | só a trilha de aulas para |
| `CASO_ADIADO` | houve reunião e aula, o caso não foi apresentado | só o ciclo de casos para |

`NIVEL_EXCECOES` guarda quem apresenta quando foge da regra (a regra: antes do CBO, o
nível do tema; a partir de 15/09, um degrau abaixo — daí os badges `R3→R2` e `R2→R1`).

## Regras que não se quebram

1. **Evento move data, nunca pessoa.** As atribuições são congeladas; remanejar só
   escorrega datas. Quem preparou um tema continua com ele.
2. **Exceções são chaveadas pelo nome do tema, nunca pela data.** As datas já andaram
   cinco vezes; uma exceção presa a uma data vai parar na reunião errada.
3. **Conflito de férias se mostra, não se resolve sozinho.** Quando o deslocamento põe
   alguém de férias para apresentar, aparece ⚠️ e a decisão é do grupo. Reatribuir
   obrigaria alguém a preparar outro tema em cima da hora.
4. **Nada é escrito à mão duas vezes.** Changelog, badges, cabeçalho e avisos são todos
   derivados de `acBuildSchedule()`. Se você está digitando um fato que o código já sabe,
   está no caminho errado.

## Antes e depois de qualquer alteração

```bash
node escala_schedule_invariants.cjs
```

Sem dependências, roda em qualquer lugar. Ele trava o essencial: tema → apresentador
idêntico ao baseline, ciclo de casos avançando um passo por caso, uma trilha não
mexendo na outra, ninguém perdendo apresentação em silêncio e a lista exaustiva de
conflitos de férias conhecidos. Se ele falhar, leia a mensagem antes de mudar o teste —
quase sempre o errado é a alteração.

Os dois smoke tests (`escala_*_smoke.cjs`) precisam de Playwright e procuram um arquivo
com nome antigo; estão quebrados desde abril/2026 e não valem como garantia.

## Como registrar um evento

1. Acrescente a data na lista certa (`CANCELLED`, `AULA_ADIADA` ou `CASO_ADIADO`).
2. Rode os invariantes. Se um conflito de férias novo aparecer, **pare e pergunte** —
   não resolva sozinho.
3. Atualize no teste, se for o caso: `EXPECTED_LAST_AULA` e `ACCEPTED_VACATION_COLLISIONS`.
4. Branch + PR, descrevendo o antes/depois em datas. Não faça merge sem o ok do Felipe.

O Changelog se escreve sozinho a partir dessas listas — não edite texto de changelog.

## Convenções

- Commits: `tipo: descrição` (feat, fix, refactor, docs, test, chore). Sem linhas de atribuição.
- A escala é operacional e usada no celular: não quebre o layout mobile.
- Tudo em português, inclusive comentários de código.
