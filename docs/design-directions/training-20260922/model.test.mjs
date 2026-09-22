import test from 'node:test';
import assert from 'node:assert/strict';
import { newDraft, validateDraft, summarize, entryFromDraft } from './model.mjs';

test('completed 60-minute training adds exactly one session, 60 minutes and 20 XP', () => {
  const result = summarize({ entry: entryFromDraft(newDraft()) });
  assert.deepEqual(result, { sessions: 3, minutes: 185, totalXp: 100, level: 2, levelXp: 0, nextLevelXp: 112 });
});
test('rest or missed day without a training entry preserves previous progress', () => {
  assert.deepEqual(summarize(), { sessions: 2, minutes: 125, totalXp: 80, level: 1, levelXp: 80, nextLevelXp: 100 });
});
test('first-use progress is honest before and after one short session', () => {
  assert.equal(summarize({ firstUse: true }).sessions, 0);
  const result = summarize({ firstUse: true, entry: entryFromDraft({ ...newDraft(), durationMinutes: '10' }) });
  assert.deepEqual(result, { sessions: 1, minutes: 10, totalXp: 20, level: 1, levelXp: 20, nextLevelXp: 100 });
});
test('rejects missing, zero, fractional and oversized durations without rejecting short training', () => {
  for (const durationMinutes of ['', '0', '-1', '1.5', '301']) assert.ok(validateDraft({ ...newDraft(), durationMinutes }).durationMinutes);
  for (const durationMinutes of ['1', '60', '300']) assert.deepEqual(validateDraft({ ...newDraft(), durationMinutes }), {});
});
test('rejects impossible, missing and future dates', () => {
  for (const date of ['', '2026-02-30', '2026-09-23', 'garbage']) assert.ok(validateDraft({ ...newDraft(), date }).date);
});
test('an older session earns activity XP without inflating last-seven-day totals', () => {
  const result = summarize({ entry: entryFromDraft({ ...newDraft(), date: '2026-09-01' }) });
  assert.equal(result.sessions, 2);
  assert.equal(result.minutes, 125);
  assert.equal(result.totalXp, 100);
});
test('capturing a draft preserves optional notes and focus without sharing the array', () => {
  const draft = { ...newDraft(), notes: 'I looked up before passing.', focusAreas: ['technical'] };
  const entry = entryFromDraft(draft);
  draft.focusAreas.push('mental');
  assert.equal(entry.notes, 'I looked up before passing.');
  assert.deepEqual(entry.focusAreas, ['technical']);
});
