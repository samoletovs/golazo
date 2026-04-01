import { useState, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { awardXp, XP_AWARDS } from '../engine/xp'
import { articles } from '../data/articles'
import { programs } from '../data/programs'
import { getAgeTier } from '../engine/types'
import { WorkoutView } from '../components/WorkoutView'
import type { Article, ArticleCategory, TrainingProgram, QuizDifficulty, ReadArticle, ProgramProgress } from '../engine/types'

const Exercises = lazy(() => import('./Exercises').then(m => ({ default: m.Exercises })))

function tierToDifficulty(tier: string): QuizDifficulty {
  if (tier === 'u8') return 'u10'
  if (tier === 'u12') return 'u12'
  if (tier === 'u16') return 'u16'
  return 'u16'
}

const ARTICLE_CATEGORIES: { key: ArticleCategory | 'all'; labelKey: string; emoji: string }[] = [
  { key: 'all', labelKey: 'exercises.all', emoji: '📖' },
  { key: 'tactics', labelKey: 'learn.cat.tactics', emoji: '🧠' },
  { key: 'nutrition', labelKey: 'learn.cat.nutrition', emoji: '🍎' },
  { key: 'mental', labelKey: 'learn.cat.mental', emoji: '💪' },
  { key: 'rules', labelKey: 'learn.cat.rules', emoji: '📋' },
  { key: 'stories', labelKey: 'learn.cat.stories', emoji: '⭐' },
]

type LearnTab = 'articles' | 'programs' | 'exercises'

export function LearnContent() {
  const { t } = useTranslation()
  const { profile, readArticles, markArticleRead, xp, setXp, programProgress, updateProgramProgress } = useApp()
  const [tab, setTab] = useState<LearnTab>(() => {
    const saved = localStorage.getItem('golazo-learn-tab') as LearnTab | null
    return saved && ['articles', 'programs', 'exercises'].includes(saved) ? saved : 'articles'
  })

  useEffect(() => {
    localStorage.setItem('golazo-learn-tab', tab)
  }, [tab])
  const [categoryFilter, setCategoryFilter] = useState<ArticleCategory | 'all'>('all')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)

  const ageTier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
  const difficulty = tierToDifficulty(ageTier)

  // Filter articles by age tier and category
  const filteredArticles = articles.filter((a) => {
    if (!a.ageTiers.includes(difficulty)) return false
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
    return true
  })

  const readIds = new Set(readArticles.map((r) => r.articleId))

  function handleReadArticle(article: Article) {
    if (readIds.has(article.id)) return
    const entry: ReadArticle = { articleId: article.id, readAt: new Date().toISOString() }
    markArticleRead(entry)
    setXp(awardXp(xp, XP_AWARDS.completeExercise, new Date().toISOString().slice(0, 10), ageTier)) // 10 XP for reading
  }

  function handleStartProgram(program: TrainingProgram) {
    const existing = programProgress.find((p) => p.programId === program.id)
    if (existing) return
    const progress: ProgramProgress = {
      programId: program.id,
      startedAt: new Date().toISOString(),
      completedDays: 0,
      totalDays: program.durationWeeks * 5,
      lastActivityDate: '',
      currentWeek: 1,
      currentDay: 1,
      dayLog: [],
      status: 'active',
    }
    updateProgramProgress(progress)
  }

  function handleCompleteWorkout(programId: string, week: number, day: number, rating?: 1 | 2 | 3 | 4 | 5) {
    const existing = programProgress.find((p) => p.programId === programId)
    if (!existing) return
    const today = new Date().toISOString().slice(0, 10)
    if (existing.lastActivityDate === today) return

    const program = programs.find((p) => p.id === programId)
    const totalWeeks = program?.durationWeeks ?? 4
    const dayLog = [...(existing.dayLog || []), { week, day, completedAt: new Date().toISOString(), rating }]

    // Calculate next day/week
    let nextDay = day + 1
    let nextWeek = week
    if (nextDay > 5) { nextDay = 1; nextWeek = week + 1 }
    const isComplete = nextWeek > totalWeeks

    const updated: ProgramProgress = {
      ...existing,
      completedDays: existing.completedDays + 1,
      lastActivityDate: today,
      currentWeek: isComplete ? week : nextWeek,
      currentDay: isComplete ? day : nextDay,
      dayLog,
      status: isComplete ? 'completed' : 'active',
      completedAt: isComplete ? new Date().toISOString() : undefined,
    }
    updateProgramProgress(updated)
    // 20 XP for completing a workout day (+5 if rated)
    const xpAmount = rating ? XP_AWARDS.programDay + XP_AWARDS.workoutRating : XP_AWARDS.programDay
    setXp(awardXp(xp, xpAmount, today, ageTier))
  }

  // Filter programs by age tier
  const filteredPrograms = programs.filter((p) => p.ageTiers.includes(difficulty))

  return (
    <div className="flex flex-col gap-4 p-4 pb-32">
      <h2 className="text-xl font-extrabold">{t('nav.learn')}</h2>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          className="btn-choice tap-target flex-1 text-center text-sm"
          aria-pressed={tab === 'articles'}
          onClick={() => setTab('articles')}
        >
          📖 {t('learn.articles')}
        </button>
        <button
          className="btn-choice tap-target flex-1 text-center text-sm"
          aria-pressed={tab === 'programs'}
          onClick={() => setTab('programs')}
        >
          📋 {t('learn.programs')}
        </button>
        <button
          className="btn-choice tap-target flex-1 text-center text-sm"
          aria-pressed={tab === 'exercises'}
          onClick={() => setTab('exercises')}
        >
          ⚽ {t('learn.exercises')}
        </button>
      </div>

      {/* ── Exercises tab ── */}
      {tab === 'exercises' && (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><span className="text-3xl">⚽</span></div>}>
          <Exercises embedded />
        </Suspense>
      )}

      {/* ── Articles tab ── */}
      {tab === 'articles' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {ARTICLE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className="btn-choice tap-target text-xs px-3 py-1.5 whitespace-nowrap shrink-0"
                aria-pressed={categoryFilter === cat.key}
                onClick={() => setCategoryFilter(cat.key)}
              >
                {cat.emoji} {t(cat.labelKey)}
              </button>
            ))}
          </div>

          {/* Article list */}
          <div className="flex flex-col gap-3">
            {filteredArticles.map((article) => {
              const isRead = readIds.has(article.id)
              const isExpanded = expandedArticle === article.id

              return (
                <div key={article.id} className="card" style={{ opacity: isRead ? 0.7 : 1 }}>
                  <button
                    className="w-full text-left tap-target flex items-start gap-3"
                    onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                  >
                    <span className="text-2xl">{article.imageEmoji || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        {isRead && '✅ '}{t(article.titleKey)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                          {article.readingTimeMin} min
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#b45309' }}>
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 animate-fade-up" style={{ borderTop: '1px solid #e5e7eb' }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {t(article.bodyKey)}
                      </p>
                      {!isRead && (
                        <button
                          className="btn-primary tap-target w-full mt-3 text-sm"
                          onClick={() => handleReadArticle(article)}
                        >
                          {t('learn.markRead')} (+{XP_AWARDS.completeExercise} XP)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredArticles.length === 0 && (
              <div className="text-center py-8">
                <span className="text-3xl">📚</span>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  {t('learn.noArticles')}
                </p>
              </div>
            )}
          </div>

          {/* Reading progress */}
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {t('learn.readProgress')}
              </p>
            </div>
            <span className="stat-pill stat-pill-green text-sm font-black">
              {readArticles.length} / {articles.filter(a => a.ageTiers.includes(difficulty)).length}
            </span>
          </div>
        </>
      )}

      {/* ── Programs tab ── */}
      {tab === 'programs' && (
        <div className="flex flex-col gap-3">
          {filteredPrograms.map((program) => {
            const progress = programProgress.find((p) => p.programId === program.id)
            const isStarted = !!progress
            const isExpanded = expandedProgram === program.id
            const today = new Date().toISOString().slice(0, 10)
            const loggedToday = progress?.lastActivityDate === today
            const isComplete = progress?.status === 'completed' || (progress && progress.completedDays >= progress.totalDays)
            const hasWeeks = program.weeks && program.weeks.length > 0
            const currentWeek = progress?.currentWeek ?? 1
            const currentDay = progress?.currentDay ?? 1

            return (
              <div key={program.id} className="card">
                <button
                  className="w-full text-left tap-target flex items-start gap-3"
                  onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                >
                  <span className="text-2xl">{program.imageEmoji || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {isComplete ? '🏆 ' : ''}{t(program.titleKey)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {program.durationWeeks} {t('learn.weeks')} · {t(`learn.cat.${program.category}`)}
                      {isStarted && !isComplete && ` · ${t('prog.weekLabel', { n: currentWeek })} ${t('prog.dayLabel', { n: currentDay })}`}
                    </p>
                    {isStarted && progress && (
                      <div className="mt-2">
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min((progress.completedDays / progress.totalDays) * 100, 100)}%`,
                              background: 'var(--color-primary)',
                            }}
                          />
                        </div>
                        <p className="text-[10px] mt-1 font-data" style={{ color: 'var(--color-text-muted)' }}>
                          {progress.completedDays} / {progress.totalDays} {t('learn.days')}
                        </p>
                      </div>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 animate-fade-up" style={{ borderTop: '1px solid #e5e7eb' }}>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {t(program.descriptionKey)}
                    </p>

                    {/* Not started → Start button */}
                    {!isStarted && (
                      <button
                        className="btn-primary tap-target w-full text-sm"
                        onClick={() => handleStartProgram(program)}
                      >
                        {t('learn.startProgram')}
                      </button>
                    )}

                    {/* Started + has weeks → Show week/day nav + WorkoutView */}
                    {isStarted && !isComplete && hasWeeks && (
                      <>
                        {/* Week selector */}
                        <div className="flex gap-1 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                          {program.weeks!.map((w) => {
                            const isCurrent = w.weekNumber === currentWeek
                            const isPast = w.weekNumber < currentWeek
                            return (
                              <div
                                key={w.weekNumber}
                                className="text-[10px] px-2 py-1 rounded-full whitespace-nowrap font-bold"
                                style={{
                                  background: isCurrent ? 'var(--color-primary)' : isPast ? 'var(--color-primary-bg)' : '#f3f4f6',
                                  color: isCurrent ? '#fff' : isPast ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                                }}
                              >
                                {t('prog.weekLabel', { n: w.weekNumber })} {isPast ? '✓' : ''}
                              </div>
                            )
                          })}
                        </div>

                        {/* Day grid */}
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((d) => {
                            const isToday = d === currentDay && !loggedToday
                            const isDone = (progress.dayLog || []).some((dl) => dl.week === currentWeek && dl.day === d)
                            const isFuture = d > currentDay
                            return (
                              <div
                                key={d}
                                className="flex-1 text-center text-[10px] py-1.5 rounded-lg font-bold"
                                style={{
                                  background: isDone ? 'var(--color-primary-bg)' : isToday ? 'var(--color-primary)' : '#f9fafb',
                                  color: isDone ? 'var(--color-primary-dark)' : isToday ? '#fff' : isFuture ? '#d1d5db' : 'var(--color-text-muted)',
                                }}
                              >
                                {isDone ? '✓' : `D${d}`}
                              </div>
                            )
                          })}
                        </div>

                        {/* Today's workout */}
                        {(() => {
                          const weekData = program.weeks!.find((w) => w.weekNumber === currentWeek)
                          const dayData = weekData?.days.find((d) => d.dayNumber === currentDay)
                          if (!dayData) return null
                          return (
                            <WorkoutView
                              weekNumber={currentWeek}
                              day={dayData}
                              isCompleted={isComplete ?? false}
                              alreadyLoggedToday={loggedToday ?? false}
                              onComplete={(rating) => handleCompleteWorkout(program.id, currentWeek, currentDay, rating)}
                            />
                          )
                        })()}
                      </>
                    )}

                    {/* Completed → celebration */}
                    {isComplete && (
                      <div className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ background: 'var(--color-primary-bg-subtle)' }}>
                        <span className="text-3xl">🏆</span>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                          {t('learn.programComplete')}
                        </p>
                        {program.skillImpact && (
                          <div className="flex gap-2 flex-wrap justify-center">
                            {Object.entries(program.skillImpact).map(([cat, val]) => (
                              <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#dcfce7', color: '#166534' }}>
                                {t(`learn.cat.${cat}`)} ↑ +{val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
