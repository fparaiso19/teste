const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  const directCandidates = [
    path.join(process.cwd(), 'node_modules', 'playwright'),
    path.join(__dirname, '..', 'node_modules', 'playwright'),
    process.env.npm_config_prefix ? path.join(process.env.npm_config_prefix, 'lib', 'node_modules', 'playwright') : null
  ].filter(Boolean);

  try {
    return require('playwright');
  } catch (error) {
    for (const candidateDir of directCandidates) {
      const candidatePackage = path.join(candidateDir, 'package.json');

      if (fs.existsSync(candidatePackage)) {
        return require(candidateDir);
      }
    }

    const pathEntries = String(process.env.PATH || '')
      .split(path.delimiter)
      .filter(Boolean);

    for (const binDir of pathEntries) {
      const candidateDir = path.resolve(binDir, '..', 'playwright');
      const candidatePackage = path.join(candidateDir, 'package.json');

      if (fs.existsSync(candidatePackage)) {
        return require(candidateDir);
      }
    }

    throw error;
  }
}

const { firefox } = loadPlaywright();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function px(value) {
  return Number.parseFloat(String(value).replace('px', '').trim());
}

async function showMonthWithCycleActivity(page) {
  const targetIndex = await page.evaluate(() => {
    const monthContainers = Array.from(document.querySelectorAll('.month-container'));
    return monthContainers.findIndex(month => month.querySelector('.cycle-badge'));
  });

  assert(targetIndex >= 0, 'Expected at least one month with cycle activity for smoke coverage');

  await page.locator('#monthSelect').selectOption(String(targetIndex));
  await page.waitForFunction(index => {
    const month = document.querySelectorAll('.month-container')[index];
    return Boolean(month && month.classList.contains('active'));
  }, targetIndex);

  return targetIndex;
}

async function collectDesktop(page) {
  return page.evaluate(() => {
    function requireNode(node, label) {
      if (!node) {
        throw new Error(`Missing required element: ${label}`);
      }
      return node;
    }

    function isVisible(node) {
      return getComputedStyle(node).display !== 'none';
    }

    const root = getComputedStyle(document.documentElement);
    const pageShell = getComputedStyle(requireNode(document.querySelector('.page-shell'), '.page-shell'));
    const topRegion = getComputedStyle(requireNode(document.querySelector('.escala-top-region'), '.escala-top-region'));
    const navClusters = document.querySelectorAll('.nav-cluster');
    const nav = getComputedStyle(requireNode(document.querySelector('.nav-container'), '.nav-container'));
    const filterItem = getComputedStyle(requireNode(document.querySelector('.filter-item'), '.filter-item'));
    const activityChip = getComputedStyle(requireNode(document.querySelector('.activity-filter-item'), '.activity-filter-item'));
    const filtersMeta = document.querySelector('.filters-meta');
    const activeMonth = requireNode(document.querySelector('.month-container.active'), '.month-container.active');
    const monthHeader = getComputedStyle(requireNode(activeMonth.querySelector('.month-header'), '.month-header'));
    const activeTab = getComputedStyle(requireNode(document.querySelector('.page-tab.active'), '.page-tab.active'));
    const agenda = requireNode(document.getElementById('agendaView'), '#agendaView');
    const todayBtn = requireNode(document.getElementById('todayBtn'), '#todayBtn');
    const monthSelect = requireNode(document.getElementById('monthSelect'), '#monthSelect');
    const prevBtn = requireNode(document.getElementById('prevBtn'), '#prevBtn');
    const nextBtn = requireNode(document.getElementById('nextBtn'), '#nextBtn');
    const viewToggle = requireNode(document.querySelector('.view-toggle'), '.view-toggle');
    const themeToggle = requireNode(document.querySelector('.theme-toggle'), '.theme-toggle');
    const exportBtn = requireNode(document.querySelector('.ics-btn'), '.ics-btn');
    const residentFilterCount = document.querySelectorAll('.pessoa-filter').length;
    const activitySelectAll = document.getElementById('actFilterAll');
    const themeOptions = Array.from(document.querySelectorAll('.theme-btn')).map(button => button.dataset.themeOption);
    const viewOptions = Array.from(document.querySelectorAll('.view-btn')).map(button => button.dataset.escalaView);

    return {
      radiusLg: root.getPropertyValue('--radius-lg').trim(),
      spaceMd: root.getPropertyValue('--space-md').trim(),
      shadowSoft: root.getPropertyValue('--shadow-soft').trim(),
      pageShellMaxWidth: pageShell.maxWidth,
      topRegionGap: topRegion.gap,
      navClusterCount: navClusters.length,
      monthHeaderBg: monthHeader.backgroundColor,
      monthHeaderColor: monthHeader.color,
      activeTabBackground: activeTab.backgroundColor,
      activeTabBorderColor: activeTab.borderBottomColor,
      navRadius: nav.borderRadius,
      navGap: nav.gap,
      navPaddingTop: nav.paddingTop,
      filterRadius: filterItem.borderRadius,
      activityRadius: activityChip.borderRadius,
      filterMetaExists: Boolean(filtersMeta),
      calendarVisible: isVisible(activeMonth),
      agendaHidden: getComputedStyle(agenda).display === 'none',
      todayButton: isVisible(todayBtn),
      monthSelectVisible: isVisible(monthSelect),
      prevVisible: isVisible(prevBtn),
      nextVisible: isVisible(nextBtn),
      viewToggleVisible: isVisible(viewToggle),
      themeToggleVisible: isVisible(themeToggle),
      exportButtonVisible: isVisible(exportBtn),
      activitySelectAllExists: Boolean(activitySelectAll),
      residentFilterCount,
      themeOptions,
      viewOptions
    };
  });
}

