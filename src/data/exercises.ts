import type { Exercise } from '../engine/types'

/** Curated exercise library — hand-picked drills */
const curatedExercises: Exercise[] = [
  // ── Technical: Coerver-style ball mastery ──
  {
    id: 'tech-01', nameKey: 'ex.tech.juggling', descriptionKey: 'ex.tech.juggling.desc',
    category: 'technical', subSkill: 'ballControl', difficulty: 2, durationMinutes: 10,
    equipment: ['ballOnly'], positions: [], methodology: 'coerver',
  },
  {
    id: 'tech-02', nameKey: 'ex.tech.insideOutside', descriptionKey: 'ex.tech.insideOutside.desc',
    category: 'technical', subSkill: 'dribbling', difficulty: 2, durationMinutes: 10,
    equipment: ['ballOnly', 'cones'], positions: [], methodology: 'coerver',
  },
  {
    id: 'tech-03', nameKey: 'ex.tech.wallPass', descriptionKey: 'ex.tech.wallPass.desc',
    category: 'technical', subSkill: 'shortPass', difficulty: 1, durationMinutes: 10,
    equipment: ['ballOnly', 'wall'], positions: [], methodology: 'coerver',
  },
  {
    id: 'tech-04', nameKey: 'ex.tech.weakFootJuggle', descriptionKey: 'ex.tech.weakFootJuggle.desc',
    category: 'technical', subSkill: 'weakFoot', difficulty: 3, durationMinutes: 10,
    equipment: ['ballOnly'], positions: [], methodology: 'coerver',
  },
  {
    id: 'tech-05', nameKey: 'ex.tech.shootingDrill', descriptionKey: 'ex.tech.shootingDrill.desc',
    category: 'technical', subSkill: 'shooting', difficulty: 3, durationMinutes: 15,
    equipment: ['ballOnly', 'cones'], positions: ['ST', 'CAM', 'CM', 'LW', 'RW'], methodology: 'coerver',
  },

  // ── Physical: UEFA U12-U14 guidelines ──
  {
    id: 'phys-01', nameKey: 'ex.phys.agilityCourse', descriptionKey: 'ex.phys.agilityCourse.desc',
    category: 'physical', subSkill: 'agility', difficulty: 2, durationMinutes: 10,
    equipment: ['cones'], positions: [], methodology: 'uefa',
  },
  {
    id: 'phys-02', nameKey: 'ex.phys.sprintInterval', descriptionKey: 'ex.phys.sprintInterval.desc',
    category: 'physical', subSkill: 'speed', difficulty: 3, durationMinutes: 15,
    equipment: ['cones'], positions: [], methodology: 'uefa',
  },
  {
    id: 'phys-03', nameKey: 'ex.phys.coordination', descriptionKey: 'ex.phys.coordination.desc',
    category: 'physical', subSkill: 'coordination', difficulty: 1, durationMinutes: 10,
    equipment: ['none'], positions: [], methodology: 'uefa',
  },
  {
    id: 'phys-04', nameKey: 'ex.phys.balanceChallenge', descriptionKey: 'ex.phys.balanceChallenge.desc',
    category: 'physical', subSkill: 'balance', difficulty: 2, durationMinutes: 10,
    equipment: ['ballOnly'], positions: [], methodology: 'uefa',
  },
  {
    id: 'phys-05', nameKey: 'ex.phys.dynamicStretch', descriptionKey: 'ex.phys.dynamicStretch.desc',
    category: 'physical', subSkill: 'flexibility', difficulty: 1, durationMinutes: 10,
    equipment: ['none'], positions: [], methodology: 'uefa',
  },

  // ── Tactical: Horst Wein mini-games ──
  {
    id: 'tact-01', nameKey: 'ex.tact.3v1Rondo', descriptionKey: 'ex.tact.3v1Rondo.desc',
    category: 'tactical', subSkill: 'decisionMaking', difficulty: 2, durationMinutes: 15,
    equipment: ['ballOnly', 'partner'], positions: [], methodology: 'horstWein',
  },
  {
    id: 'tact-02', nameKey: 'ex.tact.positionShadow', descriptionKey: 'ex.tact.positionShadow.desc',
    category: 'tactical', subSkill: 'positioning', difficulty: 2, durationMinutes: 10,
    equipment: ['cones'], positions: ['CM', 'CDM', 'CAM'], methodology: 'horstWein',
  },
  {
    id: 'tact-03', nameKey: 'ex.tact.pressAndRecover', descriptionKey: 'ex.tact.pressAndRecover.desc',
    category: 'tactical', subSkill: 'pressing', difficulty: 3, durationMinutes: 15,
    equipment: ['ballOnly', 'partner'], positions: ['CM', 'CDM', 'LM', 'RM'], methodology: 'horstWein',
  },
  {
    id: 'tact-04', nameKey: 'ex.tact.findThePass', descriptionKey: 'ex.tact.findThePass.desc',
    category: 'tactical', subSkill: 'vision', difficulty: 3, durationMinutes: 15,
    equipment: ['ballOnly', 'cones', 'partner'], positions: ['CM', 'CAM'], methodology: 'horstWein',
  },
  {
    id: 'tact-05', nameKey: 'ex.tact.transitionGame', descriptionKey: 'ex.tact.transitionGame.desc',
    category: 'tactical', subSkill: 'transitions', difficulty: 4, durationMinutes: 20,
    equipment: ['ballOnly', 'partner'], positions: [], methodology: 'horstWein',
  },

  // ── Mental: Dan Abrahams 4C model ──
  {
    id: 'ment-01', nameKey: 'ex.ment.visualization', descriptionKey: 'ex.ment.visualization.desc',
    category: 'mental', subSkill: 'visualization', difficulty: 1, durationMinutes: 5,
    equipment: ['none'], positions: [], methodology: 'danAbrahams',
  },
  {
    id: 'ment-02', nameKey: 'ex.ment.selfTalk', descriptionKey: 'ex.ment.selfTalk.desc',
    category: 'mental', subSkill: 'selfTalk', difficulty: 1, durationMinutes: 5,
    equipment: ['none'], positions: [], methodology: 'danAbrahams',
  },
  {
    id: 'ment-03', nameKey: 'ex.ment.breatheFocus', descriptionKey: 'ex.ment.breatheFocus.desc',
    category: 'mental', subSkill: 'focus', difficulty: 1, durationMinutes: 5,
    equipment: ['none'], positions: [], methodology: 'danAbrahams',
  },
  {
    id: 'ment-04', nameKey: 'ex.ment.confidenceList', descriptionKey: 'ex.ment.confidenceList.desc',
    category: 'mental', subSkill: 'confidence', difficulty: 1, durationMinutes: 5,
    equipment: ['none'], positions: [], methodology: 'danAbrahams',
  },
  {
    id: 'ment-05', nameKey: 'ex.ment.preMatchRoutine', descriptionKey: 'ex.ment.preMatchRoutine.desc',
    category: 'mental', subSkill: 'composure', difficulty: 2, durationMinutes: 10,
    equipment: ['none'], positions: [], methodology: 'danAbrahams',
  },

  // ── Deep Practice: Talent Code style ──
  {
    id: 'deep-01', nameKey: 'ex.deep.slowDribble', descriptionKey: 'ex.deep.slowDribble.desc',
    category: 'technical', subSkill: 'dribbling', difficulty: 3, durationMinutes: 15,
    equipment: ['ballOnly', 'cones'], positions: [], methodology: 'talentCode',
  },
  {
    id: 'deep-02', nameKey: 'ex.deep.passAccuracy', descriptionKey: 'ex.deep.passAccuracy.desc',
    category: 'technical', subSkill: 'shortPass', difficulty: 3, durationMinutes: 15,
    equipment: ['ballOnly', 'wall'], positions: [], methodology: 'talentCode',
  },
  {
    id: 'deep-03', nameKey: 'ex.deep.firstTouchControl', descriptionKey: 'ex.deep.firstTouchControl.desc',
    category: 'technical', subSkill: 'firstTouch', difficulty: 3, durationMinutes: 10,
    equipment: ['ballOnly', 'wall'], positions: [], methodology: 'talentCode',
  },

  // ── Knowledge quizzes ──
  {
    id: 'know-01', nameKey: 'ex.know.offside', descriptionKey: 'ex.know.offside.desc',
    category: 'knowledge', subSkill: 'rules', difficulty: 1, durationMinutes: 5,
    equipment: ['none'], positions: [], methodology: 'uefa',
  },
  {
    id: 'know-02', nameKey: 'ex.know.nutrition', descriptionKey: 'ex.know.nutrition.desc',
    category: 'knowledge', subSkill: 'nutrition', difficulty: 1, durationMinutes: 5,
    equipment: ['none'], positions: [], methodology: 'uefa',
  },
]

/** All exercises — curated (+ generated in future), enriched with video data */
export const exercises: Exercise[] = curatedExercises
