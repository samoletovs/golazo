import { createState, EXERCISES, freshDraft, MAIN_PAGES, submitDraft, TODAY } from './model.mjs';
import { translator } from './copy.mjs';
import { icon, esc, dateLabel, link, eventTitle } from './graphics.mjs';
import { mainViews, head } from './views.mjs';
import * as flows from './flows.mjs';

let state = createState(location.search);
const root = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
let dialogOpener = null;

function currentRoute() {
  return decodeURIComponent(location.hash.slice(1)) || 'home';
}

function navigation(t) {
  const items = state.role === 'coach' ? ['home', 'schedule', 'stats', 'profile']
    : state.role === 'mentor' ? ['home', 'schedule', 'progress', 'profile'] : MAIN_PAGES;
  const page = state.page.split('/')[0];
  let active = page;
  if (['training', 'match', 'reflection', 'entry', 'saved', 'tournament'].includes(page)) active = 'log';
  if (['exercise', 'article', 'program', 'program-workout', 'quiz'].includes(page)) active = 'learn';
  if (['settings', 'teams', 'goals', 'onboarding'].includes(page)) active = 'profile';
  if (['coach', 'mentor', 'roster', 'attendance', 'planner'].includes(page)) active = 'home';
  return `<nav class="nav-list" aria-label="${state.language === 'lv' ? 'Galvenā navigācija' : 'Main navigation'}">${items.map(item =>
    `<a class="nav-link" href="#${item}" data-nav="${item}" ${active === item ? 'aria-current="page"' : ''}>${icon(item)}<span>${t(item)}</span></a>`).join('')}</nav>`;
}

function roleProfile(t) {
  return `${head(t, 'profile', 'settingsNote')}<div class="split"><section class="panel"><span class="eyebrow">${t(state.role)}</span><h2>${t(state.role === 'coach' ? 'roleCoach' : 'roleMentor')}</h2><p>${t('noPhoto')}</p>
    <div class="links-grid">${link('settings', t('settings'), '')}${link('onboarding', t('onboarding'), '')}${link(state.role === 'coach' ? 'teams' : 'surface/mentor-link', t(state.role === 'coach' ? 'myTeams' : 'linkTreatment'), '')}${link('surface/auth', t('account'), '')}</div></section><section><h2>${t(state.role === 'coach' ? 'coachTitle' : 'conversation')}</h2><p>${t(state.role === 'coach' ? 'coachIntro' : 'mentorPrivacy')}</p>${link('home', t('home'))}</section></div>`;
}

function view(t) {
  const [route, id] = state.page.split('/');
  if (state.role !== 'player' && ['log', 'training', 'match', 'reflection', 'entry', 'saved'].includes(route)) return `${head(t, 'roleRestricted', 'demoOnly')}${link('home', t('home'), 'button')}`;
  if (route === 'home') return state.role === 'player' ? mainViews.home(state, t) : flows[state.role](state, t);
  if (route === 'profile' && state.role !== 'player') return roleProfile(t);
  if (route === 'progress' && state.role === 'mentor') return flows.mentor(state, t);
  if (mainViews[route]) return mainViews[route](state, t);
  if (['training', 'match', 'reflection'].includes(route)) return flows.logForm(route, state, t);
  if (route === 'entry') return flows.entryView(state, t, id);
  if (route === 'surface') return flows.treatment(state, t, id);
  if (['article', 'program', 'program-workout'].includes(route)) return flows.learnDetail(state, t, route);
  if (route === 'match-detail') return flows.matchDetail(state, t);
  if (route === 'exercise') {
    if (id && !EXERCISES.some(exercise => exercise.id === id)) return head(t, 'missing', 'demoOnly');
    if (id && EXERCISES.some(exercise => exercise.id === id)) state.exercise = id;
    return flows.exercise(state, t);
  }
  const views = { saved: flows.saved, schedule: flows.schedule, tournament: flows.tournament,
    settings: flows.settings, onboarding: flows.onboarding, measurements: flows.measurements,
    goals: flows.goals, teams: flows.teams, checkin: flows.checkin, quiz: flows.quiz,
    coach: flows.coach, mentor: flows.mentor, roster: flows.roster, attendance: flows.attendance,
    planner: flows.planner, stats: flows.stats, coverage: flows.coverage };
  return views[route] ? views[route](state, t) : head(t, 'missing', 'demoOnly');
}

