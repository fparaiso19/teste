/**
 * Invariantes da escala de Aulas/Casos R2.
 *
 * Sem dependências: `node escala_schedule_invariants.cjs` (opcionalmente com um caminho
 * para o HTML). Não abre navegador — acBuildSchedule é puro, então extraímos aquele
 * trecho do index.html e avaliamos isolado num contexto vm.
 *
 * Confiança: a fonte avaliada é o index.html deste próprio repositório, ao lado deste
 * arquivo — mesmo nível de confiança de um require() local.
 *
 * DUAS TRILHAS INDEPENDENTES. Desde que passou a existir "aula adiada" (a reunião
 * acontece, mas a aula não é dada), tema e caso deixaram de andar juntos:
 *
 *   trilha de AULAS  — 36 temas em ordem fixa, cada um com seu apresentador. Só anda
 *                      quando uma aula é dada. É o BASELINE abaixo: tema -> quem
 *                      apresenta. Nenhum evento de calendário pode mexer nisso.
 *   trilha de CASOS  — ciclo Fellow/Fellow/R3/R2 (pré-CBO) ou Fellow/Fellow/R2/R1
 *                      (pós-CBO), um passo por caso APRESENTADO. Não tem baseline:
 *                      é verificada recalculando o ciclo sobre as reuniões com caso.
 *
 * AULA_ADIADA pausa só a primeira trilha; CASO_ADIADO, só a segunda; CANCELLED, as duas.
 *
 * Os testes que mais importam: adiar uma trilha nunca pode mover a outra, e adiar um
 * caso nunca pode fazer um R2 perder a apresentação dele.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// [tema, aula(R2), anoDoTema] na ordem original de TOP2. Deve permanecer idêntico:
// eventos de calendário movem datas, nunca quem apresenta.
const BASELINE = [
  ["Exames I: Angiofluoresceinografia",null,3],
  ["Exames II: OCT",null,3],
  ["Exames III: OCTa",null,3],
  ["ERG campo total e multifocal",null,3],
  ["Ret. diabética: classif. e fatores de risco","Marina",2],
  ["Ret. diabética: tratamentos clínicos",null,3],
  ["Ret. diabética: tratamentos cirúrgicos",null,3],
  ["Retinopatia Hipertensiva","Leonardo",2],
  ["DMRI classificação e fisiopatologia","Victoria",2],
  ["DMRI tratamento",null,3],
  ["Diagn Dif. de DMRI (RAP e kearns sayre)",null,3],
  ["Teleangiectasias parafoveais (Mactel)",null,3],
  ["OVCR I – diagnóstico e fatores prognósticos","Felipe",2],
  ["OVCR II – tratamentos",null,3],
  ["ORVR I – diagnóstico e fatores prognósticos","Fernanda",2],
  ["ORVR – tratamentos",null,3],
  ["OACR – diagnóstico e tratamento","Thauanna",2],
  ["Farmacologia: corticoide e antiangiogênicos",null,3],
  ["Membrana epirretiniana",null,2],
  ["Tração vitreomacular",null,2],
  ["Trauma I – tipos e fatores prognósticos",null,2],
  ["Trauma II – manejo e tratamento","Marina",3],
  ["Maculopatias tóxicas",null,2],
  ["Buraco Macular","Leonardo",3],
  ["Endoftalmites",null,2],
  ["Distrofias maculares","Victoria",3],
  ["Coroidopatia poliploidal","Felipe",3],
  ["DR: Classificação e avaliação",null,2],
  ["DR: tratamento","Thauanna",3],
  ["Síndrome de Irvine-Gass",null,2],
  ["Retinose Pigmentar",null,2],
  ["Coriorretinopatia Serosa Central",null,2],
  ["Retinopatia da prematuridade","Fernanda",3],
  ["Retinites virais (CMV e Herpes)","Arthur",3],
  ["Laserterapia. Tipos e indicações","Marina",3],
  ["Como realizar clinical trials","João",3]];

const EXPECTED_LAST_AULA = '2027-03-23';

// Colisões conhecidas e aceitas: o deslocamento pôs o apresentador dentro das próprias
// férias e optou-se por não reatribuir. Lista exaustiva — colisão nova faz o teste falhar.
// 25/08 caso=Victoria: o slot era dela e caiu nas férias. Na prática houve troca pontual
// e quem apresentou foi um R3 — confirmado em 15/09, quando a vez era de um Fellow,
// exatamente como o ciclo do app prevê.
const ACCEPTED_VACATION_COLLISIONS = ['2026-08-25 caso=Victoria', '2026-11-10 aula=Marina'];

function loadEngine(htmlPath) {
  const lines = fs.readFileSync(htmlPath, 'utf8').split('\n');
  const a = lines.findIndex(l => l.includes('const RES2=['));
  const b = lines.findIndex(l => l.includes('function acCBadge'));
  if (a < 0 || b < 0 || b <= a) throw new Error(`motor não encontrado em ${htmlPath}`);
  const src = lines.slice(a, b).join('\n') +
    '\n;__out = {acBuildSchedule, RES2, VAC2, TOP2, ds2, onV2, CANCELLED, AULA_ADIADA, CASO_ADIADO, CP2, CQ2};';
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
  const meetings = entries.filter(e => !e.skip);   // toda reunião realizada
  const aulas = meetings.filter(e => e.topic);     // só as que têm aula

  console.log(`\nEscala — invariantes (${path.basename(htmlPath)})`);
  console.log(`CANCELLED   = ${JSON.stringify(E.CANCELLED)}`);
  console.log(`AULA_ADIADA = ${JSON.stringify(E.AULA_ADIADA)}`);
  console.log(`CASO_ADIADO = ${JSON.stringify(E.CASO_ADIADO)}\n`);

  // ---------- trilha de aulas ----------
  console.log('  \x1b[2m-- trilha de aulas --\x1b[0m');
  const topics = aulas.map(e => e.topic);
  check(aulas.length === 36, `36 aulas distribuídas (obtido ${aulas.length})`);
  check(new Set(topics).size === topics.length, 'nenhum tema repetido');
  check(JSON.stringify(topics) === JSON.stringify(E.TOP2.map(t => t[0])), 'temas na ordem original de TOP2');

  const actual = aulas.map(e => [e.topic, e.aulaR2, e.topicR]);
  const same = JSON.stringify(actual) === JSON.stringify(BASELINE);
  let diff = '';
  if (!same) BASELINE.forEach((b, i) => {
    if (JSON.stringify(actual[i]) !== JSON.stringify(b))
      diff += `linha ${i}: esperado ${JSON.stringify(b)}\n         obtido   ${JSON.stringify(actual[i])}\n`;
  });
  check(same, 'tema -> apresentador idêntico ao baseline (evento move data, não pessoa)', diff);

  const dates = aulas.map(e => ds(e.date));
  check(dates.every(d => new Date(d + 'T12:00:00').getDay() === 2), 'toda aula cai numa terça');
  check(dates.every((d, i) => i === 0 || d > dates[i - 1]), 'datas de aula estritamente crescentes');
  check(dates.every(d => E.CANCELLED.indexOf(d) < 0 && E.AULA_ADIADA.indexOf(d) < 0),
        'nenhuma aula marcada numa data cancelada ou adiada');
  check(dates[dates.length - 1] === EXPECTED_LAST_AULA,
        `última aula em ${EXPECTED_LAST_AULA} (obtido ${dates[dates.length - 1]})`);

  // ---------- trilha de casos ----------
  console.log('  \x1b[2m-- trilha de casos --\x1b[0m');
  check(meetings.length === 36 + E.AULA_ADIADA.length,
        `reuniões = 36 aulas + ${E.AULA_ADIADA.length} adiada(s) (obtido ${meetings.length})`);
  E.AULA_ADIADA.forEach(d => {
    const e = meetings.find(x => ds(x.date) === d);
    check(!!e && !e.topic && !!e.caseType,
          `${d}: reunião existe, sem aula, com caso (tipo ${e ? e.caseType : '—'})`);
  });
  E.CASO_ADIADO.forEach(d => {
    const e = meetings.find(x => ds(x.date) === d);
    check(!!e && !!e.topic && !e.caseType && !e.caseR2,
          `${d}: reunião existe, com aula (${e && e.topic ? e.topic.slice(0, 24) : '—'}), sem caso`);
  });
  const comCaso = meetings.filter(e => !e.casoAdiado);
  const ciclo = comCaso.map((e, i) => (ds(e.date) >= '2026-09-15' ? E.CQ2 : E.CP2)[i % 4]);
  const cicloOk = comCaso.every((e, i) => e.caseType === ciclo[i]);
  check(cicloOk, 'ciclo de casos avança exatamente um passo por caso apresentado',
        cicloOk ? '' : comCaso.map((e, i) => e.caseType !== ciclo[i] ? `${ds(e.date)}: ${e.caseType} != ${ciclo[i]}` : null).filter(Boolean).join('\n'));

  // adiar um caso: aulas intactas e nenhum R2 perde caso
  const semCasoAd = E.acBuildSchedule(E.CANCELLED, E.AULA_ADIADA, []).entries.filter(e => !e.skip);
  const aulaSig = m => JSON.stringify(m.filter(e => e.topic).map(e => [ds(e.date), e.topic, e.aulaR2]));
  check(aulaSig(semCasoAd) === aulaSig(meetings), 'adiar um caso NÃO mexe na trilha de aulas');
  const porPessoa = m => { const o = {}; m.forEach(e => { if (e.caseR2) o[e.caseR2] = (o[e.caseR2] || 0) + 1; });
    return JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]])); };
  check(porPessoa(semCasoAd) === porPessoa(meetings),
        'adiar um caso não faz nenhum R2 perder apresentação',
        `sem adiamento ${porPessoa(semCasoAd)}\ncom adiamento ${porPessoa(meetings)}`);

  // ESTE é o invariante central das duas trilhas
  const semAdiada = E.acBuildSchedule(E.CANCELLED, []).entries.filter(e => !e.skip);
  const mexeu = semAdiada.filter(e => {
    const m2 = meetings.find(x => ds(x.date) === ds(e.date));
    return m2 && m2.caseType !== e.caseType;
  }).map(e => ds(e.date));
  check(mexeu.length === 0, 'adiar uma aula NÃO mexe no ciclo de casos de nenhuma data', mexeu.join(', '));

  // ---------- conflitos ----------
  console.log('  \x1b[2m-- conflitos --\x1b[0m');
  const dup = [];
  meetings.forEach(e => {
    const p = [e.aulaR2, e.caseR2, e.article].filter(Boolean);
    if (new Set(p).size !== p.length) dup.push(`${ds(e.date)}: ${p.join(', ')}`);
  });
  check(dup.length === 0, 'ninguém com dois papéis na mesma data', dup.join('\n'));

  const collisions = [];
  meetings.forEach(e => {   // sobre TODAS as reuniões: o caso existe mesmo sem aula
    [['aula', e.aulaR2], ['caso', e.caseR2], ['artigo', e.article]].forEach(([k, p]) => {
      if (p && E.onV2(p, e.date)) collisions.push(`${ds(e.date)} ${k}=${p}`);
    });
  });
  collisions.forEach(c => {
    const r = c.split(' ')[1].split('=')[1];
    console.log(`       férias: ${c} (${E.VAC2[r][0]} a ${E.VAC2[r][1]})`);
  });
  check(JSON.stringify(collisions) === JSON.stringify(ACCEPTED_VACATION_COLLISIONS),
        `colisões com férias são exatamente as ${ACCEPTED_VACATION_COLLISIONS.length} conhecida(s)`,
        `esperado ${JSON.stringify(ACCEPTED_VACATION_COLLISIONS)}\nobtido   ${JSON.stringify(collisions)}`);

  // ---------- replay (o Changelog depende disso) ----------
  console.log('  \x1b[2m-- replay --\x1b[0m');
  const pristine = E.acBuildSchedule([], []).entries.filter(e => !e.skip && e.topic);
  check(pristine.length === 36, 'replay acBuildSchedule([],[]) devolve 36 aulas');
  check(ds(pristine[pristine.length - 1].date) === '2027-03-02', 'replay sem eventos termina em 2027-03-02');
  const sigAula = m => JSON.stringify(m.map(e => [e.topic, e.aulaR2]));
  check(sigAula(pristine) === sigAula(aulas), 'replay preserva tema -> apresentador (só as datas diferem)');
  E.CANCELLED.forEach((_, i) => {
    const A = E.acBuildSchedule(E.CANCELLED.slice(0, i), []).entries.filter(e => !e.skip && e.topic);
    const B = E.acBuildSchedule(E.CANCELLED.slice(0, i + 1), []).entries.filter(e => !e.skip && e.topic);
    const moved = A.filter((x, j) => B[j] && ds(x.date) !== ds(B[j].date)).length;
    check(moved > 0, `cancelamento ${i + 1} (${E.CANCELLED[i]}) desloca ${moved} aulas`);
  });
  E.AULA_ADIADA.forEach((d, i) => {
    const A = E.acBuildSchedule(E.CANCELLED, E.AULA_ADIADA.slice(0, i)).entries.filter(e => !e.skip && e.topic);
    const B = E.acBuildSchedule(E.CANCELLED, E.AULA_ADIADA.slice(0, i + 1)).entries.filter(e => !e.skip && e.topic);
    const moved = A.filter((x, j) => B[j] && ds(x.date) !== ds(B[j].date)).length;
    check(moved > 0, `aula adiada ${i + 1} (${d}) desloca ${moved} aulas`);
  });

  console.log(failures.length ? `\n\x1b[31m${failures.length} falha(s)\x1b[0m\n` : '\n\x1b[32mtodos os invariantes passaram\x1b[0m\n');
  process.exit(failures.length ? 1 : 0);
}

main();
