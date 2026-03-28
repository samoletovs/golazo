import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { createInitialSkillTree, updateSkillRating } from '../engine/skills'
import type { AccountRole, Position, DominantFoot, SkillCategory, Language, PhysicalMeasurement, SkillTree } from '../engine/types'

type Step = 'role' | 'basics' | 'football' | 'physical' | 'assessment' | 'done'

const STEPS: Step[] = ['role', 'basics', 'football', 'physical', 'assessment', 'done']

const POSITION_OPTIONS: { key: Position; emoji: string }[] = [
  { key: 'GK', emoji: '🧤' },
  { key: 'CB', emoji: '🛡️' },
  { key: 'LB', emoji: '⬅️' },
  { key: 'RB', emoji: '➡️' },
  { key: 'CDM', emoji: '🔒' },
  { key: 'CM', emoji: '⚙️' },
  { key: 'CAM', emoji: '🎯' },
  { key: 'LW', emoji: '💨' },
  { key: 'RW', emoji: '💨' },
  { key: 'ST', emoji: '⚡' },
]

const FOOT_OPTIONS: { key: DominantFoot; labelKey: string }[] = [
  { key: 'right', labelKey: 'onboarding.footRight' },
  { key: 'left', labelKey: 'onboarding.footLeft' },
  { key: 'both', labelKey: 'onboarding.footBoth' },
]

const SKILL_ASSESS: { cat: SkillCategory; emoji: string; labelKey: string }[] = [
  { cat: 'technical', emoji: '⚽', labelKey: 'skills.technical' },
  { cat: 'physical', emoji: '🏃', labelKey: 'skills.physical' },
  { cat: 'tactical', emoji: '🧠', labelKey: 'skills.tactical' },
  { cat: 'mental', emoji: '💪', labelKey: 'skills.mental' },
  { cat: 'knowledge', emoji: '📚', labelKey: 'skills.knowledge' },
]

const ASSESS_LABELS = [
  'onboarding.assessBeginner',
  'onboarding.assessBasic',
  'onboarding.assessIntermediate',
  'onboarding.assessAdvanced',
  'onboarding.assessExpert',
]

interface OnboardingForm {
  role: AccountRole
  name: string
  birthDate: string
  team: string
  positions: Position[]
  dominantFoot: DominantFoot
  yearsPlaying: number
  heightCm: string
  weightKg: string
  sprintTime100m: string
  juggleRecord: string
  assessment: Partial<Record<SkillCategory, number>>
}

function prefillSkillTree(
  playerId: string,
  assessment: Partial<Record<SkillCategory, number>>,
  yearsPlaying: number,
): SkillTree {
  let tree = createInitialSkillTree(playerId)

  // Each self-assessment level (1-5) maps to a base rating (1-2, 2-4, 3-6, 5-7, 7-9)
  const baseFromAssessment = (level: number): number => {
    const bases = [1, 2, 4, 6, 8]
    return bases[Math.min(level - 1, 4)] ?? 1
  }

  // Years playing adds a small bonus (0.5 per year, max +2)
  const yearsBonus = Math.min(yearsPlaying * 0.5, 2)

  for (const [cat, level] of Object.entries(assessment)) {
    const base = baseFromAssessment(level as number) + yearsBonus
    const clamped = Math.min(Math.round(base), 10)
    const category = cat as SkillCategory
    // Set all sub-skills in this category to the base rating
    const catRatings = tree.ratings.filter((r) => r.category === category)
    for (const r of catRatings) {
      tree = updateSkillRating(tree, category, r.subSkill, clamped)
    }
  }

  return tree
}