function render({ focus = false, restore = null, scroll = false } = {}) {
  const t = translator(state.language);
  document.documentElement.lang = state.language;
  document.body.dataset.direction = state.direction;
  const basePage = state.page.split('/')[0];
  document.title = `Golazo · ${state.direction.toUpperCase()} · ${t(basePage in mainViews ? basePage : 'academy')}`;
  root.innerHTML = `<div class="lab-bar"><p class="disclaimer"><strong>${t('concept')}</strong> / ${t('synthetic')}</p>
    <div class="direction-switch" role="group" aria-label="${t('compare')}">${['a', 'b'].map(direction => `<button data-direction="${direction}" aria-label="${t(direction)}" aria-pressed="${state.direction === direction}"><span class="direction-long">${t(direction)}</span><span class="direction-short">${t(`${direction}Short`)}</span></button>`).join('')}</div>
    <label class="utility-select"><span>${t('language')}</span><select data-language><option value="lv" ${state.language === 'lv' ? 'selected' : ''}>LV</option><option value="en" ${state.language === 'en' ? 'selected' : ''}>EN</option></select></label>
    <a class="utility-link" href="./contact.html" target="_blank" rel="noopener">${t('contact')}</a>
    <button class="lab-views" data-dialog="review">${t('viewOptions')}</button>
    </div><div class="shell"><header class="masthead"><p class="brand">golazo<span class="brand-dot">.</span></p>${navigation(t)}
      <div class="rail-identity"><strong>${state.role === 'player' ? esc(state.profile.number) : 'U13'}</strong><small>${t(state.role)}</small><small class="club-caption">${t(state.role === 'player' ? state.profile.clubKey : 'club')}</small></div></header>
    <main id="main" tabindex="-1"><div class="context-line"><span class="season">${t('academy')} / 2026–27</span>
      <div class="player-chip"><span class="number">${state.role === 'player' ? esc(state.profile.number) : 'U13'}</span><div><strong>${t(state.role === 'player' ? 'playerName' : state.role)}</strong><small>${t(state.role === 'player' ? 'age' : 'club')}</small></div></div>
      <label class="utility-select"><span>${t('role')}</span><select id="role-select">${['player', 'coach', 'mentor'].map(role => `<option value="${role}" ${state.role === role ? 'selected' : ''}>${t(role)}</option>`).join('')}</select></label></div>
      ${state.notice ? `<p class="status" role="status">${t(state.notice)} <button class="text-link" data-action="dismiss-notice">${t('close')}</button></p>` : ''}
      ${view(t)}
      <details class="prototype-tools"><summary>${t('concept')} / ${t('data')}</summary><div class="controls">
        <label class="utility-select">${t('data')}<select id="data-select"><option value="populated" ${!state.sparse ? 'selected' : ''}>${t('populated')}</option><option value="sparse" ${state.sparse ? 'selected' : ''}>${t('sparse')}</option></select></label>
        <label class="check"><input type="checkbox" id="fail-next" ${state.failNext ? 'checked' : ''}>${t('fail')}</label>
        <button class="text-link" data-dialog="reset">${t('reset')}</button>${link('coverage', t('coverage'))}</div></details>
      <footer class="page-footer">${t('synthetic')} · ${t('demoOnly')}</footer></main></div>`;
  if (focus) document.querySelector('#page-title')?.focus();
  if (restore) document.querySelector(restore)?.focus();
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

function navigate() {
  const route = currentRoute();
  if (route === 'main') {
    document.querySelector('#main')?.focus();
    return;
  }
  state.page = route;
  state.notice = '';
  state.failure = false;
  if (['coach', 'roster', 'attendance', 'planner', 'stats'].includes(route)) state.role = 'coach';
  if (route === 'mentor') state.role = 'mentor';
  render({ focus: true, scroll: true });
}

function queryState() {
  const url = new URL(location.href);
  url.searchParams.set('direction', state.direction);
  url.searchParams.set('lang', state.language);
  url.searchParams.set('data', state.sparse ? 'sparse' : 'populated');
  history.replaceState(null, '', url);
}

function readDraft(form) {
  const kind = form.dataset.form;
  const data = new FormData(form);
  if (!['training', 'match', 'reflection'].includes(kind)) {
    state.formDrafts[kind] = { ...state.formDrafts[kind], ...Object.fromEntries(data) };
    return;
  }
  const draft = state.drafts[kind];
  for (const [key, value] of data) if (!['focusAreas', 'aiConsent'].includes(key)) draft[key] = String(value);
  if (kind === 'training') draft.focusAreas = data.getAll('focusAreas').map(String);
  if (kind === 'reflection') draft.aiConsent = data.has('aiConsent');
}

root.addEventListener('input', event => {
  const form = event.target.closest('[data-form]');
  if (form) readDraft(form);
  if (event.target.id === 'library-search') {
    const caret = event.target.selectionStart;
    state.search = event.target.value;
    render({ restore: '#library-search' });
    document.querySelector('#library-search').setSelectionRange(caret, caret);
  }
});

root.addEventListener('change', event => {
  if (event.target.matches('[data-language]')) {
    state.language = event.target.value;
    queryState();
    render({ restore: '[data-language]' });
  } else if (event.target.id === 'role-select') {
    state.role = event.target.value;
    state.page = 'home';
    history.replaceState(null, '', `${location.pathname}${location.search}#home`);
    render({ focus: true, scroll: true });
  } else if (event.target.id === 'data-select') {
    const { language, direction, role, page } = state;
    state = createState(`?data=${event.target.value}&lang=${language}&direction=${direction}`);
    Object.assign(state, { role, page });
    queryState();
    render({ focus: true, scroll: true });
  } else if (event.target.id === 'fail-next') state.failNext = event.target.checked;
  else if (event.target.id === 'saved-filter') {
    state.onlySaved = event.target.checked;
    render({ restore: '#saved-filter' });
  }
});

root.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.direction) {
    state.direction = button.dataset.direction;
    queryState();
    render({ restore: `[data-direction="${state.direction}"]` });
  } else if (button.dataset.learnTab) {
    state.learnTab = button.dataset.learnTab;
    render({ restore: `[data-learn-tab="${state.learnTab}"]` });
  } else if (button.dataset.metric) {
    state.metric = button.dataset.metric;
    render({ restore: `[data-metric="${state.metric}"]` });
  } else if (button.dataset.week) {
    state.selectedWeek = Number(button.dataset.week);
    render({ restore: `[data-week="${state.selectedWeek}"]` });
  } else if (button.dataset.exerciseStep) {
    state.exerciseStep = Number(button.dataset.exerciseStep);
    render({ restore: `[data-exercise-step="${state.exerciseStep}"]` });
  } else if (button.dataset.calendar) {
    state.calendarMode = button.dataset.calendar;
    render({ restore: `[data-calendar="${state.calendarMode}"]` });
  } else if (button.dataset.attendance) {
    const number = button.dataset.attendance;
    const statuses = ['unknown', 'present', 'absent', 'excused', 'late'];
    state.attendance[number] = statuses[(statuses.indexOf(state.attendance[number] || 'unknown') + 1) % statuses.length];
    render({ restore: `[data-attendance="${number}"]` });
  } else if (button.dataset.day) openDialog('day', button.dataset.day);
  else if (button.dataset.dialog) openDialog(button.dataset.dialog);
  else if (button.dataset.action) {
    const action = button.dataset.action;
    if (action === 'save-exercise') {
      if (state.savedExercises.has(state.exercise)) state.savedExercises.delete(state.exercise);
      else state.savedExercises.add(state.exercise);
    } else if (action === 'practice') state.practiced.add(state.exercise);
    else if (action === 'read-article') state.articleRead = true;
    else if (action === 'start-program') state.programStarted = true;
    else if (action === 'finish-workout') state.workoutDone = true;
    else if (action === 'setup-back') state.setupStep = Math.max(0, state.setupStep - 1);
    else if (action === 'quiz-retry') state.quizAnswered = false;
    else if (action === 'dismiss-notice') state.notice = '';
    else if (action === 'attendance-save') state.notice = 'attendanceHint';
    else if (action === 'all-present') state.attendance = { '07': 'present', '12': 'present', '18': 'present' };
    render({ restore: `[data-action="${action}"]` });
  }
});

