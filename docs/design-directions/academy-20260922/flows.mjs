import { EXERCISES, freshDraft, TODAY, recentSummary } from './model.mjs';
import { esc, link, tactic, dateLabel, weekdays } from './graphics.mjs';
import { head, weekboard, agenda, scoreline, recordRows } from './views.mjs';
import { inventory, declaredButUnrenderedRoutes } from './inventory.mjs';

const field = (name, label, value, type = 'text', attributes = '') => `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${attributes}></label>`;
const textarea = (name, label, value = '', attributes = '') => `<label class="field">${label}<textarea name="${name}" rows="3" ${attributes}>${esc(value)}</textarea></label>`;
const select = (name, label, options, value) => `<label class="field">${label}<select name="${name}">${options.map(([key, text]) => `<option value="${key}" ${String(value) === String(key) ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;

export function logForm(kind, state, t) {
  const draft = state.drafts[kind] ??= freshDraft(kind);
  const labels = state.language === 'lv'
    ? [['team', 'Komanda'], ['individual', 'Individuāls'], ['technical', 'Tehnika'], ['tactical', 'Taktika'], ['physical', 'Fiziskais'], ['gym', 'Zāle'], ['recovery', 'Atjaunošanās'], ['futsal', 'Telpu futbols']]
    : [['team', 'Team'], ['individual', 'Individual'], ['technical', 'Technical'], ['tactical', 'Tactical'], ['physical', 'Physical'], ['gym', 'Gym'], ['recovery', 'Recovery'], ['futsal', 'Futsal']];
  const ratings = [1, 2, 3, 4, 5].map(n => [n, `${n} / 5`]);
  let fields = field('date', t('date'), draft.date, 'date', `required max="${TODAY}"`);
  if (kind === 'training') fields += `
    <div class="field-pair">${select('type', t('trainingType'), labels, draft.type)}${field('durationMinutes', t('duration'), draft.durationMinutes, 'number', 'required min="1" step="1"')}</div>
    <div class="field-pair">${select('energy', t('energy'), ratings, draft.energy)}${select('mood', t('mood'), ratings, draft.mood)}</div>
    <details ${draft.notes ? 'open' : ''}><summary>${t('optional')}</summary><fieldset><legend>${t('focus')}</legend><div class="checks">${['technical', 'physical', 'tactical', 'mental'].map(key => `<label class="check"><input type="checkbox" name="focusAreas" value="${key}" ${draft.focusAreas.includes(key) ? 'checked' : ''}>${t(key)}</label>`).join('')}</div></fieldset>${textarea('notes', t('notes'), draft.notes)}</details>`;
  if (kind === 'match') fields += `
    ${field('opponent', t('them'), draft.opponent || t('opponent'), 'text', 'required')}
    <div class="field-pair">${field('scoreUs', t('us'), draft.scoreUs, 'number', 'required min="0" step="1"')}${field('scoreThem', t('them'), draft.scoreThem, 'number', 'required min="0" step="1"')}</div>
    <div class="field-pair">${field('minutesPlayed', t('played'), draft.minutesPlayed, 'number', 'required min="0" step="1"')}${field('selfRating', t('rating'), draft.selfRating, 'number', 'required min="1" max="10" step="1"')}</div>
    <div class="field-pair">${field('goals', t('goals'), draft.goals, 'number', 'min="0" step="1"')}${field('assists', t('assist'), draft.assists, 'number', 'min="0" step="1"')}</div>
    <details><summary>${t('optional')}</summary>${textarea('bestMoment', t('bestMoment'), draft.bestMoment)}${textarea('toImprove', t('toImprove'), draft.toImprove)}${select('mood', t('mood'), ratings, draft.mood)}</details>`;
  if (kind === 'reflection') fields += `<p class="small muted">${t('diaryPrivacy')}</p>${textarea('text', t('thought'), draft.text, 'required')}${select('mood', t('mood'), ratings, draft.mood)}
    <label class="check"><input type="checkbox" name="aiConsent" ${draft.aiConsent ? 'checked' : ''}>${t('consent')}</label>`;
  return `${link('log', t('back'))}${head(t, `${kind}Title`, kind === 'reflection' ? 'diaryPrompt' : 'recordIntro')}
    <div class="form-layout"><form class="entry-form" data-form="${kind}">${fields}
      ${state.failure ? `<p class="error" role="alert">${t('error')}</p>` : ''}
      <button class="button" type="submit">${t(state.failure ? 'retry' : 'save')}</button><p class="small muted section">${t('saveHint')}</p></form>
      <aside class="entry-aside">${tactic(kind === 'match' ? 'position' : 'touch')}<span class="eyebrow">${t('restTitle')}</span><p>${t('restBody')}</p><hr class="rule"><p class="small muted">${t('xpMeaning')}</p></aside></div>`;
}

export function saved(state, t) {
  const summary = recentSummary(state);
  return `${head(t, 'saved', 'savedBody')}<div class="split"><section class="panel"><span class="eyebrow">${t('lastSeven')}</span>
    <div class="mini-stat"><strong>${summary.minutes}</strong><span>min / ${summary.sessions} ${t('sessions')}</span></div><p class="section">${t('xpMeaning')}</p>
    <div class="actions">${link('progress', t('viewProgress'), 'button')}${link('home', t('finish'), 'button secondary')}</div></section>
    <section><h2>${t('recent')}</h2>${recordRows(state, t, 3)}</section></div>`;
}

export function entryView(state, t, id) {
  const entry = [...state.trainings, ...state.matches, ...state.diary].find(item => item.id === id);
  if (!entry) return head(t, 'missing', 'demoOnly');
  if (entry.kind === 'match') return matchDetail(state, t, entry);
  return `${link('log', t('back'))}${head(t, entry.kind === 'training' ? 'trainingTitle' : 'reflectionTitle', 'demoOnly')}
    <section class="panel reading"><span class="eyebrow">${dateLabel(entry.date, state.language)}</span>
      <h2>${entry.kind === 'training' ? `${entry.durationMinutes} min` : t('thought')}</h2>
      <p>${esc(entry.notes || entry.text || t('restBody'))}</p>${link('progress', t('viewProgress'))}</section>`;
}

export function matchDetail(state, t, entry = state.matches.at(-1)) {
  return `${link('progress', t('back'))}${head(t, 'matchReview', 'demoOnly')}
    <div class="split"><section class="panel">${scoreline(state, t, entry)}<hr class="rule"><p class="muted">${entry ? dateLabel(entry.date, state.language) : ''}</p>
    ${entry ? `<dl class="detail-list"><div><dt>${t('played')}</dt><dd>${entry.minutesPlayed}</dd></div><div><dt>${t('assist')}</dt><dd>${entry.assists}</dd></div><div><dt>${t('rating')}</dt><dd>${entry.selfRating} / 10</dd></div></dl>` : ''}</section>
    <section><h2>${t('bestMoment')}</h2><p>${esc(entry?.bestMoment || t('matchMoment'))}</p><hr class="rule"><h2>${t('toImprove')}</h2><p>${esc(entry?.toImprove || t('matchImprove'))}</p>${link('reflection', t('reflection'), 'button secondary')}</section></div>`;
}

export function exercise(state, t) {
  const data = EXERCISES.find(item => item.id === state.exercise) ?? EXERCISES[0];
  const done = state.practiced.has(data.id);
  return `${link('learn', t('back'))}${head(t, data.name, 'focusBody')}
    <div class="split"><section>${tactic(data.drawing, state.exerciseStep || 0)}<div class="actions section"><span class="tag">${data.duration} min</span><span class="tag">${t(data.category)}</span><span class="tag">${t(data.equipment)}</span></div>
    <p class="small muted section">${t('videoNote')}</p></section>
    <section><span class="eyebrow">${t('exerciseDetail')}</span><h2>${t('steps')}</h2>
      <ol class="step-list">${data.steps.map((key, index) => `<li><button data-exercise-step="${index + 1}" aria-pressed="${state.exerciseStep === index + 1}"><span class="step-number">${index + 1}</span><span>${t(key)}</span></button></li>`).join('')}</ol>
      <p class="small muted">${t('stepHelp')}</p><div class="actions"><button class="button" data-action="practice" ${done ? 'disabled' : ''}>${t(done ? 'practiced' : 'markDone')}</button>
      <button class="button secondary" data-action="save-exercise" aria-pressed="${state.savedExercises.has(data.id)}">${t(state.savedExercises.has(data.id) ? 'removeSaved' : 'saveExercise')}</button></div><p class="small muted section">${t('demoOnly')}</p></section></div>`;
}

export function schedule(state, t) {
  let calendar = weekboard(state, t);
  if (state.calendarMode === 'month') calendar = `<div class="table-wrap"><div class="month-grid">${weekdays(state.language).map(day => `<span class="month-weekday">${day}</span>`).join('')}<span class="month-blank"></span>${Array.from({ length: 30 }, (_, i) => {
    const date = `2026-09-${String(i + 1).padStart(2, '0')}`;
    const event = state.events.find(item => item.date === date);
    return `<button class="${date === TODAY ? 'today' : ''}" data-day="${date}"><strong>${i + 1}</strong>${event ? `<small>${event.time}</small>` : ''}</button>`;
  }).join('')}${'<span class="month-blank"></span>'.repeat(4)}</div></div>`;
  const tabs = `<div class="subnav"><button data-calendar="week" aria-pressed="${state.calendarMode !== 'month'}">${t('week')}</button><button data-calendar="month" aria-pressed="${state.calendarMode === 'month'}">${t('month')}</button></div>`;
  const tools = `<button class="button" data-dialog="event">${t('addEvent')}</button>`;
  return `${head(t, 'scheduleTitle', 'scheduleIntro', tools)}${tabs}<p class="eyebrow">${t(state.calendarMode === 'month' ? 'monthTitle' : 'period')}</p>
    ${state.direction === 'a' || state.calendarMode === 'month' ? calendar : `<div class="split"><div>${agenda(state, t)}</div><aside>${weekboard(state, t)}</aside></div>`}
    ${state.direction === 'a' ? `<section class="section"><h2>${t('tomorrow')}</h2>${agenda(state, t)}</section>` : ''}
    <div class="links-grid section">${link('surface/recurring', t('recurring'), '')}${link('tournament', t('tournament'), '')}${link('surface/tournament-import', t('importTournament'), '')}${link('surface/portal', t('more'), '')}</div>`;
}

export function tournament(state, t) {
  return `${link('schedule', t('back'))}${head(t, 'tournamentTitle', 'tournamentIntro', `<span class="tag coral">${t('ageClass')}</span>`)}
    <div class="split"><section class="panel"><span class="eyebrow">26–27 SEP / 2026</span><h2>${t('fixtures')}</h2>
      <div class="fixture-row"><strong>10:00</strong><div><strong>${t('club')} – ${t('opponent')}</strong><p class="small muted">${t('matchOne')} · 2 × 20 min</p></div>${link('match', t('match'), 'text-link')}</div>
      <div class="fixture-row"><strong>13:30</strong><div><strong>${t('club')} – ${t('opponentTwo')}</strong><p class="small muted">${t('matchTwo')} · 2 × 20 min</p></div>${link('match', t('match'), 'text-link')}</div>
      ${link('surface/tournament-import', t('importTournament'), 'button secondary')}</section>
    <section><h2>${t('standings')}</h2><p>${t('tournamentIntro')}</p>${link('reflection', t('reflection'), 'button')}<hr class="rule">${tactic('position')}</section></div>`;
}

export function settings(state, t) {
  return `${link('profile', t('back'))}${head(t, 'settings', 'settingsNote')}
    <div class="split"><section class="panel"><h2>${t('preference')}</h2><label class="field">${t('language')}<select data-language><option value="lv" ${state.language === 'lv' ? 'selected' : ''}>Latviešu</option><option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option></select></label>
      <h3>${t('theme')}</h3><p>${t('themeName')}</p><p class="small muted">${t('themeHint')}</p>${link('teams', t('myTeams'))}</section>
    <section><h2>${t('account')}</h2><div class="links-grid">${link('onboarding', t('onboarding'), '')}${link('surface/auth', t('account'), '')}${link('surface/photo', t('photo'), '')}${link('surface/export', t('export'), '')}${link('surface/feedback', t('support'), '')}${link('coverage', t('coverage'), '')}</div>
    <button class="button secondary section" data-dialog="reset">${t('reset')}</button></section></div>`;
}

export function learnDetail(state, t, route) {
  if (route === 'article') return `${link('learn', t('back'))}${head(t, 'articleTitle', 'demoOnly')}<div class="split"><article class="reading"><p>${t('articleBody')}</p><p>${t('focusBody')}</p><button class="button" data-action="read-article" ${state.articleRead ? 'disabled' : ''}>${t(state.articleRead ? 'readDone' : 'markRead')}</button></article>${tactic('pass')}</div>`;
  if (route === 'program-workout') return `${link('program', t('back'))}${head(t, 'workout', 'programInfo')}<div class="split"><section class="panel"><h2>${t('firstTouch')}</h2><p>${t('stepHelp')}</p><ol class="step-list">${['stepOne', 'stepTwo', 'stepThree'].map((key, index) => `<li><label class="check"><input type="checkbox"> ${index + 1}. ${t(key)}</label></li>`).join('')}</ol><button class="button" data-action="finish-workout" ${state.workoutDone ? 'disabled' : ''}>${t(state.workoutDone ? 'practiced' : 'finishWorkout')}</button></section>${tactic('touch')}</div>`;
  return `${link('learn', t('back'))}${head(t, 'programTitle', 'programInfo')}<div class="split"><section class="panel"><h2>${t('steps')}</h2><p>${t('programBody')}</p>
    <div class="onboarding-steps">${[1, 2, 3, 4].map(n => `<span class="tag ${n === 1 ? 'coral' : ''}">${t('week')} ${n}</span>`).join('')}</div>
    ${state.programStarted ? link('program-workout', t('workout'), 'button') : `<button class="button" data-action="start-program">${t('startProgram')}</button>`}</section>${tactic('turn')}</div>`;
}

export function onboarding(state, t) {
  const draft = state.formDrafts.onboarding || {};
  const steps = state.setupRole === 'coach' ? ['roleStep', 'basicsStep', 'doneStep'] : ['roleStep', 'basicsStep', 'footballStep', 'physicalStep', 'assessmentStep', 'doneStep'];
  const step = steps[Math.min(state.setupStep, steps.length - 1)];
  let content = '';
  if (step === 'roleStep') content = select('setupRole', t('role'), [['player', t('player')], ['coach', t('coach')], ['mentor', t('mentor')]], state.setupRole || 'player');
  if (step === 'basicsStep') content = `${field('name', t('name'), draft.name ?? t('playerName'))}<div class="field-pair">${field('country', t('country'), draft.country ?? 'LV')}${field('city', t('city'), draft.city ?? (state.language === 'lv' ? 'Piemēra pilsēta' : 'Example town'))}</div>`;
  if (step === 'footballStep') content = `<div class="field-pair">${field('number', t('number'), draft.number ?? state.profile.number, 'number', 'min="1" max="99"')}${select('position', t('position'), [['GK', 'GK'], ['CB', 'CB'], ['CM', 'CM'], ['CAM', 'CAM'], ['ST', 'ST']], draft.position ?? state.profile.position)}</div>${link('teams', t('myTeams'), 'button secondary')}`;
  if (step === 'physicalStep') content = `<p>${t('checkinNote')}</p>${field('juggles', state.language === 'lv' ? 'Žonglēšanas rekords (pēc izvēles)' : 'Juggling record (optional)', '', 'number', 'min="0"')}<p class="small muted">${t('goalMeaning')}</p>`;
  if (step === 'assessmentStep') content = `${select('assessment', t('focus'), [[1, '1 / 5'], [2, '2 / 5'], [3, '3 / 5'], [4, '4 / 5'], [5, '5 / 5']], 3)}<p class="small muted">${t('progressIntro')}</p>`;
  if (step === 'doneStep') content = `<h2>${t('doneSetup')}</h2><p>${t('saveHint')}</p>`;
  return `${link('settings', t('back'))}${head(t, 'setupTitle', 'setupNote')}<ol class="onboarding-steps">${steps.map((key, index) => `<li ${index === state.setupStep ? 'aria-current="step"' : ''}>${index + 1} / ${t(key)}</li>`).join('')}</ol>
    <form class="entry-form reading" data-form="onboarding"><h2>${t(step)}</h2>${content}<div class="actions">${state.setupStep > 0 ? `<button class="button secondary" type="button" data-action="setup-back">${t('back')}</button>` : ''}<button class="button" type="submit">${t(step === 'doneStep' ? 'finishSetup' : 'continue')}</button></div></form>`;
}

export function measurements(state, t) {
  const label = state.language === 'lv' ? 'Žonglēšanas rekords' : 'Juggling record';
  return `${link('progress', t('back'))}${head(t, 'measurements', 'demoOnly')}<div class="split"><section class="panel"><h2>${t('recordedMeasure')}</h2>${!state.measurements.length ? `<p>${t('noTrend')}</p>` : `<dl class="detail-list">${state.measurements.map(item => `<div><dt>${dateLabel(item.date, state.language)}</dt><dd>${item.juggles} · ${label}</dd></div>`).join('')}</dl>`}<p class="small muted section">${t('goalMeaning')}</p></section>
    <form class="entry-form" data-form="measurement">${field('juggles', label, state.formDrafts.measurement?.juggles ?? '', 'number', 'required min="0" step="1"')}<button class="button">${t('save')}</button><p class="small muted section">${t('saveHint')}</p></form></div>`;
}

export function goals(state, t) {
  return `${link('profile', t('back'))}${head(t, 'goalsTitle', 'goalMeaning')}<form class="entry-form reading" data-form="goal">${field('target', t('sessions'), state.formDrafts.goal?.target ?? state.goalTarget, 'number', 'required min="1" step="1"')}<p>${t('goalExample')}</p><button class="button">${t('save')}</button><p class="small muted section">${t('saveHint')}</p></form>`;
}

export function teams(state, t) {
  return `${link('profile', t('back'))}${head(t, 'myTeams', 'themeHint')}<div class="split"><section class="panel"><span class="eyebrow">U13 / CM</span><h2>${t(state.profile.clubKey)}</h2><p>${t('age')}</p><button class="button secondary" data-dialog="team">${t('myTeams')}</button>${link('surface/portal', t('more'))}</section>${tactic('position')}</div>`;
}

export function checkin(state, t) {
  const options = [1, 2, 3, 4, 5].map(n => [n, `${n} / 5`]);
  const current = state.checkins.find(item => item.date === TODAY);
  const draft = state.formDrafts.checkin || {};
  return `${link('home', t('back'))}${head(t, 'checkinTitle', 'checkinNote')}<form class="entry-form reading" data-form="checkin">${select('mood', t('mood'), options, draft.mood ?? current?.mood ?? 3)}${select('energy', t('energy'), options, draft.energy ?? current?.energy ?? 3)}${textarea('note', t('notes'), draft.note ?? current?.note ?? '')}<button class="button">${t('save')}</button></form>`;
}

export function quiz(state, t) {
  return `${link('home', t('back'))}${head(t, 'quizTitle', 'quizQuestion')}<form class="entry-form reading" data-form="quiz"><fieldset><legend>${t('quizQuestion')}</legend>${['quizA', 'quizB', 'quizC'].map((key, index) => `<label class="check"><input type="radio" name="answer" value="${index}" required>${t(key)}</label>`).join('')}</fieldset>${state.quizAnswered ? `<p class="status" role="status"><strong>${t(state.quizCorrect ? 'quizCorrect' : 'quizNotYet')}</strong> ${t('quizExplain')}</p><button class="button secondary" type="button" data-action="quiz-retry">${t('again')}</button>` : `<button class="button">${t('checkAnswer')}</button>`}</form>`;
}

export function coach(state, t) {
  if (state.sparse) return `${head(t, 'coachTitle', 'coachIntro')}<section class="empty"><h2>${t('noCoachPlan')}</h2><p>${t('noCoachPlanBody')}</p><div class="actions">${link('planner', t('planSession'), 'button')}${link('teams', t('myTeams'), 'button secondary')}</div></section><div class="links-grid">${link('roster', t('roster'), '')}${link('attendance', t('attendance'), '')}${link('surface/coach-announcements', t('coachMessages'), '')}${link('surface/coach-evaluation', t('evaluate'), '')}${link('surface/coach-challenges', t('teamChallenge'), '')}${link('stats', t('stats'), '')}</div>`;
  return `${head(t, 'coachTitle', 'coachIntro', `<span class="tag coral">${t('squad')}</span>`)}
    <div class="${state.direction === 'a' ? 'split' : 'b-home-spread'}"><section class="panel"><span class="eyebrow">22 SEP / 16:00</span><h2>${t('sessionName')}</h2><p>${t('sessionSub')}</p>${tactic('pass')}<div class="actions section">${link('planner', t('planSession'), 'button')}${link('attendance', t('attendance'), 'button secondary')}</div></section>
    <section><h2>${t('roster')}</h2>${rosterTable(state, t, true)}${link('roster', t('roster'))}<div class="links-grid section">${link('surface/coach-announcements', t('coachMessages'), '')}${link('surface/coach-evaluation', t('evaluate'), '')}${link('surface/coach-challenges', t('teamChallenge'), '')}${link('stats', t('stats'), '')}</div></section></div>`;
}

function rosterTable(state, t, compact = false) {
  if (state.sparse) return `<p class="empty">${t('noEntriesBody')}</p>`;
  const players = [['07', 'CM'], ['12', 'GK'], ['18', 'CB']];
  return `<div class="table-wrap"><table><thead><tr><th>${t('player')}</th><th>${t('position')}</th>${!compact ? `<th>${t('open')}</th>` : ''}</tr></thead><tbody>${players.map(([number, position]) => `<tr><td><span class="roster-avatar">${number}</span>${t('player')} ${number}</td><td>${position}</td>${!compact ? `<td>${link('surface/coach-evaluation', t('evaluate'))}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}

export function roster(state, t) {
  return `${link('coach', t('back'))}${head(t, 'rosterTitle', 'coachIntro')}${rosterTable(state, t)}<div class="actions section">${link('attendance', t('attendance'), 'button')}${link('surface/coach-evaluation', t('evaluate'), 'button secondary')}</div>`;
}

export function attendance(state, t) {
  return `${link('coach', t('back'))}${head(t, 'attendanceTitle', 'attendanceHint')}<section class="panel">
    <p class="eyebrow">22 SEP / ${t('squad')}</p>${['07', '12', '18'].map(number => `<div class="fixture-row"><span class="roster-avatar">${number}</span><strong>${t('player')} ${number}</strong><button class="attendance-choice" data-attendance="${number}" data-status="${state.attendance[number] || 'unknown'}">${t(state.attendance[number] || 'unknown')}</button></div>`).join('')}
    <div class="actions section"><button class="button" data-action="attendance-save">${t('saveAttendance')}</button><button class="button secondary" data-action="all-present">${t('allPresent')}</button></div></section>`;
}

export function planner(state, t) {
  return `${link('coach', t('back'))}${head(t, 'planTitle', 'coachIntro')}<div class="split"><form class="entry-form" data-form="plan">${field('title', t('planName'), state.formDrafts.plan?.title ?? state.plan?.title ?? t('sessionName'), 'text', 'required')}${textarea('objectives', t('objectives'), state.formDrafts.plan?.objectives ?? state.plan?.objectives ?? t('focusBody'))}<button class="button">${t('planSave')}</button></form>
    <section><h2>${t('exercises')}</h2>${state.planDrills.map(id => { const exercise = EXERCISES.find(item => item.id === id); return `<div class="fixture-row"><strong>${exercise.duration} min</strong><span>${t(exercise.name)}</span>${link(`exercise/${id}`, t('open'))}</div>`; }).join('')}<button class="button secondary" data-dialog="drill">${t('addDrill')}</button></section></div>`;
}

export function stats(state, t) {
  return `${head(t, 'stats', 'coachIntro')}<section class="empty"><h2>${t('noCoachStats')}</h2><p>${t('noCoachStatsBody')}</p><div class="actions">${link('roster', t('roster'), 'button')}${link('attendance', t('attendance'), 'button secondary')}</div></section>`;
}

export function mentor(state, t) {
  const summary = recentSummary(state);
  return `${head(t, 'mentorTitle', 'mentorIntro', `<button class="button secondary" data-dialog="mentee">${t('selectPlayer')}</button>`)}
    ${state.sparse ? `<section class="empty"><h2>${t('noLinked')}</h2>${link('surface/mentor-link', t('linkTreatment'), 'button')}</section>` : `<div class="split"><section class="panel"><span class="eyebrow">${t('mentee')}</span><h2>${t('playerName')} / U13</h2><p>${t('sharedActivity')}</p><div class="mini-stat"><strong>${summary.sessions}</strong><span>${t('sessions')} · ${summary.minutes} min</span></div><hr class="rule"><h3>${t('checkinTrend')}</h3><p class="muted">${state.checkins.map(item => `${dateLabel(item.date, state.language)}: ${item.mood}/5`).join(' · ')}</p><p class="small">${t('checkinNote')}</p></section>
    <section><h2>${t('conversation')}</h2><p>${t('conversationBody')}</p><div class="status">${t('mentorPrivacy')}</div><div class="links-grid">${link('schedule', t('schedule'), '')}${link('surface/announcements-feed', t('announcements'), '')}${link('surface/mentor-link', t('linkTreatment'), '')}</div></section></div>`}`;
}

export function coverage(state, t) {
  return `${head(t, 'allSurfaces', 'coverageIntro')}<p class="small muted">Base: 1a0b81b · 73 TSX files · 65 in the App import graph. Declared but unrendered Page values: ${declaredButUnrenderedRoutes.join(', ')}.</p>
    <div class="coverage-grid">${inventory.map(item => `<article class="coverage-item"><span class="tag ${item.status === 'rendered' ? 'blue' : ''}">${t(item.status === 'rendered' ? 'rendered' : 'plannedTreatment')}</span><h2 class="section">${t(item.title)}</h2>
      <p>${item.treatment[state.language]}</p>${item.sources.map(source => `<code>${source}</code>`).join('')}${link(item.route, t('open'))}</article>`).join('')}</div>`;
}

export function treatment(state, t, id) {
  const item = inventory.find(row => row.id === id);
  if (!item) return head(t, 'missing', 'demoOnly');
  return `${link('coverage', t('back'))}${head(t, item.title, 'treatmentBody')}<article class="treatment"><span class="tag">${t('plannedTreatment')}</span><h2 class="section">${t('desktop')} / ${t('mobile')}</h2>
    <p>${item.treatment[state.language]}</p><pre>${state.direction === 'a' ? 'ACADEMY RAIL | context + clear task\n             | primary workspace | supporting record\nMOBILE       | context → task → details → completion' : 'JOURNAL NAV / dated context\nrecord or media spread | focused tools\nMOBILE: context → one readable column → clear return'}</pre>
    <h2>${t('behavior')}</h2><p>${esc(item.boundary)}</p><h3>${t('source')}</h3>${item.sources.map(source => `<p><code>${source}</code></p>`).join('')}<p class="small muted">${t('demoOnly')}</p></article>`;
}
