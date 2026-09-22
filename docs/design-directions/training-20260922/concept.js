import { TODAY, TRAINING_TYPES, FOCUS_AREAS, HISTORY, newDraft, validateDraft, summarize, entryFromDraft } from './model.mjs';

const clubhouse = document.body.dataset.direction === 'a';
const app = document.querySelector('#app');
const state = {
  view: 'home', draft: newDraft(), errors: {}, failed: false, failNext: false,
  busy: false, firstUse: false, longCopy: false, entry: null, rest: 'rest', dayAcknowledged: false,
};
const labels = { team: 'Team', individual: 'Individual', technical: 'Technical', tactical: 'Tactical', physical: 'Physical', gym: 'Gym', recovery: 'Recovery', futsal: 'Futsal', mental: 'Mental' };
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const tick = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 4 4L19 6"/></svg>';
const crest = `<svg class="crest" aria-hidden="true" viewBox="0 0 48 56"><path d="M3 3h42v29c0 10-21 21-21 21S3 42 3 32Z" fill="#153344"/><path d="M11 11h26v18c0 6-13 14-13 14s-13-8-13-14Z" fill="#c9efd8"/><path d="m15 28 9-13 9 13M19 23h10" fill="none" stroke="#153344" stroke-width="3"/></svg>`;
const kit = `<svg class="kit" aria-hidden="true" viewBox="0 0 300 320"><path d="m95 30-61 25L6 116l50 24 20-27v187h148V113l20 27 50-24-28-61-61-25c-8 24-102 24-110 0Z" fill="#153344" stroke="#153344" stroke-width="6" stroke-linejoin="round"/><path d="M99 39h32v253H99Zm70 0h32v253h-32Z" fill="#c9efd8"/><path d="M122 36q28 24 56 0" fill="none" stroke="#ffb79d" stroke-width="10"/><path d="m21 90 40 18m178 0 40-18" stroke="#ffb79d" stroke-width="12"/><path d="M128 129h58v17l-31 78h-24l32-74h-35Z" fill="#fff"/><path d="M208 71v22l-10 9-10-9V71Z" fill="#ffb79d"/></svg>`;
const leaf = '<svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="M25 5C10 3 3 9 6 20c9 5 20-2 19-15Z"/><path d="m5 28 15-17"/></svg>';

