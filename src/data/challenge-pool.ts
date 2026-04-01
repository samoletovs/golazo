import type { ChallengeTemplate } from '../engine/types'

/**
 * Pool of ~50 challenge templates across 5 skill categories.
 * Targets are scaled by age tier (u10 → easier, u16 → harder).
 */
export const challengePool: ChallengeTemplate[] = [
  // ═══════════════════════════════════════════════════
  //  TECHNICAL (15)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-tech-01', textKey: 'ch.juggleStreak', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 30, unit: 'juggles' }, u12: { value: 50, unit: 'juggles' }, u14: { value: 80, unit: 'juggles' }, u16: { value: 100, unit: 'juggles' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-02', textKey: 'ch.weakFootJuggles', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 10, unit: 'juggles' }, u12: { value: 20, unit: 'juggles' }, u14: { value: 40, unit: 'juggles' }, u16: { value: 60, unit: 'juggles' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-03', textKey: 'ch.wallPasses', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 50, unit: 'passes' }, u12: { value: 80, unit: 'passes' }, u14: { value: 100, unit: 'passes' }, u16: { value: 120, unit: 'passes' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['wall'],
  },
  {
    id: 'ch-tech-04', textKey: 'ch.firstTouchDrill', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 20, unit: 'touches' }, u12: { value: 30, unit: 'touches' }, u14: { value: 50, unit: 'touches' }, u16: { value: 50, unit: 'touches' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-05', textKey: 'ch.dribbleCones', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'runs' }, u12: { value: 8, unit: 'runs' }, u14: { value: 10, unit: 'runs' }, u16: { value: 10, unit: 'runs' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['cones'],
  },
  {
    id: 'ch-tech-06', textKey: 'ch.crossbarChallenge', category: 'technical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 2, unit: 'hits' }, u14: { value: 3, unit: 'hits' }, u16: { value: 5, unit: 'hits' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal'],
  },
  {
    id: 'ch-tech-07', textKey: 'ch.skillMoveCombo', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'combos' }, u12: { value: 10, unit: 'combos' }, u14: { value: 15, unit: 'combos' }, u16: { value: 15, unit: 'combos' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-08', textKey: 'ch.longPasses', category: 'technical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 15, unit: 'passes' }, u14: { value: 20, unit: 'passes' }, u16: { value: 25, unit: 'passes' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['partner'],
  },
  {
    id: 'ch-tech-09', textKey: 'ch.volleys', category: 'technical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 10, unit: 'volleys' }, u14: { value: 15, unit: 'volleys' }, u16: { value: 20, unit: 'volleys' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal'],
  },
  {
    id: 'ch-tech-10', textKey: 'ch.headingPractice', category: 'technical',
    ageTiers: ['u14', 'u16'],
    targets: { u14: { value: 15, unit: 'headers' }, u16: { value: 20, unit: 'headers' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['partner'],
  },
  {
    id: 'ch-tech-11', textKey: 'ch.penaltyKicks', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'goals' }, u12: { value: 7, unit: 'goals' }, u14: { value: 8, unit: 'goals' }, u16: { value: 8, unit: 'goals' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal'],
  },
  {
    id: 'ch-tech-12', textKey: 'ch.quickFeetDrill', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'minutes' }, u12: { value: 5, unit: 'minutes' }, u14: { value: 5, unit: 'minutes' }, u16: { value: 7, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-13', textKey: 'ch.freeKickPractice', category: 'technical',
    ageTiers: ['u12', 'u14', 'u16'], positions: ['ST', 'CAM', 'CM', 'LW', 'RW'],
    targets: { u12: { value: 10, unit: 'attempts' }, u14: { value: 15, unit: 'attempts' }, u16: { value: 15, unit: 'attempts' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal'],
  },
  {
    id: 'ch-tech-14', textKey: 'ch.gkShotStopping', category: 'technical', positions: ['GK'],
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 15, unit: 'saves' }, u12: { value: 20, unit: 'saves' }, u14: { value: 30, unit: 'saves' }, u16: { value: 30, unit: 'saves' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal', 'partner'],
  },
  {
    id: 'ch-tech-15', textKey: 'ch.gkDistribution', category: 'technical', positions: ['GK'],
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 15, unit: 'passes' }, u14: { value: 20, unit: 'passes' }, u16: { value: 25, unit: 'passes' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal', 'partner'],
  },

  // ═══════════════════════════════════════════════════
  //  PHYSICAL (10)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-phys-01', textKey: 'ch.sprintIntervals', category: 'physical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 4, unit: 'sprints' }, u12: { value: 6, unit: 'sprints' }, u14: { value: 8, unit: 'sprints' }, u16: { value: 10, unit: 'sprints' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['outdoor'],
  },
  {
    id: 'ch-phys-02', textKey: 'ch.agilityLadder', category: 'physical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'patterns' }, u12: { value: 8, unit: 'patterns' }, u14: { value: 10, unit: 'patterns' }, u16: { value: 10, unit: 'patterns' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['ladder'],
  },
  {
    id: 'ch-phys-03', textKey: 'ch.plankChallenge', category: 'physical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 30, unit: 'seconds' }, u12: { value: 60, unit: 'seconds' }, u14: { value: 90, unit: 'seconds' }, u16: { value: 120, unit: 'seconds' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-04', textKey: 'ch.squatJumps', category: 'physical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 15, unit: 'reps' }, u14: { value: 20, unit: 'reps' }, u16: { value: 30, unit: 'reps' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-05', textKey: 'ch.shuttleRuns', category: 'physical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 4, unit: 'runs' }, u12: { value: 6, unit: 'runs' }, u14: { value: 8, unit: 'runs' }, u16: { value: 10, unit: 'runs' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['outdoor'],
  },
  {
    id: 'ch-phys-06', textKey: 'ch.pushUps', category: 'physical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 15, unit: 'reps' }, u14: { value: 25, unit: 'reps' }, u16: { value: 40, unit: 'reps' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-07', textKey: 'ch.balanceChallenge', category: 'physical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 30, unit: 'seconds' }, u12: { value: 45, unit: 'seconds' }, u14: { value: 60, unit: 'seconds' }, u16: { value: 60, unit: 'seconds' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-08', textKey: 'ch.highKnees', category: 'physical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 30, unit: 'seconds' }, u12: { value: 45, unit: 'seconds' }, u14: { value: 60, unit: 'seconds' }, u16: { value: 60, unit: 'seconds' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-09', textKey: 'ch.stretching', category: 'physical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'minutes' }, u12: { value: 10, unit: 'minutes' }, u14: { value: 10, unit: 'minutes' }, u16: { value: 15, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-10', textKey: 'ch.burpees', category: 'physical',
    ageTiers: ['u14', 'u16'],
    targets: { u14: { value: 15, unit: 'reps' }, u16: { value: 25, unit: 'reps' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },

  // ═══════════════════════════════════════════════════
  //  TACTICAL (10)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-tact-01', textKey: 'ch.watchHighlights', category: 'tactical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'sessions' }, u12: { value: 1, unit: 'sessions' }, u14: { value: 1, unit: 'sessions' }, u16: { value: 1, unit: 'sessions' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['indoor'],
  },
  {
    id: 'ch-tact-02', textKey: 'ch.drawFormation', category: 'tactical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 1, unit: 'drawings' }, u14: { value: 1, unit: 'drawings' }, u16: { value: 1, unit: 'drawings' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['indoor'],
  },
  {
    id: 'ch-tact-03', textKey: 'ch.scanningPractice', category: 'tactical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'minutes' }, u14: { value: 10, unit: 'minutes' }, u16: { value: 10, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['outdoor'],
  },
  {
    id: 'ch-tact-04', textKey: 'ch.analyzeGoals', category: 'tactical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 3, unit: 'goals' }, u14: { value: 3, unit: 'goals' }, u16: { value: 5, unit: 'goals' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['indoor'],
  },
  {
    id: 'ch-tact-05', textKey: 'ch.positioningDrill', category: 'tactical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'minutes' }, u14: { value: 10, unit: 'minutes' }, u16: { value: 10, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['outdoor'],
  },
  {
    id: 'ch-tact-06', textKey: 'ch.passingDecision', category: 'tactical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'minutes' }, u12: { value: 10, unit: 'minutes' }, u14: { value: 10, unit: 'minutes' }, u16: { value: 15, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['partner'],
  },
  {
    id: 'ch-tact-07', textKey: 'ch.miniGame', category: 'tactical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'games' }, u12: { value: 1, unit: 'games' }, u14: { value: 1, unit: 'games' }, u16: { value: 1, unit: 'games' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['partner'],
  },
  {
    id: 'ch-tact-08', textKey: 'ch.defensiveShape', category: 'tactical',
    positions: ['CB', 'LB', 'RB', 'CDM'],
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'minutes' }, u14: { value: 10, unit: 'minutes' }, u16: { value: 10, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['outdoor'],
  },
  {
    id: 'ch-tact-09', textKey: 'ch.attackingRuns', category: 'tactical',
    positions: ['ST', 'LW', 'RW', 'CAM'],
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'minutes' }, u14: { value: 10, unit: 'minutes' }, u16: { value: 10, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['outdoor'],
  },
  {
    id: 'ch-tact-10', textKey: 'ch.setPlayStudy', category: 'tactical',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 1, unit: 'sessions' }, u14: { value: 1, unit: 'sessions' }, u16: { value: 1, unit: 'sessions' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['indoor'],
  },

  // ═══════════════════════════════════════════════════
  //  MENTAL (10)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-ment-01', textKey: 'ch.visualization', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'minutes' }, u12: { value: 5, unit: 'minutes' }, u14: { value: 5, unit: 'minutes' }, u16: { value: 5, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-02', textKey: 'ch.threePositives', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'items' }, u12: { value: 3, unit: 'items' }, u14: { value: 3, unit: 'items' }, u16: { value: 3, unit: 'items' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-03', textKey: 'ch.setGoal', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'goals' }, u12: { value: 1, unit: 'goals' }, u14: { value: 1, unit: 'goals' }, u16: { value: 1, unit: 'goals' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-04', textKey: 'ch.selfTalk', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'statements' }, u12: { value: 5, unit: 'statements' }, u14: { value: 5, unit: 'statements' }, u16: { value: 5, unit: 'statements' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-05', textKey: 'ch.matchReview', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'reviews' }, u12: { value: 1, unit: 'reviews' }, u14: { value: 1, unit: 'reviews' }, u16: { value: 1, unit: 'reviews' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-06', textKey: 'ch.breathingExercise', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'minutes' }, u12: { value: 5, unit: 'minutes' }, u14: { value: 5, unit: 'minutes' }, u16: { value: 5, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-07', textKey: 'ch.gratitudeJournal', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'items' }, u12: { value: 3, unit: 'items' }, u14: { value: 5, unit: 'items' }, u16: { value: 5, unit: 'items' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-08', textKey: 'ch.focusDrill', category: 'mental',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'minutes' }, u14: { value: 5, unit: 'minutes' }, u16: { value: 10, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-09', textKey: 'ch.teamEncouragement', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'messages' }, u12: { value: 1, unit: 'messages' }, u14: { value: 1, unit: 'messages' }, u16: { value: 1, unit: 'messages' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['no-partner'],
  },
  {
    id: 'ch-ment-10', textKey: 'ch.pressureSimulation', category: 'mental',
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'minutes' }, u14: { value: 10, unit: 'minutes' }, u16: { value: 10, unit: 'minutes' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['outdoor'],
  },

  // ═══════════════════════════════════════════════════
  //  KNOWLEDGE (5)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-know-01', textKey: 'ch.readArticle', category: 'knowledge',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'articles' }, u12: { value: 1, unit: 'articles' }, u14: { value: 1, unit: 'articles' }, u16: { value: 1, unit: 'articles' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },
  {
    id: 'ch-know-02', textKey: 'ch.completeQuiz', category: 'knowledge',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'quizzes' }, u12: { value: 1, unit: 'quizzes' }, u14: { value: 1, unit: 'quizzes' }, u16: { value: 1, unit: 'quizzes' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },
  {
    id: 'ch-know-03', textKey: 'ch.watchExerciseVideo', category: 'knowledge',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'videos' }, u12: { value: 1, unit: 'videos' }, u14: { value: 1, unit: 'videos' }, u16: { value: 1, unit: 'videos' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },
  {
    id: 'ch-know-04', textKey: 'ch.learnRule', category: 'knowledge',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'rules' }, u12: { value: 1, unit: 'rules' }, u14: { value: 1, unit: 'rules' }, u16: { value: 1, unit: 'rules' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },
  {
    id: 'ch-know-05', textKey: 'ch.nutritionGoal', category: 'knowledge',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'goals' }, u12: { value: 1, unit: 'goals' }, u14: { value: 1, unit: 'goals' }, u16: { value: 1, unit: 'goals' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },

  // ═══════════════════════════════════════════════════
  //  WEEKLY CHALLENGES (5)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-week-01', textKey: 'ch.weeklyTrainingSessions', category: 'physical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'sessions' }, u12: { value: 4, unit: 'sessions' }, u14: { value: 5, unit: 'sessions' }, u16: { value: 5, unit: 'sessions' } },
    period: 'weekly', xpReward: 75, skillImpact: 'physical',
  },
  {
    id: 'ch-week-02', textKey: 'ch.weeklyXp', category: 'knowledge',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 100, unit: 'XP' }, u12: { value: 150, unit: 'XP' }, u14: { value: 200, unit: 'XP' }, u16: { value: 200, unit: 'XP' } },
    period: 'weekly', xpReward: 75, skillImpact: 'knowledge',
  },
  {
    id: 'ch-week-03', textKey: 'ch.weeklyMoodLog', category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'days' }, u12: { value: 5, unit: 'days' }, u14: { value: 7, unit: 'days' }, u16: { value: 7, unit: 'days' } },
    period: 'weekly', xpReward: 75, skillImpact: 'mental',
  },
  {
    id: 'ch-week-04', textKey: 'ch.weeklyDailyChallenges', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'days' }, u12: { value: 4, unit: 'days' }, u14: { value: 5, unit: 'days' }, u16: { value: 5, unit: 'days' } },
    period: 'weekly', xpReward: 75, skillImpact: 'technical',
  },
  {
    id: 'ch-week-05', textKey: 'ch.weeklyProgramDays', category: 'technical',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'days' }, u12: { value: 4, unit: 'days' }, u14: { value: 5, unit: 'days' }, u16: { value: 5, unit: 'days' } },
    period: 'weekly', xpReward: 75, skillImpact: 'technical',
  },
]
