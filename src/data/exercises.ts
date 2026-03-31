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

  // ── Tactical: solo decision-making & awareness drills ──
  {
    id: 'tact-01', nameKey: 'ex.tact.coneDecision', descriptionKey: 'ex.tact.coneDecision.desc',
    category: 'tactical', subSkill: 'decisionMaking', difficulty: 2, durationMinutes: 15,
    equipment: ['ballOnly', 'cones'], positions: [], methodology: 'horstWein',
  },
  {
    id: 'tact-02', nameKey: 'ex.tact.positionShadow', descriptionKey: 'ex.tact.positionShadow.desc',
    category: 'tactical', subSkill: 'positioning', difficulty: 2, durationMinutes: 10,
    equipment: ['cones'], positions: ['CM', 'CDM', 'CAM'], methodology: 'horstWein',
  },
  {
    id: 'tact-03', nameKey: 'ex.tact.defensiveAngles', descriptionKey: 'ex.tact.defensiveAngles.desc',
    category: 'tactical', subSkill: 'pressing', difficulty: 3, durationMinutes: 15,
    equipment: ['cones'], positions: ['CM', 'CDM', 'CB'], methodology: 'horstWein',
  },
  {
    id: 'tact-04', nameKey: 'ex.tact.targetZonePass', descriptionKey: 'ex.tact.targetZonePass.desc',
    category: 'tactical', subSkill: 'vision', difficulty: 3, durationMinutes: 15,
    equipment: ['ballOnly', 'cones', 'wall'], positions: ['CM', 'CAM'], methodology: 'horstWein',
  },
  {
    id: 'tact-05', nameKey: 'ex.tact.matchAnalysis', descriptionKey: 'ex.tact.matchAnalysis.desc',
    category: 'tactical', subSkill: 'gameReading', difficulty: 2, durationMinutes: 15,
    equipment: ['none'], positions: [], methodology: 'horstWein',
  },

  // ── Mental: Dan Abrahams 4C model ──
  {
    id: 'ment-01', nameKey: 'ex.ment.visualization', descriptionKey: 'ex.ment.visualization.desc',
    category: 'mental', subSkill: 'visualization', difficulty: 1, durationMinutes: 5,
    equipment: ['none'], positions: [], methodology: 'danAbrahams',
  },
  {
    id: 'ment-02', nameKey: 'ex.ment.selfTalk', descriptionKey: 'ex.ment.selfTalk.desc',
    category: 'mental', subSkill: 'resilience', difficulty: 1, durationMinutes: 5,
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
  {
    id: 'tech-06', nameKey: 'ex.tech.06', descriptionKey: 'ex.tech.06.desc',
    category: 'technical', subSkill: 'heading', difficulty: 2, durationMinutes: 10,
    equipment: ["ballOnly","partner"], positions: ["ST","CB"], methodology: 'coerver',
  },
  {
    id: 'phys-06', nameKey: 'ex.phys.06', descriptionKey: 'ex.phys.06.desc',
    category: 'physical', subSkill: 'strength', difficulty: 2, durationMinutes: 15,
    equipment: ["none"], positions: [], methodology: 'uefa',
  },
  {
    id: 'tech-07', nameKey: 'ex.tech.07', descriptionKey: 'ex.tech.07.desc',
    category: 'technical', subSkill: 'crossing', difficulty: 3, durationMinutes: 15,
    equipment: ["ballOnly","cones"], positions: ["LW","RW","LB","RB"], methodology: 'coerver',
  },
  {
    id: 'tech-08', nameKey: 'ex.tech.08', descriptionKey: 'ex.tech.08.desc',
    category: 'technical', subSkill: 'longPass', difficulty: 3, durationMinutes: 15,
    equipment: ["ballOnly","cones"], positions: ["CM","CDM","CB"], methodology: 'coerver',
  },
  {
    id: 'tech-09', nameKey: 'ex.tech.09', descriptionKey: 'ex.tech.09.desc',
    category: 'technical', subSkill: 'dribbling', difficulty: 2, durationMinutes: 10,
    equipment: ["ballOnly","cones"], positions: [], methodology: 'coerver',
  },
  {
    id: 'tech-10', nameKey: 'ex.tech.10', descriptionKey: 'ex.tech.10.desc',
    category: 'technical', subSkill: 'shooting', difficulty: 3, durationMinutes: 15,
    equipment: ["ballOnly","cones"], positions: ["ST","CAM","LW","RW"], methodology: 'coerver',
  },
  {
    id: 'phys-07', nameKey: 'ex.phys.07', descriptionKey: 'ex.phys.07.desc',
    category: 'physical', subSkill: 'speed', difficulty: 3, durationMinutes: 15,
    equipment: ["cones"], positions: [], methodology: 'uefa',
  },
  {
    id: 'phys-08', nameKey: 'ex.phys.08', descriptionKey: 'ex.phys.08.desc',
    category: 'physical', subSkill: 'stamina', difficulty: 3, durationMinutes: 20,
    equipment: ["cones"], positions: [], methodology: 'uefa',
  },
  {
    id: 'phys-09', nameKey: 'ex.phys.09', descriptionKey: 'ex.phys.09.desc',
    category: 'physical', subSkill: 'agility', difficulty: 2, durationMinutes: 10,
    equipment: ["cones"], positions: [], methodology: 'uefa',
  },
  {
    id: 'phys-10', nameKey: 'ex.phys.10', descriptionKey: 'ex.phys.10.desc',
    category: 'physical', subSkill: 'jumping', difficulty: 2, durationMinutes: 10,
    equipment: ["none"], positions: [], methodology: 'uefa',
  },
  {
    id: 'tact-06', nameKey: 'ex.tact.06', descriptionKey: 'ex.tact.06.desc',
    category: 'tactical', subSkill: 'offTheBall', difficulty: 2, durationMinutes: 10,
    equipment: ["cones"], positions: ["ST","CAM","LW","RW"], methodology: 'horstWein',
  },
  {
    id: 'tact-07', nameKey: 'ex.tact.07', descriptionKey: 'ex.tact.07.desc',
    category: 'tactical', subSkill: 'transitions', difficulty: 3, durationMinutes: 15,
    equipment: ["ballOnly","cones"], positions: ["CM","CDM","CAM"], methodology: 'horstWein',
  },
  {
    id: 'tact-08', nameKey: 'ex.tact.08', descriptionKey: 'ex.tact.08.desc',
    category: 'tactical', subSkill: 'setPlays', difficulty: 2, durationMinutes: 10,
    equipment: ["ballOnly","cones","wall"], positions: [], methodology: 'uefa',
  },
  {
    id: 'ment-06', nameKey: 'ex.ment.06', descriptionKey: 'ex.ment.06.desc',
    category: 'mental', subSkill: 'leadership', difficulty: 2, durationMinutes: 10,
    equipment: ["none"], positions: [], methodology: 'danAbrahams',
  },
  {
    id: 'ment-07', nameKey: 'ex.ment.07', descriptionKey: 'ex.ment.07.desc',
    category: 'mental', subSkill: 'motivation', difficulty: 1, durationMinutes: 5,
    equipment: ["none"], positions: [], methodology: 'danAbrahams',
  },
  {
    id: 'know-03', nameKey: 'ex.know.03', descriptionKey: 'ex.know.03.desc',
    category: 'knowledge', subSkill: 'warmUp', difficulty: 1, durationMinutes: 10,
    equipment: ["none"], positions: [], methodology: 'uefa',
  },
  {
    id: 'know-03b', nameKey: 'ex.know.03b', descriptionKey: 'ex.know.03b.desc',
    category: 'knowledge', subSkill: 'injuryPrevention', difficulty: 2, durationMinutes: 10,
    equipment: ["none"], positions: [], methodology: 'uefa',
  },
  {
    id: 'know-04', nameKey: 'ex.know.04', descriptionKey: 'ex.know.04.desc',
    category: 'knowledge', subSkill: 'formations', difficulty: 2, durationMinutes: 10,
    equipment: ["none"], positions: [], methodology: 'uefa',
  },
  {
    id: 'know-05', nameKey: 'ex.know.05', descriptionKey: 'ex.know.05.desc',
    category: 'knowledge', subSkill: 'videoAnalysis', difficulty: 3, durationMinutes: 15,
    equipment: ["none"], positions: [], methodology: 'horstWein',
  },
]

/** All exercises — curated (+ generated in future), enriched with video data */
export const exercises: Exercise[] = curatedExercises