root.addEventListener('submit', event => {
  const form = event.target.closest('[data-form]');
  if (!form) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const kind = form.dataset.form;
  const values = new FormData(form);
  if (['training', 'match', 'reflection'].includes(kind)) {
    readDraft(form);
    const result = submitDraft(state, state.drafts[kind]);
    if (result.failed) {
      render({ restore: '[data-form] button[type="submit"]' });
      return;
    }
    location.hash = 'saved';
  } else if (kind === 'goal') {
    state.goalTarget = Number(values.get('target'));
    state.goalChosen = true;
    state.notice = 'demoOnly';
    location.hash = 'profile';
  } else if (kind === 'quiz') {
    state.quizAnswered = true;
    state.quizCorrect = Number(values.get('answer')) === 0;
    render({ focus: true });
  } else if (kind === 'onboarding') {
    state.formDrafts.onboarding = { ...state.formDrafts.onboarding, ...Object.fromEntries(values) };
    const role = values.get('setupRole');
    if (role) state.setupRole = String(role);
    const count = state.setupRole === 'coach' ? 3 : 6;
    if (state.setupStep >= count - 1) {
      state.setupStep = 0;
      state.role = state.setupRole || 'player';
      const setup = state.formDrafts.onboarding;
      if (setup.number) state.profile.number = setup.number;
      if (setup.position) state.profile.position = setup.position;
      location.hash = 'home';
    } else {
      state.setupStep++;
      render({ focus: true, scroll: true });
    }
  } else {
    if (kind === 'measurement') {
      state.measurements.push({ date: TODAY, juggles: Number(values.get('juggles')) });
      state.formDrafts.measurement = {};
    }
    if (kind === 'plan') state.plan = { title: String(values.get('title')), objectives: String(values.get('objectives')) };
    if (kind === 'checkin') {
      state.checkins = state.checkins.filter(item => item.date !== TODAY);
      state.checkins.push({ date: TODAY, mood: Number(values.get('mood')), energy: Number(values.get('energy')), note: String(values.get('note')) });
    }
    state.notice = 'saved';
    render({ focus: true, scroll: true });
  }
});

