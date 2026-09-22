import { chartSeries, EXERCISES, recentSummary, TODAY } from './model.mjs';
import { esc, icon, tactic, dateLabel, link, eventTitle, weekdays } from './graphics.mjs';

export function head(t, title, intro, tools = '') {
  return `<header class="page-head"><div class="heading-block"><h1 tabindex="-1" id="page-title">${t(title)}</h1>${intro ? `<p>${t(intro)}</p>` : ''}</div>${tools ? `<div class="page-tools">${tools}</div>` : ''}</header>`;
}

export function weekboard(state, t) {
  return `<div class="week-frame"><div class="weekboard" aria-label="${t('thisWeek')}">${weekdays(state.language).map((day, index) => {
    const date = `2026-09-${21 + index}`;
    const event = state.events.find(item => item.date === date);
    return `<button class="week-day ${date === TODAY ? 'today' : ''}" data-day="${date}" aria-label="${day} ${21 + index}: ${event ? `${eventTitle(event, t)}, ${event.time}, ${t(event.status)}` : t('rest')}">
      <small><span class="weekday-long">${day}</span><span class="weekday-short">${state.language === 'lv' ? ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv'][index] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span></small><strong>${21 + index}</strong>${event ? '<span class="event-dot" aria-hidden="true"></span>' : ''}
      <span class="day-kind">${event ? eventTitle(event, t) : t('rest')}</span>
      <span class="day-status">${event ? `${event.time} · ${t(event.status)}` : '—'}</span></button>`;
  }).join('')}</div></div>`;
}

export function recordRows(state, t, limit = 6) {
  const entries = [...state.trainings, ...state.matches, ...state.diary].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  if (!entries.length) return `<div class="empty"><h2>${t('noEntries')}</h2><p>${t('noEntriesBody')}</p>${link('training', t('addEntry'), 'button')}</div>`;
  return `<ul class="list">${entries.map(entry => `<li class="record-row">
    <time datetime="${entry.date}">${dateLabel(entry.date, state.language)}</time>
    <a href="#entry/${entry.id}"><strong>${entry.kind === 'training' ? t(entry.type === 'team' ? 'teamTraining' : entry.type) : entry.kind === 'match' ? t('match') : t('reflection')}</strong>
    <small>${entry.kind === 'match' ? opponent(entry, t) : entry.kind === 'training' ? entry.focusAreas.map(key => t(key)).join(' · ') : t('diaryPrompt')}</small></a>
    <span class="result">${entry.kind === 'match' ? `${entry.scoreUs}–${entry.scoreThem}` : entry.kind === 'training' ? `${entry.durationMinutes}<small>min</small>` : '↗'}</span>
  </li>`).join('')}</ul>`;
}

export function opponent(entry, t) {
  return ['opponent', 'opponentTwo'].includes(entry.opponent) ? t(entry.opponent) : esc(entry.opponent);
}

export function scoreline(state, t, entry = state.matches.at(-1)) {
  if (!entry) return `<div class="empty"><h3>${t('noEntries')}</h3>${link('match', t('match'), 'button secondary')}</div>`;
  return `<div class="scoreline"><span class="team">${t('club')}</span><strong class="score">${entry.scoreUs} : ${entry.scoreThem}</strong><span class="team">${opponent(entry, t)}</span></div>`;
}

function sessionAction(state, t) {
  const logged = state.events.find(event => event.id === 'tue')?.status === 'logged' || state.trainings.some(entry => entry.date === TODAY);
  return `<span class="eyebrow">${t(logged ? 'logged' : 'today')}</span><h2>${t(logged ? 'todayLogged' : 'completeTraining')}</h2>
    <p>${state.sparse ? t('noEntriesBody') : t('sessionSub')}</p>
    ${link(logged ? 'progress' : 'training', t(logged ? 'seeEntry' : 'logTraining'), 'button')}`;
}

function miniEffort(state, t) {
  const values = chartSeries(state).map(week => week.minutes);
  const summary = recentSummary(state);
  return `<div class="mini-effort"><div><span class="eyebrow">${t('lastSeven')}</span><div class="mini-stat"><strong>${summary.minutes}</strong><span>min · ${summary.sessions} ${t('sessions')}</span></div>${link('progress', t('viewProgress'))}</div>
    ${!state.sparse ? `<div class="mini-history"><div class="mini-bars" role="img" aria-label="${t('sixWeeks')} · ${t('trainingTime')}: ${values.join(', ')} min">${values.map(value => `<span style="--height:${value / Math.max(...values)}"></span>`).join('')}</div><small>${t('sixWeeks')}</small></div>` : ''}</div>`;
}

export function home(state, t) {
  if (state.direction === 'a') {
    return `${head(t, 'weekTitle', 'weekIntro')}<div class="week-heading"><span>${t('period')}</span>${link('schedule', t('schedule'))}</div>
      ${weekboard(state, t)}
      <div class="a-home-focus">
        <section class="session-board"><div class="session-stamp">22<small>SEP</small></div><div>${sessionAction(state, t)}</div></section>
        <section class="practice-board"><div><span class="eyebrow">${t('practiceFocus')}</span><h2>${t('firstTouch')}</h2>${link('exercise', t('openPractice'))}</div>${tactic('touch')}</section>
      </div>
      <div class="a-match-strip"><section class="match-strip"><div class="section-label"><span class="eyebrow">${t('lastMatch')}</span>${link(state.matches.length ? 'match-detail' : 'match', t('matchReview'))}</div>${scoreline(state, t)}</section>${miniEffort(state, t)}</div>
      ${homeBottom(t)}`;
  }
  return `${head(t, 'journalTitle', 'journalIntro')}
    <div class="b-home-spread"><div class="b-main-story"><div class="date-column"><strong>22</strong><span>SEP<br>2026</span></div><div>
      <section class="b-match-board"><span class="eyebrow">${t('lastMatch')}</span>${scoreline(state, t)}<p class="muted">${state.matches.length ? t('matchMeta') : t('noEntriesBody')}</p>${link(state.matches.length ? 'match-detail' : 'match', t('matchReview'))}</section>
      <section class="b-session-note">${sessionAction(state, t)}</section>
      <section class="b-practice-link">${tactic('touch')}<div><span class="eyebrow">${t('practiceFocus')}</span><h3>${t('firstTouch')}</h3>${link('exercise', t('openPractice'))}</div></section>
    </div></div><aside class="b-agenda"><h2>${t('thisWeek')}</h2>${agenda(state, t)}${link('schedule', t('schedule'))}${miniEffort(state, t)}</aside></div>
    ${homeBottom(t)}`;
}

function homeBottom(t) {
  return `<section class="quiet-strip section"><div><h3>${t('restTitle')}</h3><p>${t('restBody')}</p></div>${link('schedule', t('schedule'))}</section>
    <section class="section"><div class="section-label"><h2>${t('quickLinks')}</h2>${link('coverage', t('more'))}</div>
      <div class="links-grid">${link('checkin', t('checkin'), '')}${link('quiz', t('quiz'), '')}${link('surface/announcements-feed', t('announcements'), '')}${link('surface/advice', t('coachAdvice'), '')}</div></section>`;
}

export function agenda(state, t) {
  if (!state.events.length) return `<p class="muted">${t('noSchedule')}</p>`;
  return state.events.filter(event => event.date >= TODAY).map(event => `<div class="fixture-row">
    <strong>${dateLabel(event.date, state.language)}</strong><div><strong>${eventTitle(event, t)}</strong><p class="small muted">${event.time} · ${t(event.status)}</p></div>
    <button class="text-link" data-day="${event.date}">${t('open')}</button>
  </div>`).join('');
}

function logTools(t) {
  return ['training', 'match', 'reflection'].map(kind => `<a class="log-tool" href="#${kind}">${icon(kind === 'training' ? 'log' : kind)}<div><h2>${t(kind)}</h2><p>${t(`${kind}Hint`)}</p></div></a>`).join('');
}

export function log(state, t) {
  const title = head(t, 'recordTitle', 'recordIntro', link('tournament', t('tournament'), 'button secondary'));
  if (state.direction === 'a') return `${title}<div class="a-log-layout"><section aria-label="${t('newEntry')}">${logTools(t)}${link('surface/skip', t('restTitle'))}</section>
    <section><div class="section-label"><h2>${t('recent')}</h2></div>${recordRows(state, t, 6)}</section></div>`;
  return `${title}<section class="b-log-tools" aria-label="${t('newEntry')}">${logTools(t)}</section>
    <div class="b-main-story"><div class="date-column"><strong class="month-word">SEP</strong><span>2026</span></div><section><h2>${t('recent')}</h2>${recordRows(state, t, 6)}</section></div>`;
}

function metricTabs(state, t) {
  return `<div class="subnav" aria-label="${t('progress')}">${[['minutes', 'trainingTime'], ['sessions', 'sessionCount'], ['matches', 'matchCount']].map(([value, label]) => `<button data-metric="${value}" aria-pressed="${state.metric === value}">${t(label)}</button>`).join('')}</div>`;
}

export function chart(state, t, trace = false) {
  const series = chartSeries(state);
  const values = series.map(week => week[state.metric]);
  const max = Math.max(...values, 1);
  if (values.filter(value => value > 0).length < 2) return `<div class="empty"><h2>${t('noTrend')}</h2><p>${t('noTrendBody')}</p>${link('training', t('logTraining'), 'button')}</div>`;
  if (!trace) return `<div class="bar-chart" aria-label="${t('sixWeeks')}">${series.map((week, i) => `<button class="bar-column" data-week="${i}" aria-pressed="${state.selectedWeek === i}" style="--height:${values[i] / max}">
      <span class="value">${values[i]}</span><span class="bar" aria-hidden="true"></span><span class="axis">${dateLabel(week.date, state.language, true)}</span></button>`).join('')}</div>`;
  const coordinates = values.map((value, i) => [40 + i * 110, 214 - value / max * 172]);
  return `<svg class="trace-chart" viewBox="0 0 630 250" role="img" aria-label="${t('trainingTime')}: ${values.join(', ')}">
    <g stroke="#536780" stroke-width="1"><path d="M40 42h550M40 128h550M40 214h550" stroke-dasharray="3 6"/></g>
    <polyline points="${coordinates.map(point => point.join(',')).join(' ')}" fill="none" stroke="#ff9b7b" stroke-width="4" stroke-linejoin="round"/>
    ${coordinates.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${state.selectedWeek === i ? 8 : 5}" fill="${state.selectedWeek === i ? '#ff9b7b' : '#fff'}" stroke="#14243b" stroke-width="2"/>`).join('')}
  </svg><div class="chart-points">${series.map((week, i) => `<button data-week="${i}" aria-pressed="${state.selectedWeek === i}"><strong>${values[i]}</strong><small>${dateLabel(week.date, state.language, true)}</small></button>`).join('')}</div>`;
}

function chartDetail(state, t) {
  const selected = chartSeries(state)[state.selectedWeek];
  return `<div class="chart-note" aria-live="polite"><div><strong>${t('weekDetails')} · ${dateLabel(selected.date, state.language)}</strong><p>${t('sessionCount')}: ${selected.sessions} · ${selected.minutes} min · ${t('matchCount')}: ${selected.matches}</p></div></div>`;
}

function focusRows(state, t) {
  const counts = ['technical', 'tactical', 'physical', 'mental'].map(key => ({ key, count: state.trainings.filter(entry => entry.focusAreas.includes(key)).length }));
  const max = Math.max(...counts.map(item => item.count), 1);
  return counts.map(item => `<div class="focus-row"><span>${t(item.key)}</span><div class="track"><span style="width:${item.count / max * 100}%"></span></div><strong>${item.count}</strong></div>`).join('');
}

export function progress(state, t) {
  const header = head(t, 'progressTitle', 'progressIntro');
  const graph = `${metricTabs(state, t)}${chart(state, t, state.direction === 'b')}${chartDetail(state, t)}<p class="small muted section">${t('chartHelp')}</p>`;
  const focus = `<h2>${t('focusDistribution')}</h2><p class="small muted">${t('focusExplain')}</p>${focusRows(state, t)}`;
  const total = chartSeries(state).reduce((sum, week) => sum + week[state.metric], 0);
  const period = total ? `<aside class="period-total"><span class="eyebrow">${t('periodTotal')}</span><strong>${total}</strong><span>${t(state.metric === 'minutes' ? 'minutes' : state.metric === 'sessions' ? 'sessionCount' : 'matchCount')}</span><div class="period-rule" aria-hidden="true"></div><p class="small muted">${dateLabel(chartSeries(state)[0].date, state.language)} – ${dateLabel(TODAY, state.language)}</p></aside>` : '';
  return state.direction === 'a'
    ? `${header}<section class="progress-sheet">${period}<div class="progress-plot">${graph}</div></section><div class="split section"><section>${focus}</section><section><h2>${t('matchesHeading')}</h2>${scoreline(state, t)}${link(state.matches.length ? 'match-detail' : 'match', t('matchReview'))}</section></div>${progressLinks(t)}`
    : `${header}<div class="b-progress-layout"><section class="b-chart dark"><span class="eyebrow">${t('sixWeeks')}</span>${graph}</section><aside>${focus}<hr class="rule">${link('measurements', t('recordedMeasure'))}</aside></div><section class="section"><h2>${t('matchesHeading')}</h2>${recordRows({ ...state, trainings: [], diary: [] }, t, 2)}</section>${progressLinks(t)}`;
}

function progressLinks(t) {
  return `<div class="links-grid section">${link('measurements', t('measurements'), '')}${link('surface/evaluations', t('evaluations'), '')}${link('surface/skills', t('skills'), '')}${link('surface/challenges', t('teamChallenge'), '')}</div><p class="small muted section">${t('xpMeaning')}</p>`;
}

function exerciseTile(exercise, state, t) {
  return `<article class="catalogue-item">${tactic(exercise.drawing)}<div><span class="eyebrow">${t(exercise.category)} / ${exercise.duration} MIN</span><h3>${t(exercise.name)}</h3><p class="small muted">${t(exercise.equipment)}</p>
    <a class="text-link" href="#exercise/${exercise.id}">${t('openPractice')}</a></div></article>`;
}

export function learn(state, t) {
  const tabs = `<div class="subnav">${['exercises', 'articles', 'programs'].map(tab => `<button data-learn-tab="${tab}" aria-pressed="${state.learnTab === tab}">${t(tab)}</button>`).join('')}</div>`;
  const header = head(t, 'learnTitle', 'learnIntro');
  if (state.learnTab === 'articles') return `${header}${tabs}<div class="split"><section class="panel reading"><span class="eyebrow">${t('tactical')} / 3 MIN</span><h2>${t('articleTitle')}</h2><p>${t('articleBody')}</p>${link('article', t('open'), 'button')}</section>${tactic('pass')}</div>`;
  if (state.learnTab === 'programs') return `${header}${tabs}<div class="split"><section class="panel"><span class="eyebrow">${t('programInfo')}</span><h2>${t('programTitle')}</h2><p>${t('programBody')}</p>${link('program', t('open'), 'button')}</section>${tactic('turn')}</div>`;
  const filtered = EXERCISES.filter(exercise => `${t(exercise.name)} ${t(exercise.category)}`.toLocaleLowerCase().includes(state.search.toLocaleLowerCase()) && (!state.onlySaved || state.savedExercises.has(exercise.id)));
  const filters = `<label class="search-field">${t('search')}<input id="library-search" type="search" value="${esc(state.search)}"></label><label class="check section"><input type="checkbox" id="saved-filter" ${state.onlySaved ? 'checked' : ''}>${t('savedExercises')}</label>`;
  if (state.direction === 'a') return `${header}<div class="a-learning-layout"><aside class="learning-filters">${tabs}${filters}</aside>
    <section><div class="three">${filtered.map(exercise => exerciseTile(exercise, state, t)).join('')}</div>${!filtered.length ? `<p class="empty">${t('emptySearch')}</p>` : ''}<p class="small muted section">${t('libraryChoice')}</p><div class="links-grid section">${link('surface/submit-drill', t('createDrill'), '')}${link('surface/challenges', t('teamChallenge'), '')}</div></section></div>`;
  return `${header}${tabs}<section class="b-learning-feature">${tactic('touch')}<div><span class="eyebrow">${t('practiceFocus')}</span><h2>${t('firstTouch')}</h2><p>${t('focusBody')}</p>${link('exercise/first-touch', t('openPractice'), 'button')}<p class="small muted section">${t('libraryChoice')}</p></div></section>
    <div class="page-tools section">${filters}</div><div class="b-library-list section">${filtered.map(exercise => exerciseTile(exercise, state, t)).join('')}</div>${!filtered.length ? `<p class="empty">${t('emptySearch')}</p>` : ''}${link('surface/submit-drill', t('createDrill'))}`;
}

function profileDetails(state, t) {
  return `<dl class="detail-list"><div><dt>${t('position')}</dt><dd>${esc(state.profile.position)}</dd></div><div><dt>${t('foot')}</dt><dd>${t('rightFoot')}</dd></div><div><dt>${t('myTeams')}</dt><dd>${t(state.profile.clubKey)} U13</dd></div></dl>`;
}

function goalCard(state, t) {
  if (!state.goalChosen) return `<section><span class="eyebrow">${t('goalsTitle')}</span><h2>${t('noGoal')}</h2><p>${t('goalMeaning')}</p>${link('goals', t('chooseGoal'), 'button secondary')}</section>`;
  const count = state.trainings.filter(entry => entry.date.startsWith('2026-09')).length;
  return `<section><span class="eyebrow">${t('goalsTitle')}</span><h2>${state.goalTarget === 8 ? t('goalExample') : `${state.goalTarget} ${t('sessions')}`}</h2>
    <p>${count} / ${state.goalTarget} ${t('sessions')}</p><div class="track"><span style="width:${Math.min(count / state.goalTarget, 1) * 100}%"></span></div>
    <p class="small muted section">${t('goalMeaning')}</p>${link('goals', t('editGoal'))}</section>`;
}

export function profile(state, t) {
  const actions = `<div class="links-grid section">${link('teams', t('myTeams'), '')}${link('measurements', t('measurements'), '')}${link('surface/achievements', t('achievements'), '')}${link('surface/export', t('export'), '')}${link('surface/friends', t('friends'), '')}${link('surface/photo', t('photo'), '')}${link('settings', t('settings'), '')}${link('onboarding', t('onboarding'), '')}</div>`;
  if (state.direction === 'a') return `${head(t, 'profileTitle', null)}<div class="profile-subhead"><p>${t('profileIntro')}</p>${link('settings', t('settings'))}</div>
    <div class="profile-grid"><section class="a-passport dark"><span class="eyebrow">${t('academy')} / U13</span><div class="profile-number">${esc(state.profile.number)}</div><span class="position-chip">${esc(state.profile.position)}</span><h2>${t('playerName')}</h2><p>${t(state.profile.clubKey)}</p>${profileDetails(state, t)}<button class="button light" data-dialog="identity">${t('editIdentity')}</button></section>
    <section>${goalCard(state, t)}${actions}</section></div>`;
  return `${head(t, 'profileTitle', 'profileIntro')}
    <section class="b-dossier-head"><div class="profile-number">${esc(state.profile.number)}</div><div><span class="eyebrow">${t('academy')} / U13</span><h2>${t('playerName')}</h2><p>${t(state.profile.clubKey)} · ${esc(state.profile.position)}</p><button class="text-link" data-dialog="identity">${t('editIdentity')}</button></div>${tactic('position', 0, state.profile.position)}</section>
    <div class="split section"><section><h2>${t('identity')}</h2>${profileDetails(state, t)}${actions}</section>${goalCard(state, t)}</div>`;
}

export const mainViews = { home, log, progress, learn, profile };
