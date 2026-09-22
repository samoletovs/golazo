export const TODAY = '2026-09-22';
export const TRAINING_TYPES = ['team', 'individual', 'technical', 'tactical', 'physical', 'gym', 'recovery', 'futsal'];
export const FOCUS_AREAS = ['technical', 'physical', 'tactical', 'mental'];
export const HISTORY = [
  { date: '2026-09-21', type: 'team', durationMinutes: 65, title: 'Passing & movement' },
  { date: '2026-09-19', type: 'individual', durationMinutes: 60, title: 'First touch & turns' },
];

export function newDraft() {
  return { date: TODAY, type: 'team', durationMinutes: '60', energy: '3', mood: '3', focusAreas: [], notes: '' };
}

export function validateDraft(draft) {
  const errors = {};
  const date = new Date(`${draft.date}T12:00:00Z`);
  if (!draft.date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== draft.date || draft.date > TODAY) {
    errors.date = 'Choose a real date on or before 22 September 2026, our demo today.';
  }
  const duration = Number(draft.durationMinutes);
  if (!draft.durationMinutes.trim() || !Number.isInteger(duration) || duration < 1 || duration > 300) {
    errors.durationMinutes = 'Add a duration from 1 to 300 whole minutes.';
  }
  if (!TRAINING_TYPES.includes(draft.type)) errors.type = 'Choose a training type.';
  for (const field of ['energy', 'mood']) {
    if (!['1', '2', '3', '4', '5'].includes(draft[field])) errors[field] = 'Choose an option from 1 to 5.';
  }
  if (draft.notes.length > 400) errors.notes = 'Keep your note to 400 characters or fewer.';
  return errors;
}

export function summarize({ firstUse = false, entry = null } = {}) {
  const history = firstUse ? [] : HISTORY;
  const entries = entry ? [...history, entry] : history;
  const week = entries.filter(item => item.date >= '2026-09-16' && item.date <= TODAY);
  const totalXp = (firstUse ? 0 : 80) + (entry ? 20 : 0);
  return {
    sessions: week.length,
    minutes: week.reduce((sum, item) => sum + item.durationMinutes, 0),
    totalXp,
    level: totalXp >= 100 ? 2 : 1,
    levelXp: totalXp >= 100 ? totalXp - 100 : totalXp,
    nextLevelXp: totalXp >= 100 ? 112 : 100,
  };
}

export function entryFromDraft(draft) {
  return {
    ...draft,
    durationMinutes: Number(draft.durationMinutes),
    energy: Number(draft.energy),
    mood: Number(draft.mood),
    focusAreas: [...draft.focusAreas],
    exerciseIds: [],
  };
}