async function collectMobile(page) {
  return page.evaluate(() => {
    function requireNode(node, label) {
      if (!node) {
        throw new Error(`Missing required element: ${label}`);
      }
      return node;
    }

    function isVisible(node) {
      return getComputedStyle(node).display !== 'none';
    }

    const activeMonth = requireNode(document.querySelector('.month-container.active'), '.month-container.active');
    const activeCalendar = requireNode(activeMonth.querySelector('.calendar'), '.month-container.active .calendar');
    const monthSelect = requireNode(document.getElementById('monthSelect'), '#monthSelect');
    const todayBtn = requireNode(document.getElementById('todayBtn'), '#todayBtn');
    const nav = getComputedStyle(requireNode(document.querySelector('.nav-container'), '.nav-container'));
    const monthStyles = getComputedStyle(activeMonth);
    const prevBtn = requireNode(document.getElementById('prevBtn'), '#prevBtn');
    const nextBtn = requireNode(document.getElementById('nextBtn'), '#nextBtn');
    const viewToggle = requireNode(document.querySelector('.view-toggle'), '.view-toggle');
    const themeToggle = requireNode(document.querySelector('.theme-toggle'), '.theme-toggle');
    const exportBtn = requireNode(document.querySelector('.ics-btn'), '.ics-btn');
    const residentFilterCount = document.querySelectorAll('.pessoa-filter').length;
    const activitySelectAll = document.getElementById('actFilterAll');

    return {
      calendarVisible: isVisible(activeMonth),
      monthSelectVisible: isVisible(monthSelect),
      todayVisible: isVisible(todayBtn),
      prevVisible: isVisible(prevBtn),
      nextVisible: isVisible(nextBtn),
      viewToggleVisible: isVisible(viewToggle),
      themeToggleVisible: isVisible(themeToggle),
      exportButtonVisible: isVisible(exportBtn),
      navWrap: nav.flexWrap,
      monthOverflowX: monthStyles.overflowX,
      monthClientWidth: activeMonth.clientWidth,
      calendarScrollWidth: activeCalendar.scrollWidth,
      residentFilterCount,
      activitySelectAllExists: Boolean(activitySelectAll)
    };
  });
}