function clubName() {
  return state.longCopy ? '<span lang="lv">Ziemeļkrasta jaunatnes futbola akadēmijas komanda U13</span>' : 'Northbank FC · U13';
}
function logLabel() {
  return state.longCopy ? '<span lang="lv">Pievienot pabeigto futbola treniņu dienasgrāmatai</span>' : 'Log this training';
}
function dateLabel(date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
function button(action, text, secondary = false) {
  return `<button class="button${secondary ? ' secondary' : ''}" data-action="${action}">${text}<span class="arrow" aria-hidden="true">→</span></button>`;
}
function progress() {
  const stats = summarize(state);
  return `<div class="progress-label"><strong>Level ${stats.level}</strong><span>${stats.levelXp} / ${stats.nextLevelXp} XP</span></div>
    <progress value="${stats.levelXp}" max="${stats.nextLevelXp}" aria-label="Simulated level ${stats.level} progress">${stats.levelXp} / ${stats.nextLevelXp}</progress>
    <p class="hint">XP records activity, not your ability.</p>`;
}
function metrics(changes = false) {
  const stats = summarize(state);
  const before = summarize({ firstUse: state.firstUse });
  return `<div class="metrics">
    <div><strong class="metric-number">${stats.sessions}</strong><span class="metric-label">sessions logged</span>${changes ? `<span class="metric-change">${before.sessions} → ${stats.sessions} in the last 7 days</span>` : ''}</div>
    <div><strong class="metric-number">${stats.minutes}</strong><span class="metric-label">minutes of training</span>${changes ? `<span class="metric-change">${before.minutes} → ${stats.minutes} minutes</span>` : ''}</div>
  </div>`;
}
function journal() {
  const entries = state.firstUse ? [] : HISTORY;
  const all = state.entry ? [{ ...state.entry, title: 'Your recorded session' }, ...entries] : entries;
  return `<section class="history-section" aria-labelledby="history-title"><h2 id="history-title">Your training journal</h2>
    ${all.length ? `<ul class="journal">${all.map(entry => `<li><span class="day">${dateLabel(entry.date)}</span><div><strong>${escape(entry.title)}</strong><small>${labels[entry.type]} training</small></div><span class="duration">${entry.durationMinutes} min</span></li>`).join('')}</ul>` : '<p class="empty-note">Your journal starts here. One session is enough to begin.</p>'}</section>`;
}
function nextAction() {
  if (state.dayAcknowledged) return `${button('rest-result', 'See your day')}<p class="hint">Today acknowledged in this demo. No catching up needed.</p>`;
  return state.entry ? `${button('success', 'See your session')}<p class="hint">Already logged in this demo. No need to add it twice.</p>`
    : `${button('log', logLabel())}<div class="rest-link"><button class="text-button" data-action="rest">Rest or missed training?</button></div>`;
}
function home() {
  if (clubhouse) {
    return `<section class="home-hero" aria-labelledby="home-title"><div class="hero-copy">
      <span class="club-tag">Your club. Your pace.</span><h1 id="home-title" tabindex="-1">Good work,<br>Alex.</h1>
      <p>The boots are off. Give your effort a place in your story.</p></div>
      <div class="kit-scene">${kit}<span class="kit-note">ALL YOU.<br>ALL SEASON.</span></div>
      <div class="club-ribbon"><strong>${clubName()}</strong><span>Alex · #7 · Fictional player</span></div></section>
      <div class="home-grid"><section class="today-card" aria-labelledby="today-title"><span class="eyebrow">Back from the pitch</span><h2 id="today-title">Today's training</h2>
        <p class="muted">Tuesday, 22 September · Sample schedule</p><div class="session-summary"><span class="session-tag">Team training</span><span class="session-tag">60 minutes</span></div>
        <div class="actions">${nextAction()}</div></section>
      <section class="progress-card" aria-labelledby="progress-title"><span class="eyebrow">Your corner of the clubhouse</span><h2 id="progress-title">Every session has a place.</h2>
        <p class="muted">Last 7 days · 16–22 September</p>${metrics()}${progress()}
        <div class="club-notice">${leaf}<p>Training days. Rest days.<br><strong>You're part of the team on both.</strong></p></div></section></div>${journal()}`;
  }
  return `<div class="companion-layout"><section class="companion-main" aria-labelledby="home-title">
    <div class="session-index"><span class="index">AFTER TRAINING / 01</span><time datetime="${TODAY}">TUE 22 SEP</time></div>
    <h1 id="home-title" tabindex="-1">Boots off.<br>Session in.</h1><p class="intro">Good work, Alex. Take a moment to record what you did. Then get on with your day.</p>
    <div class="training-line"><div><h2>Team training</h2><p>Today's sample schedule</p></div><div class="training-minutes">60<small>minutes</small></div></div>
    <div class="actions">${nextAction()}</div><div class="companion-tip"><h3>Recovery belongs here, too.</h3><p>A rest day doesn't undo your work.</p></div>
    </section><aside class="companion-side" aria-label="Your progress"><span class="eyebrow">Your progress, at your pace</span><h2>Time well spent.</h2>
    <p class="muted">Last 7 days · 16–22 September</p>${metrics()}${progress()}${journal()}</aside></div>`;
}
function options(items, value) {
  return items.map(([key, text]) => `<option value="${key}" ${String(value) === String(key) ? 'selected' : ''}>${text}</option>`).join('');
}
function fieldError(name) {
  return `<p id="${name}-error" class="error-message" ${state.errors[name] ? '' : 'hidden'}>${state.errors[name] || ''}</p>`;
}
function logForm() {
  const draft = state.draft;
  return `<button class="text-button" data-action="home">← Back to ${clubhouse ? 'clubhouse' : 'today'}</button>
    <header class="view-heading"><span class="eyebrow">${clubhouse ? 'Put it on the board' : '01 / Record your session'}</span><h1 tabindex="-1" id="view-title">Log your training</h1>
    <p>Start with the basics. How you felt matters, too.</p></header>
    <div class="form-grid"><form id="training-form" class="form-panel" novalidate>
    <div class="field-pair"><div class="field"><label for="date">Training date</label>
      <input id="date" name="date" type="date" required max="${TODAY}" value="${escape(draft.date)}" aria-describedby="date-error" aria-invalid="${Boolean(state.errors.date)}">${fieldError('date')}</div>
    <div class="field"><label for="type">Training type</label><select id="type" name="type">${options(TRAINING_TYPES.map(key => [key, labels[key]]), draft.type)}</select>${fieldError('type')}</div></div>
    <div class="field"><label for="durationMinutes">Duration in minutes</label>
      <div class="duration-presets" role="group" aria-label="Quick duration">${[60, 90, 120].map(n => `<button class="choice" type="button" data-duration="${n}" aria-pressed="${Number(draft.durationMinutes) === n}">${n} min</button>`).join('')}</div>
      <input id="durationMinutes" name="durationMinutes" type="number" inputmode="numeric" min="1" max="300" step="1" required value="${escape(draft.durationMinutes)}" aria-describedby="duration-hint durationMinutes-error" aria-invalid="${Boolean(state.errors.durationMinutes)}">
      <p class="hint" id="duration-hint">Short session? Change the minutes above. It still counts.</p>${fieldError('durationMinutes')}</div>
    <div class="field-pair"><div class="field"><label for="energy">Energy during training</label><select id="energy" name="energy">${options([[1, '1 · Very low'], [2, '2 · Low'], [3, '3 · Steady'], [4, '4 · Plenty'], [5, '5 · Lots']], draft.energy)}</select>${fieldError('energy')}</div>
    <div class="field"><label for="mood">Mood afterwards</label><select id="mood" name="mood">${options([[1, '1 · Not great'], [2, '2 · A bit down'], [3, '3 · Okay'], [4, '4 · Good'], [5, '5 · Great']], draft.mood)}</select>${fieldError('mood')}</div></div>
    <details class="details" ${draft.notes || draft.focusAreas.length ? 'open' : ''}><summary>Add a focus or a note (optional)</summary>
      <fieldset class="field"><legend>What did you focus on?</legend><div class="check-row">${FOCUS_AREAS.map(key => `<label class="check-label"><input type="checkbox" name="focusAreas" value="${key}" ${draft.focusAreas.includes(key) ? 'checked' : ''}>${labels[key]}</label>`).join('')}</div></fieldset>
      <div class="field"><label for="notes">One thing to remember</label><textarea id="notes" name="notes" rows="3" maxlength="400" aria-describedby="notes-hint" placeholder="e.g. I looked up before making a pass.">${escape(draft.notes)}</textarea><p id="notes-hint" class="hint">Optional · up to 400 characters · use made-up details only.</p>${fieldError('notes')}</div>
    </details>
    <div id="save-error" class="save-notice" role="alert" ${state.failed ? '' : 'hidden'}><strong>Demo save didn't go through.</strong><p>Your answers are still here. Try again when you're ready.</p></div>
    <p id="save-status" class="save-status" role="status"></p>
    <div class="submit-row"><button class="button" id="save-button" type="submit">${state.failed ? 'Retry demo save' : 'Save demo training'} <span aria-hidden="true">→</span></button><p class="hint">Simulated save only. Nothing is sent or stored.</p></div>
    </form><aside class="aside-panel"><span class="eyebrow">A small moment for your effort</span><p class="mini-number">+20<span>sample XP</span></p>
    <h2>Notice what you did.</h2><p>Logging makes a record of your practice. It isn't a rating of how good you are.</p><hr class="rule"><h3>No perfect sessions needed.</h3><p class="muted">Tired, happy, frustrated — all answers belong here. A parent can help, but this is your story.</p></aside></div>`;
}
function success() {
  const entry = state.entry;
  if (!entry) return home();
  const inWeek = entry.date >= '2026-09-16';
  return `<header class="result-heading"><span class="completion-mark">${tick}Demo training logged</span>
    <h1 tabindex="-1" id="view-title">${clubhouse ? 'Your effort.<br>On the board.' : 'Training recorded.<br>Time to recover.'}</h1>
    <p>${dateLabel(entry.date)} · ${labels[entry.type]} training · ${entry.durationMinutes} minutes. That's your work, remembered.</p></header>
    <div class="result-grid"><section class="result-panel celebrate" aria-labelledby="earned-title"><span class="reward-stamp">+20 XP · ${state.firstUse ? 'Your first entry' : 'Level 2 reached'}</span>
      <h2 id="earned-title">${clubhouse ? 'A little more of your story.' : 'Here’s what changed.'}</h2><p>Last 7 days · 16–22 September</p>${metrics(true)}${!inWeek ? '<p class="hint">This session is outside the last 7 days, so those totals stay the same.</p>' : ''}
      ${progress()}<p class="hint">Simulated progress from this entry. No streak to protect.</p></section>
    <section class="result-panel"><span class="eyebrow">Something to take with you</span><h2>${entry.notes.trim() ? 'Your own words.' : 'You made time for practice.'}</h2>
      ${entry.notes.trim() ? `<blockquote class="note-quote">${escape(entry.notes)}</blockquote>` : '<p>Some sessions feel easier than others. Both are part of learning.</p>'}
      <p class="muted">${entry.focusAreas.length ? `Focus: ${entry.focusAreas.map(key => labels[key]).join(', ')}.` : 'You don’t need to measure everything to make progress.'}</p>
      <hr class="rule"><h3>You're done for now.</h3><p>Have some water. Take a breather. Your next session can wait until you're ready.</p></section></div>
    <div class="actions closing">${button('done', 'Finish for today')}<button class="text-button" data-action="home">See your journal</button></div>`;
}
function restForm() {
  return `<button class="text-button" data-action="home">← Back to ${clubhouse ? 'clubhouse' : 'today'}</button>
    <header class="view-heading"><span class="eyebrow">Room for real life</span><h1 tabindex="-1" id="view-title">Not a training day?</h1><p>That's okay. Your previous effort is still yours.</p></header>
    <div class="form-grid"><form id="rest-form" class="form-panel"><fieldset><legend>What fits today?</legend><div class="rest-options">
      <label class="rest-option"><input type="radio" name="rest" value="rest" ${state.rest === 'rest' ? 'checked' : ''}><span><strong>A rest day</strong><span>Taking time away from training.</span></span></label>
      <label class="rest-option"><input type="radio" name="rest" value="missed" ${state.rest === 'missed' ? 'checked' : ''}><span><strong>I missed training</strong><span>Plans changed. No explanation needed.</span></span></label></div></fieldset>
      <button class="button" type="submit">Acknowledge demo day <span aria-hidden="true">→</span></button><p class="hint">A concept acknowledgement, not a training entry.</p></form>
    <aside class="aside-panel"><h2>No catching up required.</h2><p>Rest and life outside football belong in your week.</p><p class="muted">This demo doesn't remove XP, break a streak or ask you to make up a session.</p></aside></div>`;
}
function restResult() {
  return `<header class="result-heading"><span class="completion-mark">${tick}Demo day acknowledged</span><h1 tabindex="-1" id="view-title">${state.rest === 'rest' ? 'Room to rest.' : 'Plans change.<br>You’re still you.'}</h1><p>${state.rest === 'rest' ? 'A pause is part of the picture.' : 'Missing one session doesn’t erase the ones you did.'}</p></header>
    <section class="result-panel"><h2>Your previous progress stays.</h2><p>Last 7 days · 16–22 September</p>${metrics()}${progress()}<p class="hint">No training added. No XP added or removed. Simulated acknowledgement only.</p></section><div class="actions closing">${button('done', 'Finish for today')}<button class="text-button" data-action="home">Back to today</button></div>`;
}
function done() {
  return `<header class="result-heading"><span class="eyebrow">All yours from here</span><h1 tabindex="-1" id="view-title">${clubhouse ? 'See you when<br>you’re ready.' : 'That’s enough<br>for today.'}</h1><p>You can close this tab. There's nothing else you need to do.</p></header><section class="result-panel"><h2>This was a local demonstration.</h2><p>Your demo changes disappear on reload. No player account, network save or parent notification was involved.</p><button class="text-button" data-action="home">Return to the demo journal</button></section>`;
}
function render(focus = false) {
  const views = { home, log: logForm, success, rest: restForm, 'rest-result': restResult, done };
  app.innerHTML = `<div class="prototype-bar"><div class="prototype-inner"><p><strong>${clubhouse ? 'A · Clubhouse' : 'B · Training companion'}</strong> · Concept, not the live app.<br>Synthetic data. Simulated results. Reload resets.</p>
    <a href="./${clubhouse ? 'companion' : 'clubhouse'}.html">Compare direction ${clubhouse ? 'B' : 'A'} <span aria-hidden="true">↗</span></a></div></div>
    <header class="masthead"><p class="wordmark">golazo<span>.</span></p><div class="identity">${crest}<div><strong>${clubName()}</strong><small>Alex · 12 · Fictional player</small></div></header>
    <main class="shell" id="main">${views[state.view]()}</main>
    <details class="demo-tools"><summary>Prototype controls · for reviewing states</summary><div class="demo-options">
      <label class="check-label"><input id="fail-next" type="checkbox" ${state.failNext ? 'checked' : ''}>Simulate one save failure</label>
      <label class="check-label"><input id="long-copy" type="checkbox" ${state.longCopy ? 'checked' : ''}>Long Latvian labels (stress test)</label>
      <button class="text-button" data-action="first-use">Preview first use</button><button class="text-button" data-action="reset">Reset demo</button>
    </div><p class="hint">Use made-up content only. No storage, sync, authentication, APIs or analytics. Direction choice is pending.</p></details>
    <footer class="local-footer"><p>Golazo design study · 22 September 2026 · Not a real club or player.</p></footer>`;
  if (focus) {
    document.querySelector('#view-title, #home-title')?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function readDraft(form) {
  const data = new FormData(form);
  state.draft = {
    date: String(data.get('date') || ''), type: String(data.get('type') || ''),
    durationMinutes: String(data.get('durationMinutes') || ''), energy: String(data.get('energy') || ''),
    mood: String(data.get('mood') || ''), focusAreas: data.getAll('focusAreas').map(String),
    notes: String(data.get('notes') || ''),
  };
}

app.addEventListener('input', event => {
  if (event.target.closest('#training-form')) {
    readDraft(event.target.closest('form'));
    if (event.target.name === 'durationMinutes') {
      document.querySelectorAll('[data-duration]').forEach(button => button.setAttribute('aria-pressed', String(Number(state.draft.durationMinutes) === Number(button.dataset.duration))));
    }
  }
});
app.addEventListener('change', event => {
  if (event.target.id === 'fail-next') state.failNext = event.target.checked;
  if (event.target.id === 'long-copy') {
    state.longCopy = event.target.checked;
    render();
    document.querySelector('.demo-tools').open = true;
    document.querySelector('#long-copy').focus();
  }
  if (event.target.name === 'rest') state.rest = event.target.value;
});
app.addEventListener('click', event => {
  const duration = event.target.closest('[data-duration]');
  if (duration) {
    const input = document.querySelector('#durationMinutes');
    input.value = duration.dataset.duration;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action || state.busy) return;
  if (action === 'reset' || action === 'first-use') {
    Object.assign(state, { view: 'home', draft: newDraft(), errors: {}, failed: false, failNext: false, entry: null, rest: 'rest', dayAcknowledged: false, firstUse: action === 'first-use' });
  } else {
    state.view = action;
  }
  render(true);
});
app.addEventListener('submit', async event => {
  event.preventDefault();
  if (state.busy) return;
  if (event.target.id === 'rest-form') {
    state.dayAcknowledged = true;
    state.view = 'rest-result';
    render(true);
    return;
  }
  if (event.target.id !== 'training-form' || state.entry) return;
  readDraft(event.target);
  state.errors = validateDraft(state.draft);
  if (Object.keys(state.errors).length) {
    render();
    document.getElementById(Object.keys(state.errors)[0]).focus();
    return;
  }
  state.busy = true;
  const saveButton = document.querySelector('#save-button');
  saveButton.disabled = true;
  saveButton.textContent = 'Saving demo training…';
  document.querySelector('#save-error').hidden = true;
  document.querySelector('#save-status').textContent = 'Simulating a save. Nothing is being sent.';
  event.target.setAttribute('aria-busy', 'true');
  event.target.querySelectorAll('input, select, textarea, button').forEach(control => { control.disabled = true; });
  document.querySelectorAll('.demo-tools input, .demo-tools button').forEach(control => { control.disabled = true; });
  const fail = state.failNext;
  await new Promise(resolve => setTimeout(resolve, 700));
  state.busy = false;
  if (fail) {
    state.failed = true;
    state.failNext = false;
    render();
    document.querySelector('#save-button').focus();
    return;
  }
  state.failed = false;
  state.entry = entryFromDraft(state.draft);
  state.view = 'success';
  render(true);
});
render();
