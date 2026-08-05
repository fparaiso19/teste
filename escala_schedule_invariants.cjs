/**
 * Invariantes da escala de Aulas/Casos R2.
 *
 * Sem dependências: roda com `node escala_schedule_invariants.cjs` (opcionalmente
 * passando um caminho para o HTML). Não abre navegador — o motor de escala
 * (acBuildSchedule) é uma função pura, então extraímos aquele trecho do index.html e
 * avaliamos isolado em um contexto vm.
 *
 * Confiança: a fonte avaliada é o index.html deste próprio repositório, ao lado deste
 * arquivo — mesmo nível de confiança de um require() local. Não avaliar HTML de outra
 * origem com este script.
 *
 * Por que existe: reuniões canceladas remanejam a escala deslocando datas sem recalcular
 * as atribuições. É fácil quebrar isso sem perceber. O baseline abaixo trava QUEM
 * apresenta O QUÊ — invariante que deve valer independentemente de quantos cancelamentos
 * existam. As datas, que mudam a cada cancelamento, são verificadas por propriedade
 * (terças válidas, crescentes, nenhuma numa data cancelada) e não por valor fixo.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// [tema, aula(R2), caso(R2), artigo, tipoDeCaso, anoDoTema] — na ordem original de TOP2.
// Deve permanecer idêntico a qualquer momento: cancelamentos movem datas, nunca pessoas.
const BASELINE = [
  ["Exames I: Angiofluoresceinografia",null,null,"Felipe","Fellow",3],
  ["Exames II: OCT",null,null,"Arthur","Fellow",3],
  ["Exames III: OCTa",null,null,"Thauanna","R3",3],
  ["ERG campo total e multifocal",null,"Arthur",null,"R2",3],
  ["Ret. diabética: classif. e fatores de risco","Marina",null,null,"Fellow",2],
  ["Ret. diabética: tratamentos clínicos",null,null,null,"Fellow",3],
  ["Ret. diabética: tratamentos cirúrgicos",null,null,null,"R3",3],
  ["Retinopatia Hipertensiva","Leonardo","João",null,"R2",2],
  ["DMRI classificação e fisiopatologia","Victoria",null,null,"Fellow",2],
  ["DMRI tratamento",null,null,null,"Fellow",3],
  ["Diagn Dif. de DMRI (RAP e kearns sayre)",null,null,null,"R3",3],
  ["Teleangiectasias parafoveais (Mactel)",null,"Leonardo",null,"R2",3],
  ["OVCR I – diagnóstico e fatores prognósticos","Felipe",null,null,"Fellow",2],
  ["OVCR II – tratamentos",null,null,null,"Fellow",3],
  ["ORVR I – diagnóstico e fatores prognósticos","Fernanda",null,null,"R3",2],
  ["ORVR – tratamentos",null,"Victoria",null,"R2",3],
  ["OACR – diagnóstico e tratamento","Thauanna",null,null,"Fellow",2],
  ["Farmacologia: corticoide e antiangiogênicos",null,null,null,"Fellow",3],
  ["Membrana epirretiniana",null,"Felipe",null,"R2",2],
  ["Tração vitreomacular",null,null,null,"R1",2],
  ["Trauma I – tipos e fatores prognósticos",null,null,null,"Fellow",2],
  ["Trauma II – manejo e tratamento","Marina",null,null,"Fellow",3],
  ["Maculopatias tóxicas",null,"Fernanda",null,"R2",2],
  ["Buraco Macular","Leonardo",null,null,"R1",3],
  ["Endoftalmites",null,null,null,"Fellow",2],
  ["Distrofias maculares","Victoria",null,null,"Fellow",3],
  ["Coroidopatia poliploidal","Felipe","Thauanna",null,"R2",3],
  ["DR: Classificação e avaliação",null,null,null,"R1",2],
  ["DR: tratamento","Thauanna",null,null,"Fellow",3],
  ["Síndrome de Irvine-Gass",null,null,null,"Fellow",2],
  ["Retinose Pigmentar",null,"Arthur",null,"R2",2],
  ["Coriorretinopatia Serosa Central",null,null,null,"R1",2],
  ["Retinopatia da prematuridade","Fernanda",null,null,"Fellow",3],
  ["Retinites virais (CMV e Herpes)","Arthur",null,null,"Fellow",3],
  ["Laserterapia. Tipos e indicações","Marina","João",null,"R2",3],
  ["Como realizar clinical trials","João",null,null,"R1",3]];

// Datas de reuniões extras acrescentadas ao fim por causa dos cancelamentos.
// Atualize conscientemente ao registrar um novo cancelamento.
const EXPECTED_LAST_MEETING = '2027-03-16';

// Colisões conhecidas e aceitas: o deslocamento jogou o apresentador para dentro das
// próprias férias e optou-se por não reatribuir. A lista é exaustiva de propósito —
// se surgir uma nova, o teste falha e a decisão volta para a mesa.
const ACCEPTED_VACATION_COLLISIONS = [
  '2026-08-25 caso=Victoria',
  '2026-10-27 aula=Marina'
];

function loadEngine(htmlPath) {
  const lines = fs.readFileSync(htmlPath, 'utf8').split('\n');
  const a = lines.findIndex(l => l.includes('const RES2=['));
  const b = lines.findIndex(l => l.includes('function acCBadge'));
  if (a < 0 || b < 0 || b <= a) {
    throw new Error(`Não encontrei o motor de escala em ${htmlPath} (marcadores const RES2=[ / function acCBadge)`);
  }
  const src = lines.slice(a, b).join('\n') +
    '\n;__out = {acBuildSchedule, RES2, VAC2, TOP2, ds2, onV2, CANCELLED};';
  const ctx = { __out: null };
  vm.runInNewContext(src, ctx, { filename: 'escala-engine', timeout: 5000 });
  return ctx.__out;
}

const failures = [];
function check(cond, msg, detail) {
  console.log(`  ${cond ? '\x1b[32mOK  \x1b[0m' : '\x1b[31mFAIL\x1b[0m'} ${msg}`);
  if (!cond) { failures.push(msg); if (detail) console.log(detail.split('\n').map(l => '       ' + l).join('\n')); }
}

function main() {
  const htmlPath = process.argv[2] || path.join(__dirname, 'index.html');
  const E = loadEngine(htmlPath);
  const ds = E.ds2;
  const { entries } = E.acBuildSchedule();
  const meetings = entries.filter(e => !e.skip);

  console.log(`\nEscala — invariantes (${path.basename(htmlPath)})`);
  console.log(`CANCELLED = ${JSON.stringify(E.CANCELLED)}\n`);

  // --- conteúdo ---
  const topics = meetings.map(e => e.topic);
  check(meetings.length === 36, `36 reuniões (obtido ${meetings.length})`);
  check(new Set(topics).size === topics.length, 'nenhum tema repetido');
  check(JSON.stringify(topics) === JSON.stringify(E.TOP2.map(t => t[0])), 'temas na ordem original de TOP2');

  const actual = meetings.map(e => [e.topic, e.aulaR2, e.caseR2, e.article, e.caseType, e.topicR]);
  const same = JSON.stringify(actual) === JSON.stringify(BASELINE);
  let diff = '';
  if (!same) {
    BASELINE.forEach((b, i) => {
      const a = actual[i];
      if (JSON.stringify(a) !== JSON.stringify(b)) diff += `linha ${i}: esperado ${JSON.stringify(b)}\n         obtido   ${JSON.stringify(a)}\n`;
    });
  }
  check(same, 'atribuições idênticas ao baseline (cancelamento move data, não pessoa)', diff);

  // --- datas (mudam a cada cancelamento: verificadas por propriedade) ---
  const dates = meetings.map(e => ds(e.date));
  check(dates.every(d => new Date(d + 'T12:00:00').getDay() === 2), 'toda reunião cai numa terça');
  check(dates.every((d, i) => i === 0 || d > dates[i - 1]), 'datas estritamente crescentes');
  check(dates.every(d => E.CANCELLED.indexOf(d) < 0), 'nenhuma reunião marcada numa data cancelada');
  E.CANCELLED.forEach(d => {
    const e = entries.find(x => ds(x.date) === d);
    check(!!e && e.skip && /remanejada/.test(e.reason), `${d} aparece como "Reunião remanejada"`);
  });
  check(dates[dates.length - 1] === EXPECTED_LAST_MEETING,
        `última reunião em ${EXPECTED_LAST_MEETING} (obtido ${dates[dates.length - 1]})`);

  // --- conflitos ---
  let dup = [];
  meetings.forEach(e => {
    const p = [e.aulaR2, e.caseR2, e.article].filter(Boolean);
    if (new Set(p).size !== p.length) dup.push(`${ds(e.date)}: ${p.join(', ')}`);
  });
  check(dup.length === 0, 'ninguém com dois papéis na mesma data', dup.join('\n'));

  const collisions = [];
  meetings.forEach(e => {
    [['aula', e.aulaR2], ['caso', e.caseR2], ['artigo', e.article]].forEach(([k, p]) => {
      if (p && E.onV2(p, e.date)) collisions.push(`${ds(e.date)} ${k}=${p}`);
    });
  });
  collisions.forEach(c => {
    const [d, r] = [c.split(' ')[0], c.split(' ')[1].split('=')[1]];
    console.log(`       férias: ${c} (${E.VAC2[r][0]} a ${E.VAC2[r][1]})`);
  });
  check(JSON.stringify(collisions) === JSON.stringify(ACCEPTED_VACATION_COLLISIONS),
        `colisões com férias são exatamente as ${ACCEPTED_VACATION_COLLISIONS.length} conhecidas`,
        `esperado ${JSON.stringify(ACCEPTED_VACATION_COLLISIONS)}\nobtido   ${JSON.stringify(collisions)}`);

  // --- replay (o Changelog depende disso) ---
  const pristine = E.acBuildSchedule([]).entries.filter(e => !e.skip);
  check(pristine.length === 36, 'replay acBuildSchedule([]) devolve 36 reuniões');
  check(ds(pristine[pristine.length - 1].date) === '2027-03-02', 'replay sem cancelamentos termina em 2027-03-02');
  const sig = m => JSON.stringify(m.map(e => [e.topic, e.aulaR2, e.caseR2, e.article]));
  check(sig(pristine) === sig(meetings), 'replay preserva as atribuições (só as datas diferem)');
  E.CANCELLED.forEach((_, i) => {
    const before = E.acBuildSchedule(E.CANCELLED.slice(0, i)).entries.filter(e => !e.skip);
    const after = E.acBuildSchedule(E.CANCELLED.slice(0, i + 1)).entries.filter(e => !e.skip);
    const moved = before.filter((b, j) => ds(b.date) !== ds(after[j].date)).length;
    check(moved > 0, `cancelamento ${i + 1} (${E.CANCELLED[i]}) desloca ${moved} reuniões`);
  });

  console.log(failures.length
    ? `\n\x1b[31m${failures.length} falha(s)\x1b[0m\n`
    : '\n\x1b[32mtodos os invariantes passaram\x1b[0m\n');
  process.exit(failures.length ? 1 : 0);
}

main();