async function collectActivityPanel(page) {
  return page.evaluate(() => {
    function requireNode(node, label) {
      if (!node) {
        throw new Error(`Missing required element: ${label}`);
      }
      return node;
    }

    const panel = requireNode(document.getElementById('activityFilters'), '#activityFilters');
    const residentSection = requireNode(document.getElementById('activityResidentSection'), '#activityResidentSection');
    const groups = requireNode(document.getElementById('activityFilterGroups'), '#activityFilterGroups');

    return {
      visible: panel.classList.contains('visible'),
      residentCount: residentSection.querySelectorAll('.act-pessoa-filter').length,
      groupCount: groups.querySelectorAll('.act-filter').length,
      residentSectionChildren: residentSection.children.length,
      groupChildren: groups.children.length
    };
  });
}

async function toggleResidentFilterWithActivity(page) {
  const targetIndex = await page.evaluate(() => {
    function requireNode(node, label) {
      if (!node) {
        throw new Error(`Missing required element: ${label}`);
      }
      return node;
    }

    const activeMonth = requireNode(document.querySelector('.month-container.active'), '.month-container.active');
    const residentFilters = Array.from(document.querySelectorAll('.pessoa-filter'));

    if (residentFilters.length === 0) {
      throw new Error('Missing required element: resident filters');
    }

    const residentsWithActivity = residentFilters
      .map((input, index) => {
        const name = input.dataset.pessoa;
        const hasActivity = Array.from(activeMonth.querySelectorAll('.cycle-badge')).some(badge =>
          String(badge.dataset.pessoas || '')
            .split(',')
            .includes(name)
        );
        return { index, hasActivity };
      })
      .filter(entry => entry.hasActivity)
      .map(entry => entry.index);

    if (residentsWithActivity.length === 0) {
      throw new Error('Expected at least one resident filter to feed the activity panel');
    }

    const checkedActivityResidents = residentFilters
      .map((input, index) => ({ input, index }))
      .filter(({ input }) => input.checked)
      .filter(({ input }) => {
        const name = input.dataset.pessoa;
        return Array.from(activeMonth.querySelectorAll('.cycle-badge')).some(badge =>
          String(badge.dataset.pessoas || '')
            .split(',')
            .includes(name)
        );
      })
      .map(({ index }) => index);

    const targetIndex = checkedActivityResidents.length > 1
      ? checkedActivityResidents[0]
      : residentsWithActivity[0];

    const target = residentFilters[targetIndex];
    if (!target) {
      throw new Error('Missing required element: targeted resident filter');
    }

    return targetIndex;
  });

  const target = page.locator('.pessoa-filter').nth(targetIndex);
  await target.click();

  await page.waitForFunction(() => {
    const panel = document.getElementById('activityFilters');
    const residentSection = document.getElementById('activityResidentSection');
    const groups = document.getElementById('activityFilterGroups');
    return Boolean(panel && panel.classList.contains('visible') && residentSection && residentSection.children.length > 0 && groups && groups.children.length > 0);
  });
}

