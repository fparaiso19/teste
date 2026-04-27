const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findEscalaFile() {
  const file = fs.readdirSync(__dirname)
    .find(name => name.startsWith('Escala') && name.includes('Resid') && name.endsWith('2025-2027.html'));
  if (!file) throw new Error('Could not find Escala Residencia HTML file');
  return path.join(__dirname, file);
}

function normalizePessoa(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function parseDate(dayMonth, monthHeader) {
  const monthNames = {
    janeiro: '01',
    fevereiro: '02',
    marco: '03',
    abril: '04',
    maio: '05',
    junho: '06',
    julho: '07',
    agosto: '08',
    setembro: '09',
    outubro: '10',
    novembro: '11',
    dezembro: '12'
  };
  const [day] = dayMonth.trim().split('/');
  const [monthName, year] = monthHeader
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/);
  const month = monthNames[monthName];
  if (!month || !year) throw new Error(`Could not parse month header: ${monthHeader}`);
  return `${year}-${month}-${day.padStart(2, '0')}`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const fixedTime = new Date('2026-04-27T12:00:00-03:00').getTime();
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedTime]));
      }
      static now() {
        return fixedTime;
      }
    }
    FixedDate.UTC = RealDate.UTC;
    FixedDate.parse = RealDate.parse;
    FixedDate.prototype = RealDate.prototype;
    window.Date = FixedDate;
  });

  const url = process.env.ESCALA_URL || pathToFileURL(findEscalaFile()).href;
  await page.goto(url);
  assert(pageErrors.length === 0, `Page errors found:\n${pageErrors.join('\n')}`);

  const result = await page.evaluate(({ normalizePessoaSource, parseDateSource }) => {
    const normalizePessoa = eval(`(${normalizePessoaSource})`);
    const parseDate = eval(`(${parseDateSource})`);

    window.acRenderSchedule();

    const expected = [];
    document.querySelectorAll('.ac-schedule-card').forEach(card => {
      const monthHeader = card.querySelector('.ac-month-header')?.textContent.replace(/POS-CONGRESSO|PÓS-CONGRESSO/g, '').trim();
      card.querySelectorAll('tbody tr[data-acpessoas]').forEach(row => {
        const dateText = row.querySelector('.date-col')?.textContent.trim();
        if (!monthHeader || !dateText) return;
        const date = parseDate(dateText, monthHeader);
        [
          ['.ac-b-aula', 'cal-ac-aula'],
          ['.ac-b-caso', 'cal-ac-caso'],
          ['.ac-b-art', 'cal-ac-art']
        ].forEach(([sourceSelector, targetClass]) => {
          const source = row.querySelector(sourceSelector);
          if (!source) return;
          const name = source.textContent.replace(/[^\p{L}\s]/gu, '').trim();
          expected.push({
            date,
            targetClass,
            displayName: name,
            pessoa: normalizePessoa(name)
          });
        });
      });
    });

    const missing = [];
    expected.forEach(item => {
      const day = document.querySelector(`.day[data-date="${item.date}"]`);
      const badge = day && Array.from(day.querySelectorAll(`.cal-ac-badge.${item.targetClass}`))
        .find(el => el.textContent.includes(item.displayName));
      if (!badge) {
        missing.push({...item, reason: 'missing badge'});
        return;
      }
      if (badge.dataset.pessoas !== item.pessoa) {
        missing.push({
          ...item,
          reason: `wrong data-pessoas: ${badge.dataset.pessoas}`
        });
      }
    });

    document.getElementById('all').checked = false;
    document.querySelectorAll('.pessoa-filter').forEach(cb => {
      cb.checked = cb.dataset.pessoa === 'JOAO';
    });
    window.filterPessoa();

    const joaoCase = document.querySelector('.day[data-date="2026-05-26"] .cal-ac-caso');
    const joaoCaseVisible = !!joaoCase && getComputedStyle(joaoCase).display !== 'none';

    return {
      expectedCount: expected.length,
      missing,
      joaoCaseText: joaoCase?.textContent.trim() || null,
      joaoCasePessoa: joaoCase?.dataset.pessoas || null,
      joaoCaseVisible
    };
  }, {
    normalizePessoaSource: normalizePessoa.toString(),
    parseDateSource: parseDate.toString()
  });

  assert(result.expectedCount > 0, 'Expected at least one Aulas/Casos badge to validate');
  assert(result.missing.length === 0, `Aulas/Casos badge mismatches:\n${JSON.stringify(result.missing, null, 2)}`);
  assert(result.joaoCaseText === '🏥 João', `Expected 26/05/2026 case badge for Joao, got ${result.joaoCaseText}`);
  assert(result.joaoCasePessoa === 'JOAO', `Expected Joao case data-pessoas=JOAO, got ${result.joaoCasePessoa}`);
  assert(result.joaoCaseVisible, 'Expected 26/05/2026 Joao case badge to be visible when filtering JOAO');

  await page.evaluate(() => {
    window.switchPage('aulas');
  });
  const aulasInitialResult = await page.evaluate(() => ({
    selectedMonthText: document.getElementById('acMonthSelect')?.selectedOptions[0]?.textContent || null,
    activeMonthHeader: document.querySelector('.ac-schedule-card.active .ac-month-header')?.textContent.trim() || null
  }));
  assert(aulasInitialResult.selectedMonthText === 'Abril 2026', `Expected Aulas/Casos to open on Abril 2026, got ${aulasInitialResult.selectedMonthText}`);
  assert(aulasInitialResult.activeMonthHeader?.includes('Abril 2026'), `Expected initial active Aulas/Casos card to be Abril 2026, got ${aulasInitialResult.activeMonthHeader}`);

  await page.evaluate(() => {
    if (!window._acRendered) {
      window.acRenderSchedule();
      window._acRendered = true;
    }
    window.acGoToMonth(document.querySelectorAll('.ac-schedule-card').length - 1);
  });
  const acTodayButtonCount = await page.locator('#acTodayBtn').count();
  assert(acTodayButtonCount === 1, `Expected one Aulas/Casos Hoje button, found ${acTodayButtonCount}`);
  await page.locator('#acTodayBtn').click();
  const aulasTodayResult = await page.evaluate(() => ({
    selectedMonthText: document.getElementById('acMonthSelect')?.selectedOptions[0]?.textContent || null,
    activeMonthHeader: document.querySelector('.ac-schedule-card.active .ac-month-header')?.textContent.trim() || null
  }));
  assert(aulasTodayResult.selectedMonthText === 'Abril 2026', `Expected Aulas/Casos Hoje to select Abril 2026, got ${aulasTodayResult.selectedMonthText}`);
  assert(aulasTodayResult.activeMonthHeader?.includes('Abril 2026'), `Expected active Aulas/Casos card to be Abril 2026, got ${aulasTodayResult.activeMonthHeader}`);

  console.log(JSON.stringify({ ok: true, ...result, aulasInitialResult, aulasTodayResult }, null, 2));
  await browser.close();
})().catch(async error => {
  console.error(error);
  process.exit(1);
});
