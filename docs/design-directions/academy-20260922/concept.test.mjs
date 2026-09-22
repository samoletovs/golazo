import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createState, chartSeries, recentSummary, freshDraft, submitDraft } from './model.mjs';
import { copy, translator } from './copy.mjs';
import { inventory, internalOnly } from './inventory.mjs';
import { mainViews } from './views.mjs';

test('the featured English and Latvian scenario have identical copy coverage', () => {
  assert.deepEqual(Object.keys(copy.en).sort(), Object.keys(copy.lv).sort());
});
test('all five pages render distinct structural compositions in both directions and languages', () => {
  for (const language of ['en', 'lv']) {
    const state = createState(`?lang=${language}`);
    for (const [name, view] of Object.entries(mainViews)) {
      const a = view(state, translator(language));
      const b = view({ ...state, direction: 'b' }, translator(language));
      assert.notEqual(a, b, `${name} must not just recolor the same markup`);
      assert.ok(a.includes('page-title') && b.includes('page-title'));
    }
  }
});
test('weekly charts and last-seven-day totals come from dated training records', () => {
  const state = createState();
  assert.deepEqual(chartSeries(state).map(week => week.minutes), [120, 165, 90, 180, 135, 90]);
  assert.deepEqual(recentSummary(state), { sessions: 2, minutes: 150 });
});
test('sparse mode contains no invented trends, matches or check-ins', () => {
  const state = createState('?data=sparse');
  assert.deepEqual(recentSummary(state), { sessions: 0, minutes: 0 });
  assert.equal(state.matches.length + state.checkins.length + state.measurements.length, 0);
  assert.ok(chartSeries(state).every(week => week.minutes === 0 && week.sessions === 0));
});
test('failed save preserves draft and changes no record or reward; retry adds once', () => {
  const state = createState();
  const draft = freshDraft('training');
  draft.notes = 'Synthetic note';
  state.failNext = true;
  assert.equal(submitDraft(state, draft).failed, true);
  assert.equal(state.trainings.length, 11);
  assert.equal(state.simulatedXp, 0);
  assert.equal(draft.notes, 'Synthetic note');
  assert.equal(submitDraft(state, draft).saved, true);
  assert.equal(submitDraft(state, draft).duplicate, true);
  assert.deepEqual(recentSummary(state), { sessions: 3, minutes: 210 });
  assert.equal(state.simulatedXp, 20);
});
test('match and diary fields remain distinct and only affect their own collections', () => {
  const state = createState();
  const match = freshDraft('match');
  const diary = freshDraft('reflection');
  diary.text = 'Synthetic private reflection';
  submitDraft(state, match);
  submitDraft(state, diary);
  assert.equal(state.matches.at(-1).scoreUs, 2);
  assert.equal(state.diary.at(-1).text, diary.text);
  assert.equal(state.trainings.length, 11);
});
test('every TSX file in the source scan has an explicit rendered/planned/internal disposition', () => {
  const scan = JSON.parse(readFileSync(new URL('./source-map.json', import.meta.url), 'utf8'));
  const mapped = new Set(inventory.flatMap(item => item.sources));
  const missing = scan.rows.filter(item => !mapped.has(item.file) && !internalOnly[item.file]);
  assert.deepEqual(missing.map(item => item.file), []);
  assert.equal(scan.rows.length, 73);
  assert.equal(new Set(inventory.map(item => item.id)).size, inventory.length);
  for (const item of inventory) {
    assert.ok(item.treatment.en && item.treatment.lv && item.boundary);
    assert.ok(['rendered', 'planned'].includes(item.status));
  }
});

test('source scope declares the whole product and keeps role-specific surface IDs distinct', () => {
  const scope = JSON.parse(readFileSync(new URL('../../../.design-scope.json', import.meta.url), 'utf8'));
  assert.equal(scope.version, 1);
  assert.equal(scope.kind, 'product-redesign');
  assert.ok(scope.owner_scope.includes('2026-09-22'));
  assert.ok(scope.inventory_basis.includes('App.tsx'));
  assert.equal(new Set(scope.surfaces.map(surface => surface.id)).size, scope.surfaces.length);
  assert.equal(new Set(scope.surfaces.map(surface => `${surface.role}:${surface.entry}`)).size, scope.surfaces.length);
  for (const surface of scope.surfaces) {
    for (const key of ['id', 'entry', 'role']) {
      assert.equal(typeof surface[key], 'string');
      assert.doesNotMatch(surface[key], /\b(TODO|TBD|pending|placeholder)\b|<[^>]+>/i);
    }
    assert.ok(surface.id.trim() && surface.entry.trim() && surface.role.trim());
  }
  const ids = new Set(scope.surfaces.map(surface => surface.id));
  for (const role of ['player', 'coach', 'mentor']) {
    for (const surface of ['shell', 'profile', 'settings', 'reset-confirmation', 'schedule-week', 'schedule-month', 'schedule-tournament-import']) {
      assert.ok(ids.has(`${role}-${surface}`), `${role}-${surface}`);
    }
  }
  for (const id of ['player-home-training-log', 'player-log-training-log',
    'player-activity-inline-training', 'player-exercise-detail-dialog',
    'player-workout-rating', 'coach-roster-player-detail', 'mentor-evaluation-detail',
    'onboarding-role-choice', 'visitor-sign-in']) assert.ok(ids.has(id), id);
});