async function collectCalendarAndAgenda(page) {
  return page.evaluate(() => {
    function requireNode(node, label) {
      if (!node) {
        throw new Error(`Missing required element: ${label}`);
      }
      return node;
    }

    function borderRadiusOrNull(selector) {
      const node = document.querySelector(selector);
      return node ? getComputedStyle(node).borderRadius : null;
    }

    const month = getComputedStyle(requireNode(document.querySelector('.month-container'), '.month-container'));
    const activeMonth = requireNode(document.querySelector('.month-container.active'), '.month-container.active');
    const monthHeader = getComputedStyle(requireNode(activeMonth.querySelector('.month-header'), '.month-header'));
    const day = getComputedStyle(requireNode(activeMonth.querySelector('.day:not(.empty)'), '.day:not(.empty)'));
    const weekendCell = getComputedStyle(requireNode(activeMonth.querySelector('.day.weekend'), '.day.weekend'));
    const today = getComputedStyle(requireNode(document.querySelector('.day.today'), '.day.today'));
    const plantao = getComputedStyle(requireNode(activeMonth.querySelector('.plantao'), '.plantao'));
    const evento = getComputedStyle(requireNode(document.querySelector('.evento'), '.evento'));
    const agenda = getComputedStyle(requireNode(document.getElementById('agendaView'), '#agendaView'));
    const activityFilters = getComputedStyle(requireNode(document.getElementById('activityFilters'), '#activityFilters'));
    const agendaMonthHeader = getComputedStyle(requireNode(document.querySelector('.agenda-month-header'), '.agenda-month-header'));
    const agendaDayCard = getComputedStyle(requireNode(document.querySelector('.agenda-day-card'), '.agenda-day-card'));
    const agendaItem = getComputedStyle(requireNode(document.querySelector('.agenda-item'), '.agenda-item'));

    return {
      monthRadius: month.borderRadius,
      monthHeaderPaddingTop: monthHeader.paddingTop,
      monthHeaderBackground: monthHeader.backgroundColor,
      weekendBackground: weekendCell.backgroundColor,
      dayBorderRadius: day.borderRadius,
      dayRadius: day.borderRadius,
      todayOutlineWidth: today.outlineWidth,
      plantaoRadius: plantao.borderRadius,
      badgeRadius: plantao.borderRadius,
      eventoBackground: evento.backgroundColor,
      eventoRadius: evento.borderRadius,
      psBadgeRadius: borderRadiusOrNull('.ps-badge'),
      cycleBadgeRadius: borderRadiusOrNull('.cycle-badge'),
      feriasRadius: borderRadiusOrNull('.ferias'),
      folgaRadius: borderRadiusOrNull('.folga'),
      calAcBadgeRadius: borderRadiusOrNull('.cal-ac-badge'),
      agendaVisible: agenda.display !== 'none',
      activityFiltersVisibleInAgenda: activityFilters.display !== 'none',
      activeMonthHiddenInAgenda: activeMonth ? getComputedStyle(activeMonth).display === 'none' : false,
      agendaMonthHeaderRadius: agendaMonthHeader.borderRadius,
      agendaMonthHeaderBackground: agendaMonthHeader.backgroundColor,
      agendaDayCardRadius: agendaDayCard.borderRadius,
      agendaItemRadius: agendaItem.borderRadius
    };
  });
}

async function collectSecondarySurfaces(page) {
  const escalaSurfaces = await page.evaluate(() => {
    function requireNode(node, label) {
      if (!node) {
        throw new Error(`Missing required element: ${label}`);
      }
      return node;
    }

    const tabela = getComputedStyle(requireNode(document.querySelector('.tabela-container.visible'), '.tabela-container.visible'));
    const legenda = getComputedStyle(requireNode(document.querySelector('.legenda'), '.legenda'));

    return {
      tabelaRadius: tabela.borderRadius,
      legendaRadius: legenda.borderRadius
    };
  });

  await page.locator('.page-tab').nth(1).click();
  await page.waitForFunction(() => {
    const aulasPage = document.getElementById('page-aulas');
    return Boolean(
      aulasPage &&
      aulasPage.classList.contains('active') &&
      document.querySelector('#page-aulas .ac-summary-card') &&
      document.querySelector('#page-aulas .ac-legenda')
    );
  });

  const aulasSurfaces = await page.evaluate(() => {
    function requireNode(node, label) {
      if (!node) {
        throw new Error(`Missing required element: ${label}`);
      }
      return node;
    }

    const acSummary = getComputedStyle(requireNode(document.querySelector('#page-aulas .ac-summary-card'), '#page-aulas .ac-summary-card'));
    const acLegenda = getComputedStyle(requireNode(document.querySelector('#page-aulas .ac-legenda'), '#page-aulas .ac-legenda'));

    return {
      acSummaryRadius: acSummary.borderRadius,
      acLegendaRadius: acLegenda.borderRadius
    };
  });

  await page.locator('.page-tab').nth(2).click();
  await page.waitForFunction(() => {
    const ciclosPage = document.getElementById('page-ciclos');
    return Boolean(
      ciclosPage &&
      ciclosPage.classList.contains('active') &&
      document.querySelector('#page-ciclos .ciclo-card')
    );
  });

  const ciclosSurfaces = await page.evaluate(() => {
    function requireNode(node, label) {
      if (!node) {
        throw new Error(`Missing required element: ${label}`);
      }
      return node;
    }

    const cicloCard = getComputedStyle(requireNode(document.querySelector('#page-ciclos .ciclo-card'), '#page-ciclos .ciclo-card'));

    return {
      cicloCardRadius: cicloCard.borderRadius
    };
  });

  await page.locator('.page-tab').nth(0).click();
  await page.waitForFunction(() => {
    const escalaPage = document.getElementById('page-escala');
    return Boolean(escalaPage && escalaPage.classList.contains('active'));
  });

  return {
    ...escalaSurfaces,
    ...aulasSurfaces,
    ...ciclosSurfaces
  };
}