export function OnboardingPage() {
  const { t, i18n } = useTranslation()
  const { setProfile, setSkillTree, setPhysicalProfile, setOnboardingComplete } = useApp()
  const { user } = useAuth()

  const [step, setStep] = useState<Step>('role')
  const [form, setForm] = useState<OnboardingForm>({
    role: 'player',
    name: '',
    birthDate: '',
    team: '',
    positions: [],
    dominantFoot: 'right',
    yearsPlaying: 0,
    heightCm: '',
    weightKg: '',
    sprintTime100m: '',
    juggleRecord: '',
    assessment: {},
  })

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100

  function next() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function back() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  function togglePosition(pos: Position) {
    setForm((f) => ({
      ...f,
      positions: f.positions.includes(pos)
        ? f.positions.filter((p) => p !== pos)
        : [...f.positions, pos],
    }))
  }

  function setAssessment(cat: SkillCategory, level: number) {
    setForm((f) => ({
      ...f,
      assessment: { ...f.assessment, [cat]: level },
    }))
  }

  function finishOnboarding() {
    const now = new Date().toISOString()
    const playerId = user?.userId ?? 'local'

    // Create profile
    setProfile({
      id: playerId,
      familyId: playerId,
      role: form.role,
      name: form.name || 'Player',
      birthDate: form.birthDate,
      team: form.team,
      positions: form.positions.length > 0 ? form.positions : ['CM'],
      dominantFoot: form.dominantFoot,
      language: i18n.language as Language,
      createdAt: now,
    })

    // Create physical profile
    const physical: PhysicalMeasurement = {
      heightCm: parseFloat(form.heightCm) || 0,
      weightKg: parseFloat(form.weightKg) || 0,
      sprintTime100m: form.sprintTime100m ? parseFloat(form.sprintTime100m) : undefined,
      juggleRecord: form.juggleRecord ? parseInt(form.juggleRecord, 10) : undefined,
      measuredAt: now,
    }
    setPhysicalProfile({ measurements: [physical], latestIndex: 0 })

    // Prefill skill tree from assessment
    const tree = prefillSkillTree(playerId, form.assessment, form.yearsPlaying)
    setSkillTree(tree)

    setOnboardingComplete(true)
  }

  return (
    <div className="flex flex-col min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <div className="app-shell flex flex-col min-h-dvh">
        {/* Progress bar */}
        <div className="p-4 pb-0">
          <div className="progress-track" style={{ height: '4px' }}>
            <div
              className="progress-fill"
              style={{ width: `${progress}%`, background: 'var(--color-green-500)' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {stepIndex + 1} / {STEPS.length}
            </span>
            {stepIndex > 0 && (
              <button
                className="text-xs font-bold"
                style={{ color: 'var(--color-green-500)' }}
                onClick={back}
                aria-label={t('common.back')}
              >
                ← {t('common.back')}
              </button>
            )}
          </div>
        </div>

        {/* Step content */}
        <main className="flex-1 p-4 overflow-y-auto">
          {step === 'role' && (
            <div className="flex flex-col gap-4 animate-fade-up">
              <h2 className="text-xl font-extrabold">{t('onboarding.welcome')}</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {t('onboarding.whoAreYou')}
              </p>
              <div className="flex flex-col gap-3 mt-2">
                <button
                  className="login-card tap-target"
                  onClick={() => { setForm((f) => ({ ...f, role: 'player' })); next() }}
                  aria-label={t('onboarding.iAmPlayer')}
                >
                  <span className="text-3xl">🏃</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">{t('onboarding.iAmPlayer')}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t('onboarding.playerHint')}
                    </p>
                  </div>
                </button>
                <button
                  className="login-card tap-target"
                  onClick={() => { setForm((f) => ({ ...f, role: 'mentor' })); next() }}
                  aria-label={t('onboarding.iAmMentor')}
                >
                  <span className="text-3xl">👨‍👦</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">{t('onboarding.iAmMentor')}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t('onboarding.mentorHint')}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'basics' && (
            <div className="flex flex-col gap-4 animate-fade-up">
              <h2 className="text-xl font-extrabold">
                {form.role === 'mentor' ? t('onboarding.aboutPlayer') : t('onboarding.aboutYou')}
              </h2>
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.name')}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={t('onboarding.namePlaceholder')}
                  className="w-full"
                />

                <label className="text-xs font-bold mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.birthDate')}
                </label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                  className="w-full"
                />

                <label className="text-xs font-bold mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.team')}
                </label>
                <input
                  type="text"
                  value={form.team}
                  onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
                  placeholder={t('onboarding.teamPlaceholder')}
                  className="w-full"
                />

                <label className="text-xs font-bold mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.yearsPlaying')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={form.yearsPlaying}
                    onChange={(e) => setForm((f) => ({ ...f, yearsPlaying: parseInt(e.target.value, 10) }))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold font-data w-8 text-center">{form.yearsPlaying}</span>
                </div>
              </div>

              <button
                className="btn-primary mt-4 w-full"
                onClick={next}
                disabled={!form.name}
              >
                {t('onboarding.continue')}
              </button>
            </div>
          )}

          {step === 'football' && (
            <div className="flex flex-col gap-4 animate-fade-up">
              <h2 className="text-xl font-extrabold">{t('onboarding.footballProfile')}</h2>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.dominantFoot')}
                </label>
                <div className="flex gap-2">
                  {FOOT_OPTIONS.map((f) => (
                    <button
                      key={f.key}
                      className="btn-choice tap-target flex-1 text-center text-sm"
                      aria-pressed={form.dominantFoot === f.key}
                      onClick={() => setForm((prev) => ({ ...prev, dominantFoot: f.key }))}
                    >
                      {t(f.labelKey)}
                    </button>
                  ))}
                </div>

                <label className="text-xs font-bold mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.positions')}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {POSITION_OPTIONS.map((p) => (
                    <button
                      key={p.key}
                      className="btn-choice tap-target text-center text-xs py-2"
                      aria-pressed={form.positions.includes(p.key)}
                      onClick={() => togglePosition(p.key)}
                    >
                      <span className="block text-lg">{p.emoji}</span>
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn-primary mt-4 w-full"
                onClick={next}
              >
                {t('onboarding.continue')}
              </button>
            </div>
          )}

          {step === 'physical' && (
            <div className="flex flex-col gap-4 animate-fade-up">
              <h2 className="text-xl font-extrabold">{t('onboarding.physical')}</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('onboarding.physicalHint')}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('onboarding.height')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.heightCm}
                      onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                      placeholder="150"
                      className="w-full pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-text-muted)' }}>cm</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('onboarding.weight')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.weightKg}
                      onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                      placeholder="45"
                      className="w-full pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-text-muted)' }}>kg</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.sprint')} <span style={{ color: 'var(--color-text-muted)' }}>({t('onboarding.optional')})</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={form.sprintTime100m}
                    onChange={(e) => setForm((f) => ({ ...f, sprintTime100m: e.target.value }))}
                    placeholder="14.5"
                    className="w-full pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-text-muted)' }}>sec</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('onboarding.juggleRecord')} <span style={{ color: 'var(--color-text-muted)' }}>({t('onboarding.optional')})</span>
                </label>
                <input
                  type="number"
                  value={form.juggleRecord}
                  onChange={(e) => setForm((f) => ({ ...f, juggleRecord: e.target.value }))}
                  placeholder="25"
                  className="w-full"
                />
              </div>

              <button
                className="btn-primary mt-4 w-full"
                onClick={next}
              >
                {t('onboarding.continue')}
              </button>
            </div>
          )}

          {step === 'assessment' && (
            <div className="flex flex-col gap-4 animate-fade-up">
              <h2 className="text-xl font-extrabold">{t('onboarding.selfAssessment')}</h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('onboarding.assessHint')}
              </p>

              <div className="flex flex-col gap-4">
                {SKILL_ASSESS.map((skill) => (
                  <div key={skill.cat} className="card">
                    <p className="text-sm font-bold mb-2">
                      {skill.emoji} {t(skill.labelKey)}
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          className="assess-btn tap-target flex-1 text-center"
                          data-selected={form.assessment[skill.cat] === level}
                          onClick={() => setAssessment(skill.cat, level)}
                          aria-label={`${t(skill.labelKey)} - ${t(ASSESS_LABELS[level - 1])}`}
                          aria-pressed={form.assessment[skill.cat] === level}
                        >
                          <span className="block text-lg font-bold font-data">{level}</span>
                          <span className="block text-[0.6rem] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                            {t(ASSESS_LABELS[level - 1])}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary mt-4 w-full"
                onClick={() => { finishOnboarding(); next() }}
                disabled={Object.keys(form.assessment).length < SKILL_ASSESS.length}
              >
                {t('onboarding.finish')}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 animate-fade-up pt-12">
              <span className="text-6xl animate-achievement">🎉</span>
              <h2 className="text-2xl font-extrabold text-gradient-green">{t('onboarding.allSet')}</h2>
              <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                {t('onboarding.doneMsg')}
              </p>
              <div className="card-glow text-center mt-4">
                <p className="text-sm font-bold">{form.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {form.positions.join(' / ')} • {form.team}
                </p>
                {form.heightCm && form.weightKg && (
                  <p className="text-xs mt-1 font-data" style={{ color: 'var(--color-text-muted)' }}>
                    {form.heightCm} cm • {form.weightKg} kg
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