function openDialog(kind, argument = '') {
  const t = translator(state.language);
  dialogOpener = document.activeElement;
  let title = t('demoOnly');
  let content = '';
  const field = (name, label, value = '', type = 'text') => `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(value)}" required></label>`;
  if (kind === 'identity') {
    title = t('identity');
    content = `<form data-dialog-form="identity">${field('number', t('number'), state.profile.number, 'number')}<label class="field">${t('position')}<select name="position">${['GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'].map(value => `<option ${state.profile.position === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><button class="button">${t('save')}</button></form>`;
  } else if (kind === 'event') {
    title = t('addEvent');
    content = `<form data-dialog-form="event">${field('title', t('eventTitle'), t('teamTraining'))}${field('date', t('date'), argument || TODAY, 'date')}${field('time', t('eventTime'), '16:00', 'time')}${field('location', t('location'), t('homeGround'))}<button class="button">${t('save')}</button></form>`;
  } else if (kind === 'day') {
    title = dateLabel(argument, state.language);
    const events = state.events.filter(item => item.date === argument);
    content = events.length ? events.map(item => `<div><span class="tag">${t(item.status)}</span><h3 class="section">${eventTitle(item, t)}</h3><p>${item.time}${item.duration ? ` · ${item.duration} min` : ''}</p>
      ${state.role === 'player' && item.date <= TODAY && item.status !== 'logged' ? `<a class="button" href="#${item.type === 'match' ? 'match' : 'training'}" data-prefill-date="${item.date}" data-prefill-minutes="${item.duration || 60}" data-close-dialog>${t(item.type === 'match' ? 'match' : 'logTraining')}</a>` : `<p class="small muted">${t('demoOnly')}</p>`}</div>`).join('') : `<p>${t('restBody')}</p><button class="button secondary" data-next-dialog="event" data-date="${argument}">${t('addEvent')}</button>`;
  } else if (kind === 'team') {
    title = t('myTeams');
    content = `<p>${t('themeHint')}</p><form data-dialog-form="team"><label class="field">${t('myTeams')}<select name="team">${['club', 'opponent'].map(key => `<option value="${key}" ${state.profile.clubKey === key ? 'selected' : ''}>${t(key)} U13</option>`).join('')}</select></label><p class="small muted">${t('noPhoto')}</p><button class="button">${t('save')}</button></form>${link('surface/portal', t('more'))}`;
  } else if (kind === 'drill') {
    title = t('addDrill');
    content = `<form data-dialog-form="drill"><label class="field">${t('exercises')}<select name="exercise">${EXERCISES.map(item => `<option value="${item.id}">${t(item.name)}</option>`).join('')}</select></label><button class="button">${t('addDrill')}</button></form>`;
  } else if (kind === 'mentee') {
    title = t('selectPlayer');
    content = `<p>${t('mentorPrivacy')}</p><form data-dialog-form="mentee"><label class="field">${t('mentee')}<select><option>${t('playerName')}</option></select></label><button class="button">${t('close')}</button></form>${link('surface/mentor-link', t('linkTreatment'))}`;
  } else if (kind === 'reset') {
    title = t('reset');
    content = `<p>${t('synthetic')}</p><p>${t('saveHint')}</p><form data-dialog-form="reset"><button class="button">${t('reset')}</button></form>`;
  } else if (kind === 'review') {
    title = t('viewOptions');
    content = `<form data-dialog-form="review"><label class="field">${t('role')}<select name="role">${['player', 'coach', 'mentor'].map(role => `<option value="${role}" ${state.role === role ? 'selected' : ''}>${t(role)}</option>`).join('')}</select></label><label class="field">${t('data')}<select name="data"><option value="populated" ${!state.sparse ? 'selected' : ''}>${t('populated')}</option><option value="sparse" ${state.sparse ? 'selected' : ''}>${t('sparse')}</option></select></label><label class="check"><input type="checkbox" name="fail" ${state.failNext ? 'checked' : ''}>${t('fail')}</label><button class="button">${t('apply')}</button></form>${link('coverage', t('coverage'))}<p class="small muted">${t('synthetic')}</p>`;
  }
  dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button class="dialog-close" aria-label="${t('close')}" data-close-dialog>×</button></div>${content}`;
  if (!dialog.open) dialog.showModal();
}

dialog.addEventListener('click', event => {
  const prefill = event.target.closest('[data-prefill-date]');
  if (prefill) {
    const kind = prefill.hash.slice(1);
    state.drafts[kind] = { ...freshDraft(kind), date: prefill.dataset.prefillDate, durationMinutes: prefill.dataset.prefillMinutes };
  }
  if (event.target.closest('[data-close-dialog]') || event.target.closest('a')) dialog.close();
  const next = event.target.closest('[data-next-dialog]');
  if (next) openDialog(next.dataset.nextDialog, next.dataset.date || '');
});
dialog.addEventListener('close', () => { if (dialogOpener?.isConnected) dialogOpener.focus(); });
dialog.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const kind = form.dataset.dialogForm;
  if (kind === 'identity') {
    state.profile.number = String(data.get('number'));
    state.profile.position = String(data.get('position')).toUpperCase();
  } else if (kind === 'event') {
    state.events.push({ id: crypto.randomUUID(), date: String(data.get('date')), time: String(data.get('time')), titleText: String(data.get('title')), type: 'training', duration: 60, status: 'planned' });
  } else if (kind === 'drill') {
    const id = String(data.get('exercise'));
    if (!state.planDrills.includes(id)) state.planDrills.push(id);
  } else if (kind === 'team') {
    state.profile.clubKey = String(data.get('team'));
  } else if (kind === 'reset') {
    const { direction, language } = state;
    state = createState(`?direction=${direction}&lang=${language}`);
    history.replaceState(null, '', `${location.pathname}?direction=${direction}&lang=${language}#home`);
  } else if (kind === 'review') {
    const role = String(data.get('role'));
    const sparse = data.get('data') === 'sparse';
    const { direction, language } = state;
    if (sparse !== state.sparse) state = createState(`?direction=${direction}&lang=${language}&data=${sparse ? 'sparse' : 'populated'}`);
    if (role !== state.role) state.page = 'home';
    state.role = role;
    state.failNext = data.has('fail');
    queryState();
    history.replaceState(null, '', `${location.pathname}${location.search}#${state.page}`);
  }
  dialog.close();
  render({ focus: true, scroll: kind === 'reset' });
});

window.addEventListener('hashchange', navigate);
state.page = currentRoute();
navigate();