async function verifyAgendaTodayButton(page) {
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'auto' }));
  await page.locator('#todayBtn').click();
  await page.waitForFunction(() => {
    const todayCard = document.querySelector('.agenda-day-today');
    if (!todayCard) return false;
    const rect = todayCard.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });

  return page.evaluate(() => {
    const todayCard = document.querySelector('.agenda-day-today');
    const rect = todayCard ? todayCard.getBoundingClientRect() : null;
    return {
      agendaModeActive: document.getElementById('page-escala')?.classList.contains('agenda-mode') || false,
      todayCardInView: Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0)
    };
  });
}

async function verifyIcsModalAccessibility(page) {
  await page.locator('.ics-btn').click();
  await page.waitForFunction(() => {
    const overlay = document.getElementById('icsModal');
    const dialog = overlay?.querySelector('.ics-modal');
    return Boolean(
      overlay &&
      dialog &&
      overlay.classList.contains('active') &&
      overlay.getAttribute('aria-hidden') === 'false' &&
      dialog.getAttribute('role') === 'dialog' &&
      document.activeElement === dialog
    );
  });

  const openState = await page.evaluate(() => {
    const overlay = document.getElementById('icsModal');
    const dialog = overlay?.querySelector('.ics-modal');
    return {
      open: Boolean(overlay?.classList.contains('active')),
      ariaHidden: overlay?.getAttribute('aria-hidden') || null,
      dialogRole: dialog?.getAttribute('role') || null,
      dialogFocused: document.activeElement === dialog
    };
  });

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => {
    const overlay = document.getElementById('icsModal');
    return Boolean(overlay && !overlay.classList.contains('active') && overlay.getAttribute('aria-hidden') === 'true');
  });

  const closedState = await page.evaluate(() => {
    const overlay = document.getElementById('icsModal');
    return {
      open: Boolean(overlay?.classList.contains('active')),
      ariaHidden: overlay?.getAttribute('aria-hidden') || null
    };
  });

  return { openState, closedState };
}

