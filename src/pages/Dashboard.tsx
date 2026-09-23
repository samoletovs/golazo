import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { getAgeTier, getMatchResult } from '../engine/types'
import { getRank } from '../engine/xp'
import { isPhysicalUpdateDue } from '../engine/physical'
import { PhysicalUpdateFlow } from '../components/PhysicalUpdateFlow'
import { LevelUpCelebration } from '../components/LevelUpCelebration'
import { WeeklyGoalRing } from '../components/WeeklyGoalRing'
import { CoachCard } from '../components/CoachCard'
import { AnnouncementFeed } from '../components/AnnouncementFeed'
import { QuoteCard } from '../components/QuoteCard'
import { AcademyPage, AcademyPanel } from '../components/academy/AcademyPage'
import { AcademyWeekboard } from '../components/academy/AcademyWeekboard'
import { AcademyDailyPractice } from '../components/academy/AcademyDailyPractice'
import { AcademyTournamentDiscovery } from '../components/academy/AcademyTournamentDiscovery'
import { TacticalGraphic } from '../components/academy/TacticalGraphic'
import { AcademySeasonComparison } from '../components/academy/AcademySeasonComparison'

export function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t, i18n } = useTranslation()
  const { matches, trainings, xp, profile, physicalProfile } = useApp()
  const [previousLevel, setPreviousLevel] = useState(xp.level)
  const [showLevel, setShowLevel] = useState(false)
  const [logging, setLogging] = useState(false)
  const [physicalOpen, setPhysicalOpen] = useState(false)
  const [physicalDismissed, setPhysicalDismissed] = useState(false)
  useEffect(() => {
    if (xp.level > previousLevel) setShowLevel(true)
    setPreviousLevel(xp.level)
  }, [xp.level, previousLevel])
  const latest = [...matches].sort((a, b) => b.date.localeCompare(a.date))[0]
  const young = profile?.birthDate && getAgeTier(profile.birthDate) === 'u8'
  const measurementDue = !young && !physicalDismissed && isPhysicalUpdateDue(physicalProfile?.measurements[physicalProfile.latestIndex]?.measuredAt)
  return <AcademyPage surface="player-home" title={t('academy.weekTitle')} subtitle={t('academy.weekIntro')}
    actions={<button className="academy-button" onClick={() => onNavigate?.('log')}>{t('nav.log')} <span aria-hidden="true">↗</span></button>}>
    <AcademyWeekboard onNavigate={onNavigate} onLoggingChange={setLogging} />
    <div className="academy-grid">
      <div className="academy-stack">
        <AcademyPanel title={t('academy.lastMatch')}>
          {latest ? <>
            <p className="academy-muted">{new Date(`${latest.date.slice(0, 10)}T12:00:00`).toLocaleDateString(i18n.language)} · {latest.competition}</p>
            <div className="academy-score"><span>{latest.scoreUs}</span><span aria-hidden="true">:</span><span>{latest.scoreThem}</span></div>
            <h3>{latest.playingFor || profile?.team} · {latest.opponent}</h3>
            {latest.bestMoment && <p className="mt-4">{latest.bestMoment}</p>}
          </> : <><h3>{t('academy.noMatches')}</h3><p className="academy-muted mt-4">{t('academy.noMatchesBody')}</p></>}
          <button className="academy-link mt-4" onClick={() => onNavigate?.(latest ? 'progress' : 'log')}>{t(latest ? 'nav.progress' : 'log.match')} →</button>
        </AcademyPanel>
        <section>
          <h2 className="mb-5">{t('academy.recordedSeason')}</h2>
          <dl className="academy-stat-line">
            <div><dt>{t('dashboard.matches')}</dt><dd>{matches.length}</dd></div>
            <div><dt>{t('dashboard.goals')}</dt><dd>{matches.reduce((sum, item) => sum + item.goals, 0)}</dd></div>
            {!young && <><div><dt>{t('dashboard.assists')}</dt><dd>{matches.reduce((sum, item) => sum + item.assists, 0)}</dd></div>
              <div><dt>{t('dashboard.wins')}</dt><dd>{matches.filter(item => getMatchResult(item) === 'win').length}</dd></div></>}
            <div><dt>{t('log.training')}</dt><dd>{trainings.length}</dd></div>
          </dl>
          {!young && <AcademySeasonComparison />}
        </section>
        <WeeklyGoalRing />
        <AnnouncementFeed />
        <AcademyTournamentDiscovery onNavigate={onNavigate} />
        <CoachCard />
      </div>
      <div className="academy-stack">
        <AcademyPanel className="dark">
          <span className="academy-eyebrow">{t(getRank(xp.level).key)} · {t('dashboard.level', { level: xp.level })}</span>
          <h2 className="mt-4">{t('academy.practiceTitle')}</h2>
          <p className="mt-4">{t('academy.practiceBody')}</p>
          <div className="mt-6 mb-5"><TacticalGraphic kind="pass" /></div>
          <button className="academy-button coral" onClick={() => onNavigate?.('learn')}>{t('nav.learn')} →</button>
          <p className="mt-6 text-sm">{xp.currentLevelXp} / {xp.nextLevelXp} XP</p>
          <div className="xp-bar-track mt-2"><div className="xp-bar-fill" style={{ width: `${xp.nextLevelXp > 0 ? Math.min(100, xp.currentLevelXp / xp.nextLevelXp * 100) : 100}%`, background: 'var(--color-coral)' }} /></div>
        </AcademyPanel>
        <AcademyDailyPractice onNavigate={onNavigate} />
        {measurementDue && <AcademyPanel title={t('physical.reminderTitle')}>
          <div className="academy-actions"><button className="academy-button secondary" onClick={() => setPhysicalOpen(true)}>{t('physical.update')}</button><button className="academy-link" onClick={() => setPhysicalDismissed(true)}>{t('physical.later')}</button></div>
        </AcademyPanel>}
        <QuoteCard />
      </div>
    </div>
    {physicalOpen && <PhysicalUpdateFlow onClose={() => setPhysicalOpen(false)} />}
    {showLevel && !logging && <LevelUpCelebration level={xp.level} onClose={() => setShowLevel(false)} />}
  </AcademyPage>
}
