import type { ChallengeTemplate } from '../engine/types'

/**
 * Challenge pool — enriched with emoji, difficulty, instructions, tips, location, time.
 * Each challenge is designed to be engaging and shareable.
 * Targets scaled by age tier (u10 → easier, u16 → harder).
 */
export const challengePool: ChallengeTemplate[] = [
  // ═══════════════════════════════════════════════════
  //  TECHNICAL (12)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-tech-01', textKey: 'ch.juggleStreak', descKey: 'ch.juggleStreak.desc', tipsKey: 'ch.juggleStreak.tips',
    emoji: '🦶', category: 'technical', difficulty: 'medium', location: 'anywhere', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 30, unit: 'juggles' }, u12: { value: 50, unit: 'juggles' }, u14: { value: 80, unit: 'juggles' }, u16: { value: 100, unit: 'juggles' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-02', textKey: 'ch.weakFootJuggles', descKey: 'ch.weakFootJuggles.desc', tipsKey: 'ch.weakFootJuggles.tips',
    emoji: '🎯', category: 'technical', difficulty: 'hard', location: 'anywhere', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 10, unit: 'juggles' }, u12: { value: 20, unit: 'juggles' }, u14: { value: 40, unit: 'juggles' }, u16: { value: 60, unit: 'juggles' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-03', textKey: 'ch.wallPasses', descKey: 'ch.wallPasses.desc', tipsKey: 'ch.wallPasses.tips',
    emoji: '🧱', category: 'technical', difficulty: 'easy', location: 'outdoor', estimateMin: 8,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 50, unit: 'passes' }, u12: { value: 80, unit: 'passes' }, u14: { value: 100, unit: 'passes' }, u16: { value: 120, unit: 'passes' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['wall'],
  },
  {
    id: 'ch-tech-04', textKey: 'ch.firstTouchDrill', descKey: 'ch.firstTouchDrill.desc',
    emoji: '✋', category: 'technical', difficulty: 'medium', location: 'outdoor', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 20, unit: 'touches' }, u12: { value: 30, unit: 'touches' }, u14: { value: 50, unit: 'touches' }, u16: { value: 50, unit: 'touches' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-05', textKey: 'ch.dribbleCones', descKey: 'ch.dribbleCones.desc', tipsKey: 'ch.dribbleCones.tips',
    emoji: '🔀', category: 'technical', difficulty: 'medium', location: 'outdoor', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'runs' }, u12: { value: 8, unit: 'runs' }, u14: { value: 10, unit: 'runs' }, u16: { value: 10, unit: 'runs' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['cones'],
  },
  {
    id: 'ch-tech-06', textKey: 'ch.crossbarChallenge', descKey: 'ch.crossbarChallenge.desc',
    emoji: '🥅', category: 'technical', difficulty: 'hard', location: 'pitch', estimateMin: 15,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 2, unit: 'hits' }, u14: { value: 3, unit: 'hits' }, u16: { value: 5, unit: 'hits' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal'],
  },
  {
    id: 'ch-tech-07', textKey: 'ch.skillMoveCombo', descKey: 'ch.skillMoveCombo.desc', tipsKey: 'ch.skillMoveCombo.tips',
    emoji: '🌀', category: 'technical', difficulty: 'hard', location: 'anywhere', estimateMin: 12,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'combos' }, u12: { value: 10, unit: 'combos' }, u14: { value: 15, unit: 'combos' }, u16: { value: 15, unit: 'combos' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-08', textKey: 'ch.longPasses', descKey: 'ch.longPasses.desc',
    emoji: '📐', category: 'technical', difficulty: 'medium', location: 'pitch', estimateMin: 12,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 15, unit: 'passes' }, u14: { value: 20, unit: 'passes' }, u16: { value: 25, unit: 'passes' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['partner'],
  },
  {
    id: 'ch-tech-09', textKey: 'ch.penaltyKicks', descKey: 'ch.penaltyKicks.desc', tipsKey: 'ch.penaltyKicks.tips',
    emoji: '⚡', category: 'technical', difficulty: 'medium', location: 'pitch', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'goals' }, u12: { value: 7, unit: 'goals' }, u14: { value: 8, unit: 'goals' }, u16: { value: 8, unit: 'goals' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal'],
  },
  {
    id: 'ch-tech-10', textKey: 'ch.quickFeetDrill', descKey: 'ch.quickFeetDrill.desc',
    emoji: '💨', category: 'technical', difficulty: 'easy', location: 'anywhere', estimateMin: 7,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'min' }, u12: { value: 5, unit: 'min' }, u14: { value: 5, unit: 'min' }, u16: { value: 7, unit: 'min' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['no-partner'],
  },
  {
    id: 'ch-tech-11', textKey: 'ch.gkShotStopping', descKey: 'ch.gkShotStopping.desc',
    emoji: '🧤', category: 'technical', difficulty: 'medium', location: 'pitch', estimateMin: 15,
    positions: ['GK'], ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 15, unit: 'saves' }, u12: { value: 20, unit: 'saves' }, u14: { value: 30, unit: 'saves' }, u16: { value: 30, unit: 'saves' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal', 'partner'],
  },
  {
    id: 'ch-tech-12', textKey: 'ch.volleys', descKey: 'ch.volleys.desc',
    emoji: '🔥', category: 'technical', difficulty: 'hard', location: 'pitch', estimateMin: 12,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 10, unit: 'volleys' }, u14: { value: 15, unit: 'volleys' }, u16: { value: 20, unit: 'volleys' } },
    period: 'daily', xpReward: 15, skillImpact: 'technical', tags: ['needs-goal'],
  },

  // ═══════════════════════════════════════════════════
  //  PHYSICAL (8)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-phys-01', textKey: 'ch.sprintIntervals', descKey: 'ch.sprintIntervals.desc', tipsKey: 'ch.sprintIntervals.tips',
    emoji: '🏃', category: 'physical', difficulty: 'hard', location: 'outdoor', estimateMin: 15,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 4, unit: 'sprints' }, u12: { value: 6, unit: 'sprints' }, u14: { value: 8, unit: 'sprints' }, u16: { value: 10, unit: 'sprints' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['outdoor'],
  },
  {
    id: 'ch-phys-02', textKey: 'ch.plankChallenge', descKey: 'ch.plankChallenge.desc', tipsKey: 'ch.plankChallenge.tips',
    emoji: '🪨', category: 'physical', difficulty: 'medium', location: 'indoor', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 30, unit: 'sec' }, u12: { value: 60, unit: 'sec' }, u14: { value: 90, unit: 'sec' }, u16: { value: 120, unit: 'sec' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-03', textKey: 'ch.squatJumps', descKey: 'ch.squatJumps.desc',
    emoji: '🦵', category: 'physical', difficulty: 'medium', location: 'anywhere', estimateMin: 8,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 15, unit: 'reps' }, u14: { value: 20, unit: 'reps' }, u16: { value: 30, unit: 'reps' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['no-partner'],
  },
  {
    id: 'ch-phys-04', textKey: 'ch.shuttleRuns', descKey: 'ch.shuttleRuns.desc',
    emoji: '↔️', category: 'physical', difficulty: 'hard', location: 'outdoor', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 4, unit: 'runs' }, u12: { value: 6, unit: 'runs' }, u14: { value: 8, unit: 'runs' }, u16: { value: 10, unit: 'runs' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['outdoor'],
  },
  {
    id: 'ch-phys-05', textKey: 'ch.pushUps', descKey: 'ch.pushUps.desc',
    emoji: '💪', category: 'physical', difficulty: 'easy', location: 'indoor', estimateMin: 5,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 15, unit: 'reps' }, u14: { value: 25, unit: 'reps' }, u16: { value: 40, unit: 'reps' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-06', textKey: 'ch.balanceChallenge', descKey: 'ch.balanceChallenge.desc', tipsKey: 'ch.balanceChallenge.tips',
    emoji: '🦩', category: 'physical', difficulty: 'easy', location: 'anywhere', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 30, unit: 'sec' }, u12: { value: 45, unit: 'sec' }, u14: { value: 60, unit: 'sec' }, u16: { value: 60, unit: 'sec' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['no-partner'],
  },
  {
    id: 'ch-phys-07', textKey: 'ch.stretching', descKey: 'ch.stretching.desc',
    emoji: '🧘', category: 'physical', difficulty: 'easy', location: 'indoor', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'min' }, u12: { value: 10, unit: 'min' }, u14: { value: 10, unit: 'min' }, u16: { value: 15, unit: 'min' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-phys-08', textKey: 'ch.highKnees', descKey: 'ch.highKnees.desc',
    emoji: '🔄', category: 'physical', difficulty: 'medium', location: 'anywhere', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 30, unit: 'sec' }, u12: { value: 45, unit: 'sec' }, u14: { value: 60, unit: 'sec' }, u16: { value: 60, unit: 'sec' } },
    period: 'daily', xpReward: 15, skillImpact: 'physical', tags: ['no-partner'],
  },

  // ═══════════════════════════════════════════════════
  //  TACTICAL (8)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-tact-01', textKey: 'ch.watchHighlights', descKey: 'ch.watchHighlights.desc', tipsKey: 'ch.watchHighlights.tips',
    emoji: '📺', category: 'tactical', difficulty: 'easy', location: 'indoor', estimateMin: 15,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'sessions' }, u12: { value: 1, unit: 'sessions' }, u14: { value: 1, unit: 'sessions' }, u16: { value: 1, unit: 'sessions' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['indoor'],
  },
  {
    id: 'ch-tact-02', textKey: 'ch.drawFormation', descKey: 'ch.drawFormation.desc',
    emoji: '📋', category: 'tactical', difficulty: 'easy', location: 'indoor', estimateMin: 10,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 1, unit: 'drawings' }, u14: { value: 1, unit: 'drawings' }, u16: { value: 1, unit: 'drawings' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['indoor'],
  },
  {
    id: 'ch-tact-03', textKey: 'ch.analyzeGoals', descKey: 'ch.analyzeGoals.desc', tipsKey: 'ch.analyzeGoals.tips',
    emoji: '🔍', category: 'tactical', difficulty: 'medium', location: 'indoor', estimateMin: 15,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 3, unit: 'goals' }, u14: { value: 3, unit: 'goals' }, u16: { value: 5, unit: 'goals' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['indoor'],
  },
  {
    id: 'ch-tact-04', textKey: 'ch.positioningDrill', descKey: 'ch.positioningDrill.desc',
    emoji: '📍', category: 'tactical', difficulty: 'medium', location: 'pitch', estimateMin: 10,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'min' }, u14: { value: 10, unit: 'min' }, u16: { value: 10, unit: 'min' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['outdoor'],
  },
  {
    id: 'ch-tact-05', textKey: 'ch.miniGame', descKey: 'ch.miniGame.desc',
    emoji: '⚽', category: 'tactical', difficulty: 'easy', location: 'outdoor', estimateMin: 20,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'games' }, u12: { value: 1, unit: 'games' }, u14: { value: 1, unit: 'games' }, u16: { value: 1, unit: 'games' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['partner'],
  },
  {
    id: 'ch-tact-06', textKey: 'ch.defensiveShape', descKey: 'ch.defensiveShape.desc',
    emoji: '🛡️', category: 'tactical', difficulty: 'medium', location: 'pitch', estimateMin: 10,
    positions: ['CB', 'LB', 'RB', 'CDM'], ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'min' }, u14: { value: 10, unit: 'min' }, u16: { value: 10, unit: 'min' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['outdoor'],
  },
  {
    id: 'ch-tact-07', textKey: 'ch.attackingRuns', descKey: 'ch.attackingRuns.desc',
    emoji: '🏹', category: 'tactical', difficulty: 'medium', location: 'pitch', estimateMin: 10,
    positions: ['ST', 'LW', 'RW', 'CAM'], ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 5, unit: 'min' }, u14: { value: 10, unit: 'min' }, u16: { value: 10, unit: 'min' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['outdoor'],
  },
  {
    id: 'ch-tact-08', textKey: 'ch.setPlayStudy', descKey: 'ch.setPlayStudy.desc',
    emoji: '📐', category: 'tactical', difficulty: 'easy', location: 'indoor', estimateMin: 10,
    ageTiers: ['u12', 'u14', 'u16'],
    targets: { u12: { value: 1, unit: 'sessions' }, u14: { value: 1, unit: 'sessions' }, u16: { value: 1, unit: 'sessions' } },
    period: 'daily', xpReward: 15, skillImpact: 'tactical', tags: ['indoor'],
  },

  // ═══════════════════════════════════════════════════
  //  MENTAL (8)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-ment-01', textKey: 'ch.visualization', descKey: 'ch.visualization.desc', tipsKey: 'ch.visualization.tips',
    emoji: '🧠', category: 'mental', difficulty: 'easy', location: 'indoor', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'min' }, u12: { value: 5, unit: 'min' }, u14: { value: 5, unit: 'min' }, u16: { value: 5, unit: 'min' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-02', textKey: 'ch.threePositives', descKey: 'ch.threePositives.desc',
    emoji: '✍️', category: 'mental', difficulty: 'easy', location: 'indoor', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'items' }, u12: { value: 3, unit: 'items' }, u14: { value: 3, unit: 'items' }, u16: { value: 3, unit: 'items' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-03', textKey: 'ch.setGoal', descKey: 'ch.setGoal.desc',
    emoji: '🎯', category: 'mental', difficulty: 'easy', location: 'indoor', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'goals' }, u12: { value: 1, unit: 'goals' }, u14: { value: 1, unit: 'goals' }, u16: { value: 1, unit: 'goals' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-04', textKey: 'ch.selfTalk', descKey: 'ch.selfTalk.desc', tipsKey: 'ch.selfTalk.tips',
    emoji: '💬', category: 'mental', difficulty: 'easy', location: 'indoor', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'statements' }, u12: { value: 5, unit: 'statements' }, u14: { value: 5, unit: 'statements' }, u16: { value: 5, unit: 'statements' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-05', textKey: 'ch.breathingExercise', descKey: 'ch.breathingExercise.desc', tipsKey: 'ch.breathingExercise.tips',
    emoji: '🌬️', category: 'mental', difficulty: 'easy', location: 'indoor', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'min' }, u12: { value: 5, unit: 'min' }, u14: { value: 5, unit: 'min' }, u16: { value: 5, unit: 'min' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-06', textKey: 'ch.gratitudeJournal', descKey: 'ch.gratitudeJournal.desc',
    emoji: '📓', category: 'mental', difficulty: 'easy', location: 'indoor', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'items' }, u12: { value: 3, unit: 'items' }, u14: { value: 5, unit: 'items' }, u16: { value: 5, unit: 'items' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },
  {
    id: 'ch-ment-07', textKey: 'ch.teamEncouragement', descKey: 'ch.teamEncouragement.desc',
    emoji: '🤝', category: 'mental', difficulty: 'easy', location: 'anywhere', estimateMin: 3,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'messages' }, u12: { value: 1, unit: 'messages' }, u14: { value: 1, unit: 'messages' }, u16: { value: 1, unit: 'messages' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['no-partner'],
  },
  {
    id: 'ch-ment-08', textKey: 'ch.matchReview', descKey: 'ch.matchReview.desc',
    emoji: '📖', category: 'mental', difficulty: 'medium', location: 'indoor', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'reviews' }, u12: { value: 1, unit: 'reviews' }, u14: { value: 1, unit: 'reviews' }, u16: { value: 1, unit: 'reviews' } },
    period: 'daily', xpReward: 15, skillImpact: 'mental', tags: ['indoor', 'no-partner'],
  },

  // ═══════════════════════════════════════════════════
  //  KNOWLEDGE (4)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-know-01', textKey: 'ch.readArticle', descKey: 'ch.readArticle.desc',
    emoji: '📚', category: 'knowledge', difficulty: 'easy', location: 'indoor', estimateMin: 5,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'articles' }, u12: { value: 1, unit: 'articles' }, u14: { value: 1, unit: 'articles' }, u16: { value: 1, unit: 'articles' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },
  {
    id: 'ch-know-02', textKey: 'ch.completeQuiz', descKey: 'ch.completeQuiz.desc',
    emoji: '❓', category: 'knowledge', difficulty: 'easy', location: 'indoor', estimateMin: 3,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'quizzes' }, u12: { value: 1, unit: 'quizzes' }, u14: { value: 1, unit: 'quizzes' }, u16: { value: 1, unit: 'quizzes' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },
  {
    id: 'ch-know-03', textKey: 'ch.watchExerciseVideo', descKey: 'ch.watchExerciseVideo.desc',
    emoji: '🎬', category: 'knowledge', difficulty: 'easy', location: 'indoor', estimateMin: 10,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'videos' }, u12: { value: 1, unit: 'videos' }, u14: { value: 1, unit: 'videos' }, u16: { value: 1, unit: 'videos' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },
  {
    id: 'ch-know-04', textKey: 'ch.nutritionGoal', descKey: 'ch.nutritionGoal.desc',
    emoji: '🍎', category: 'knowledge', difficulty: 'easy', location: 'indoor', estimateMin: 3,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 1, unit: 'goals' }, u12: { value: 1, unit: 'goals' }, u14: { value: 1, unit: 'goals' }, u16: { value: 1, unit: 'goals' } },
    period: 'daily', xpReward: 15, skillImpact: 'knowledge', tags: ['indoor'],
  },

  // ═══════════════════════════════════════════════════
  //  WEEKLY (5)
  // ═══════════════════════════════════════════════════
  {
    id: 'ch-week-01', textKey: 'ch.weeklyTrainingSessions', descKey: 'ch.weeklyTrainingSessions.desc',
    emoji: '📅', category: 'physical', difficulty: 'medium', location: 'outdoor', estimateMin: 0,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'sessions' }, u12: { value: 4, unit: 'sessions' }, u14: { value: 5, unit: 'sessions' }, u16: { value: 5, unit: 'sessions' } },
    period: 'weekly', xpReward: 75, skillImpact: 'physical',
  },
  {
    id: 'ch-week-02', textKey: 'ch.weeklyXp', descKey: 'ch.weeklyXp.desc',
    emoji: '⭐', category: 'knowledge', difficulty: 'medium', location: 'anywhere', estimateMin: 0,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 100, unit: 'XP' }, u12: { value: 150, unit: 'XP' }, u14: { value: 200, unit: 'XP' }, u16: { value: 200, unit: 'XP' } },
    period: 'weekly', xpReward: 75, skillImpact: 'knowledge',
  },
  {
    id: 'ch-week-03', textKey: 'ch.weeklyMoodLog', descKey: 'ch.weeklyMoodLog.desc',
    emoji: '😊', category: 'mental', difficulty: 'easy', location: 'indoor', estimateMin: 0,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 5, unit: 'days' }, u12: { value: 5, unit: 'days' }, u14: { value: 7, unit: 'days' }, u16: { value: 7, unit: 'days' } },
    period: 'weekly', xpReward: 75, skillImpact: 'mental',
  },
  {
    id: 'ch-week-04', textKey: 'ch.weeklyDailyChallenges', descKey: 'ch.weeklyDailyChallenges.desc',
    emoji: '🏆', category: 'technical', difficulty: 'hard', location: 'anywhere', estimateMin: 0,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'days' }, u12: { value: 4, unit: 'days' }, u14: { value: 5, unit: 'days' }, u16: { value: 5, unit: 'days' } },
    period: 'weekly', xpReward: 75, skillImpact: 'technical',
  },
  {
    id: 'ch-week-05', textKey: 'ch.weeklyProgramDays', descKey: 'ch.weeklyProgramDays.desc',
    emoji: '📋', category: 'technical', difficulty: 'medium', location: 'outdoor', estimateMin: 0,
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    targets: { u10: { value: 3, unit: 'days' }, u12: { value: 4, unit: 'days' }, u14: { value: 5, unit: 'days' }, u16: { value: 5, unit: 'days' } },
    period: 'weekly', xpReward: 75, skillImpact: 'technical',
  },
]