async function run() {
  const url = process.env.ESCALA_URL || 'http://127.0.0.1:8000/testes/Escala%20Reside%CC%82ncia%202025-2027.html';
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#todayBtn');

    const desktop = await collectDesktop(page);

    assert(desktop.radiusLg, 'Expected --radius-lg token in :root');
    assert(desktop.spaceMd, 'Expected --space-md token in :root');
    assert(desktop.shadowSoft, 'Expected --shadow-soft token in :root');
    assert(px(desktop.navRadius) >= 12, `Expected nav radius >= 12px, got ${desktop.navRadius}`);
    assert(px(desktop.navGap) >= 10, `Expected nav gap >= 10px, got ${desktop.navGap}`);
    assert(px(desktop.navPaddingTop) >= 14, `Expected nav vertical padding >= 14px, got ${desktop.navPaddingTop}`);
    assert(px(desktop.filterRadius) >= 12, `Expected filter chip radius >= 12px, got ${desktop.filterRadius}`);
    assert(px(desktop.activityRadius) >= 12, `Expected activity chip radius >= 12px, got ${desktop.activityRadius}`);
    assert(px(desktop.pageShellMaxWidth) >= 1180, `Expected page shell max width >= 1180px, got ${desktop.pageShellMaxWidth}`);
    assert(px(desktop.topRegionGap) >= 16, `Expected top region gap >= 16px, got ${desktop.topRegionGap}`);
    assert(desktop.navClusterCount === 2, `Expected exactly 2 nav clusters, got ${desktop.navClusterCount}`);
    assert(desktop.monthHeaderBg !== 'rgb(32, 94, 167)', `Expected month header to stop using the primary blue bar, got ${desktop.monthHeaderBg}`);
    assert(desktop.monthHeaderColor !== 'rgb(255, 255, 255)', `Expected month header text to use clinical ink text, got ${desktop.monthHeaderColor}`);
    assert(desktop.activeTabBorderColor !== 'rgba(0, 0, 0, 0)', 'Expected active page tab to use an accent bottom border');
    assert(desktop.filterMetaExists, 'Expected semantic .filters-meta wrapper for the inline legend row');
    assert(desktop.calendarVisible, 'Expected calendar to be visible by default');
    assert(desktop.agendaHidden, 'Expected agenda to stay hidden by default');
    assert(desktop.todayButton, 'Expected Hoje button to exist');
    assert(desktop.monthSelectVisible, 'Expected month select to exist and be visible on desktop');
    assert(desktop.prevVisible, 'Expected previous month button to exist and be visible on desktop');
    assert(desktop.nextVisible, 'Expected next month button to exist and be visible on desktop');
    assert(desktop.viewToggleVisible, 'Expected view toggle to exist and be visible on desktop');
    assert(desktop.themeToggleVisible, 'Expected theme toggle to exist and be visible on desktop');
    assert(desktop.exportButtonVisible, 'Expected export button to exist and be visible on desktop');
    assert(desktop.activitySelectAllExists, 'Expected activity select-all control to exist');
    assert(desktop.residentFilterCount > 0, 'Expected at least one resident filter entry');
    assert(desktop.themeOptions.includes('system'), 'Expected theme option "system" to exist');
    assert(desktop.themeOptions.includes('light'), 'Expected theme option "light" to exist');
    assert(desktop.themeOptions.includes('dark'), 'Expected theme option "dark" to exist');
    assert(desktop.viewOptions.includes('calendar'), 'Expected view option "calendar" to exist');
    assert(desktop.viewOptions.includes('agenda'), 'Expected view option "agenda" to exist');

    await showMonthWithCycleActivity(page);

    const preActivity = await collectActivityPanel(page);
    await toggleResidentFilterWithActivity(page);
    const postActivity = await collectActivityPanel(page);

    assert(postActivity.visible, 'Expected activity filter panel to be visible after resident interaction');
    assert(postActivity.residentCount > 0, 'Expected generated resident activity filters after resident interaction');
    assert(postActivity.groupCount > 0, 'Expected generated activity filters after resident interaction');
    assert(postActivity.residentSectionChildren > 0, 'Expected resident activity filter content to be rendered after resident interaction');
    assert(postActivity.groupChildren > 0, 'Expected activity filter group content to be rendered after resident interaction');
    assert(
      postActivity.residentCount !== preActivity.residentCount || postActivity.groupCount !== preActivity.groupCount,
      'Expected resident interaction to update the activity filter panel'
    );

    await page.setViewportSize({ width: 390, height: 1200 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#todayBtn');

    const mobile = await collectMobile(page);

    assert(mobile.calendarVisible, 'Expected mobile view to keep the full calendar visible');
    assert(mobile.monthSelectVisible, 'Expected mobile view to keep the month selector visible');
    assert(mobile.todayVisible, 'Expected mobile view to keep the Hoje button visible');
    assert(mobile.prevVisible, 'Expected mobile view to keep the previous month button visible');
    assert(mobile.nextVisible, 'Expected mobile view to keep the next month button visible');
    assert(mobile.viewToggleVisible, 'Expected mobile view to keep the view toggle visible');
    assert(mobile.themeToggleVisible, 'Expected mobile view to keep the theme toggle visible');
    assert(mobile.exportButtonVisible, 'Expected mobile view to keep the export button visible');
    assert(mobile.navWrap !== 'nowrap', `Expected mobile nav to wrap or adapt, got ${mobile.navWrap}`);
    assert(mobile.monthOverflowX !== 'hidden', `Expected mobile month container to allow horizontal overflow, got ${mobile.monthOverflowX}`);
    assert(
      mobile.calendarScrollWidth <= mobile.monthClientWidth || mobile.monthOverflowX === 'auto' || mobile.monthOverflowX === 'scroll',
      `Expected mobile calendar overflow to stay reachable, got overflowX=${mobile.monthOverflowX} scrollWidth=${mobile.calendarScrollWidth} clientWidth=${mobile.monthClientWidth}`
    );
    assert(mobile.residentFilterCount > 0, 'Expected at least one resident filter entry on mobile');
    assert(mobile.activitySelectAllExists, 'Expected mobile activity select-all control to exist');

    await page.setViewportSize({ width: 1440, height: 1400 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#todayBtn');
    await showMonthWithCycleActivity(page);
    await toggleResidentFilterWithActivity(page);
    await page.locator('[data-escala-view="agenda"]').click();
    await page.waitForFunction(() => {
      const agenda = document.getElementById('agendaView');
      const activeMonth = document.querySelector('.month-container.active');
      return Boolean(
        document.getElementById('page-escala')?.classList.contains('agenda-mode') &&
        agenda &&
        getComputedStyle(agenda).display !== 'none' &&
        activeMonth &&
        getComputedStyle(activeMonth).display === 'none' &&
        document.querySelector('.agenda-month-header') &&
        document.querySelector('.agenda-day-card') &&
        document.querySelector('.agenda-item')
      );
    });

    const surfaces = await collectCalendarAndAgenda(page);

    assert(px(surfaces.monthRadius) >= 14, `Expected month container radius >= 14px, got ${surfaces.monthRadius}`);
    assert(px(surfaces.monthHeaderPaddingTop) >= 14, `Expected month header vertical padding >= 14px, got ${surfaces.monthHeaderPaddingTop}`);
    assert(surfaces.monthHeaderBackground !== 'rgb(32, 94, 167)', `Expected month header to use a neutral surface, got ${surfaces.monthHeaderBackground}`);
    assert(surfaces.weekendBackground !== surfaces.eventoBackground, 'Expected weekend tint to be quieter than event badges');
    assert(px(surfaces.dayBorderRadius) >= 12, `Expected day border radius >= 12px, got ${surfaces.dayBorderRadius}`);
    assert(px(surfaces.dayRadius) >= 10, `Expected day cell radius >= 10px, got ${surfaces.dayRadius}`);
    assert(px(surfaces.todayOutlineWidth) >= 1, `Expected visible today outline >= 1px, got ${surfaces.todayOutlineWidth}`);
    assert(px(surfaces.plantaoRadius) >= 8, `Expected plantao badge radius >= 8px, got ${surfaces.plantaoRadius}`);
    assert(px(surfaces.badgeRadius) >= 9, `Expected shared badge radius >= 9px, got ${surfaces.badgeRadius}`);
    assert(px(surfaces.eventoRadius) >= 8, `Expected evento badge radius >= 8px, got ${surfaces.eventoRadius}`);
    assert(px(surfaces.psBadgeRadius) >= 8, `Expected ps badge radius >= 8px, got ${surfaces.psBadgeRadius}`);
    assert(px(surfaces.cycleBadgeRadius) >= 8, `Expected cycle badge radius >= 8px, got ${surfaces.cycleBadgeRadius}`);
    assert(px(surfaces.feriasRadius) >= 8, `Expected ferias badge radius >= 8px, got ${surfaces.feriasRadius}`);
    assert(px(surfaces.folgaRadius) >= 8, `Expected folga badge radius >= 8px, got ${surfaces.folgaRadius}`);
    assert(px(surfaces.calAcBadgeRadius) >= 8, `Expected Aulas/Casos badge radius >= 8px, got ${surfaces.calAcBadgeRadius}`);
    assert(surfaces.agendaVisible, 'Expected agenda to render when selected');
    assert(surfaces.activityFiltersVisibleInAgenda, 'Expected activity filters to remain visible in agenda mode');
    assert(surfaces.activeMonthHiddenInAgenda, 'Expected active month grid to hide in agenda mode');
    assert(px(surfaces.agendaMonthHeaderRadius) >= 12, `Expected agenda month header radius >= 12px, got ${surfaces.agendaMonthHeaderRadius}`);
    assert(surfaces.agendaMonthHeaderBackground !== 'rgb(32, 94, 167)', `Expected agenda month header to stop using the primary blue bar, got ${surfaces.agendaMonthHeaderBackground}`);
    assert(px(surfaces.agendaDayCardRadius) >= 12, `Expected agenda day card radius >= 12px, got ${surfaces.agendaDayCardRadius}`);
    assert(px(surfaces.agendaItemRadius) >= 12, `Expected agenda item radius >= 12px, got ${surfaces.agendaItemRadius}`);

    const agendaToday = await verifyAgendaTodayButton(page);

    assert(agendaToday.agendaModeActive, 'Expected agenda mode to remain active after clicking Hoje');
    assert(agendaToday.todayCardInView, 'Expected Hoje to bring the agenda today card into view');

    const secondary = await collectSecondarySurfaces(page);

    assert(px(secondary.tabelaRadius) >= 14, `Expected table container radius >= 14px, got ${secondary.tabelaRadius}`);
    assert(px(secondary.legendaRadius) >= 14, `Expected legend radius >= 14px, got ${secondary.legendaRadius}`);
    assert(px(secondary.acSummaryRadius) >= 14, `Expected Aulas summary radius >= 14px, got ${secondary.acSummaryRadius}`);
    assert(px(secondary.acLegendaRadius) >= 14, `Expected Aulas legend radius >= 14px, got ${secondary.acLegendaRadius}`);
    assert(px(secondary.cicloCardRadius) >= 12, `Expected cycle card radius >= 12px, got ${secondary.cicloCardRadius}`);

    await page.locator('.page-tab').nth(0).click();
    await page.waitForFunction(() => Boolean(document.getElementById('page-escala')?.classList.contains('active')));

    const icsModal = await verifyIcsModalAccessibility(page);

    assert(icsModal.openState.open, 'Expected ICS modal to open');
    assert(icsModal.openState.ariaHidden === 'false', `Expected ICS modal aria-hidden=false on open, got ${icsModal.openState.ariaHidden}`);
    assert(icsModal.openState.dialogRole === 'dialog', `Expected ICS dialog role=dialog, got ${icsModal.openState.dialogRole}`);
    assert(icsModal.openState.dialogFocused, 'Expected ICS dialog to receive focus on open');
    assert(!icsModal.closedState.open, 'Expected ICS modal to close on Escape');
    assert(icsModal.closedState.ariaHidden === 'true', `Expected ICS modal aria-hidden=true on close, got ${icsModal.closedState.ariaHidden}`);

    console.log(JSON.stringify({ ok: true, desktop, mobile, surfaces, agendaToday, secondary, icsModal }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
