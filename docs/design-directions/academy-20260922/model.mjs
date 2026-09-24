export const TODAY = '2026-09-22';
export const MAIN_PAGES = ['home', 'log', 'progress', 'learn', 'profile'];
export const WEEKS = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21'];
export const EXERCISES = [
  { id: 'first-touch', name: 'firstTouch', category: 'technical', duration: 10, equipment: 'ballCones', drawing: 'touch', steps: ['stepOne', 'stepTwo', 'stepThree'] },
  { id: 'wall-pass', name: 'wallPass', category: 'tactical', duration: 12, equipment: 'ballWall', drawing: 'pass', steps: ['wallOne', 'wallTwo', 'wallThree'] },
  { id: 'cone-turn', name: 'coneTurn', category: 'technical', duration: 8, equipment: 'ballCones', drawing: 'turn', steps: ['turnOne', 'turnTwo', 'turnThree'] },
];

function fixtureTrainings() {
  return [
    ['2026-08-18', 60], ['2026-08-20', 60], ['2026-08-25', 90], ['2026-08-27', 75],
    ['2026-09-01', 45], ['2026-09-03', 45], ['2026-09-08', 90], ['2026-09-10', 90],
    ['2026-09-15', 75], ['2026-09-17', 60], ['2026-09-21', 90],
  ].map(([date, durationMinutes], i) => ({
    id: `synthetic-training-${i}`, kind: 'training', date, durationMinutes,
    type: i % 3 === 0 ? 'individual' : 'team', focusAreas: i % 3 === 0 ? ['tactical'] : ['technical'],
    energy: 3, mood: 4, notes: '',
  }));
}

export function createState(search = '') {
  const parameters = new URLSearchParams(search);
  const sparse = parameters.get('data') === 'sparse';
  return {
    direction: parameters.get('direction') === 'b' ? 'b' : 'a',
    language: parameters.get('lang') === 'en' ? 'en' : 'lv',
    role: 'player', sparse, failNext: false, failure: false, notice: '',
    page: 'home', learnTab: 'exercises', metric: 'minutes', selectedWeek: 5,
    search: '', exercise: 'first-touch', savedExercises: new Set(), practiced: new Set(),
    articleRead: false, programStarted: false, workoutDone: false, setupStep: 0,
    profile: { number: '07', position: 'CM', foot: 'right', teamColor: '#2447c5', clubKey: 'club' },
    trainings: sparse ? [] : fixtureTrainings(),
    matches: sparse ? [] : [
      { id: 'match-1', kind: 'match', date: '2026-09-12', opponent: 'opponentTwo', scoreUs: 1, scoreThem: 1, minutesPlayed: 55, goals: 0, assists: 1, selfRating: 7 },
      { id: 'match-2', kind: 'match', date: '2026-09-19', opponent: 'opponent', scoreUs: 2, scoreThem: 1, minutesPlayed: 55, goals: 0, assists: 1, selfRating: 7 },
    ],
    diary: [], drafts: {}, formDrafts: {}, completedTokens: new Set(), simulatedXp: 0,
    events: sparse ? [] : [
      { id: 'mon', date: '2026-09-21', type: 'training', title: 'teamTraining', time: '16:00', duration: 90, status: 'logged' },
      { id: 'tue', date: TODAY, type: 'training', title: 'sessionName', time: '16:00', duration: 60, status: 'toLog' },
      { id: 'thu', date: '2026-09-24', type: 'training', title: 'teamTraining', time: '16:00', duration: 90, status: 'planned' },
      { id: 'sat', date: '2026-09-26', type: 'match', title: 'opponent', time: '12:30', status: 'planned' },
    ],
    attendance: {}, planDrills: ['first-touch'], goalTarget: 8, goalChosen: !sparse, plan: null,
    measurements: sparse ? [] : [{ date: '2026-09-12', juggles: 18 }, { date: '2026-09-19', juggles: 24 }],
    checkins: sparse ? [] : [{ date: '2026-09-17', mood: 4, energy: 3 }, { date: '2026-09-20', mood: 3, energy: 3 }, { date: TODAY, mood: 4, energy: 4 }],
  };
}

export function chartSeries(state) {
  return WEEKS.map(start => {
    const end = new Date(`${start}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 7);
    const last = end.toISOString().slice(0, 10);
    const entries = state.trainings.filter(entry => entry.date >= start && entry.date < last);
    return { date: start, sessions: entries.length, minutes: entries.reduce((sum, entry) => sum + entry.durationMinutes, 0), matches: state.matches.filter(entry => entry.date >= start && entry.date < last).length };
  });
}

export function recentSummary(state) {
  const entries = state.trainings.filter(entry => entry.date >= '2026-09-16' && entry.date <= TODAY);
  return { sessions: entries.length, minutes: entries.reduce((sum, entry) => sum + entry.durationMinutes, 0) };
}

export function freshDraft(kind) {
  return {
    token: crypto.randomUUID(), kind, date: TODAY, durationMinutes: '60', type: 'team',
    energy: '3', mood: '4', focusAreas: ['technical'], notes: '', opponent: '',
    scoreUs: '2', scoreThem: '1', minutesPlayed: '55', goals: '0', assists: '1',
    selfRating: '7', bestMoment: '', toImprove: '', text: '', aiConsent: true,
  };
}

export function submitDraft(state, draft) {
  if (state.completedTokens.has(draft.token)) return { duplicate: true };
  if (state.failNext) {
    state.failNext = false;
    state.failure = true;
    return { failed: true };
  }
  const entry = { ...draft, id: draft.token };
  if (draft.kind === 'training') {
    entry.durationMinutes = Number(draft.durationMinutes);
    state.trainings.push(entry);
    state.simulatedXp += 20;
    const event = state.events.find(item => item.id === 'tue');
    if (event && draft.date === TODAY) event.status = 'logged';
  } else if (draft.kind === 'match') {
    for (const field of ['scoreUs', 'scoreThem', 'minutesPlayed', 'goals', 'assists', 'selfRating']) entry[field] = Number(draft[field]);
    state.matches.push(entry);
    state.simulatedXp += 30;
  } else if (draft.kind === 'reflection') {
    state.diary.push(entry);
    state.simulatedXp += 15;
  } else {
    throw new Error(`Unsupported concept log kind: ${draft.kind}`);
  }
  state.completedTokens.add(draft.token);
  state.failure = false;
  return { saved: true, entry };
}
