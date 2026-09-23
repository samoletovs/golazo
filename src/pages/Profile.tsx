import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { getRank } from '../engine/xp'
import { fifaCardRatings, overallRating } from '../engine/skills'
import { renderFifaCard } from '../engine/fifaCard'
import { PhotoUpload } from '../components/PhotoUpload'
import { AchievementsList } from '../components/AchievementsList'
import { PersonalGoals } from '../components/PersonalGoals'
import { TeamPicker } from '../components/TeamPicker'
import { AcademyPage, AcademyPanel } from '../components/academy/AcademyPage'
import { AcademyTeams } from '../components/academy/AcademyTeams'
import { AcademyPhysicalHistory } from '../components/academy/AcademyPhysicalHistory'
import { TacticalGraphic } from '../components/academy/TacticalGraphic'

export function Profile() {
  const { t } = useTranslation()
  const { xp, skillTree, matches, trainings, profile } = useApp()
  const { showToast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [showTeams, setShowTeams] = useState(false)
  const ratings = fifaCardRatings(skillTree)
  const player = profile?.role === 'player'
  const goals = matches.reduce((sum, match) => sum + match.goals, 0)
  const assists = matches.reduce((sum, match) => sum + match.assists, 0)
  async function exportCard() {
    if (!profile) return
    setExporting(true)
    let url: string | undefined
    try {
      const blob = await renderFifaCard(profile, xp, skillTree, { matches: matches.length, goals, assists })
      const file = new File([blob], 'golazo-card.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: t('academy.playerRecord') })
      else {
        url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `golazo-${profile.name.toLowerCase().replace(/\s+/g, '-')}.png`
        link.click()
      }
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        console.error('Player record could not be exported:', cause)
        showToast(t('academy.exportError'), 'error')
      }
    } finally {
      if (url) URL.revokeObjectURL(url)
      setExporting(false)
    }
  }
  return <AcademyPage surface={`${profile?.role ?? 'player'}-profile`} title={t('profile.title')} subtitle={t('academy.profileIntro')}>
    <div className="academy-grid">
      <div className="academy-stack">
        <section className="academy-credential" aria-label={t('academy.playerRecord')}>
          <div className="academy-credential-main">
            <div><span className="academy-eyebrow">{t(player ? 'academy.playerRecord' : profile?.role === 'coach' ? 'coach.role' : 'login.asMentor')}</span>
              <h2>{profile?.name}</h2>
              <p>{player ? profile?.positions?.join(' / ') : [profile?.city, profile?.country].filter(Boolean).join(' · ')}</p>
              {player && <small>{t('dashboard.level', { level: xp.level })} · {t(getRank(xp.level).key)}</small>}
              <p className="mt-3">{profile?.teams?.find(team => team.isPrimary)?.name || profile?.team}</p>
            </div>
            <div>{profile?.photoUrl ? <img className="academy-credential-photo" src={profile.photoUrl} alt={profile.name} /> : <span className="academy-credential-number">{profile?.jerseyNumber ?? 'G'}</span>}</div>
          </div>
          {player && <dl className="academy-credential-ratings">{ratings.map(rating => <div key={rating.category}>
            <dt>{t(`skills.${rating.category}`)}</dt><dd>{rating.rating * 10}</dd>
            <div className="academy-rating-bar"><span style={{ width: `${rating.rating * 10}%` }} /></div>
          </div>)}</dl>}
        </section>
        {player && <>
          <dl className="academy-stat-line">
            <div><dt>{t('academy.overallSkill')}</dt><dd>{Math.round(overallRating(skillTree) * 10)}</dd></div>
            <div><dt>{t('dashboard.matches')}</dt><dd>{matches.length}</dd></div>
            <div><dt>{t('dashboard.goals')}</dt><dd>{goals}</dd></div>
            <div><dt>{t('dashboard.assists')}</dt><dd>{assists}</dd></div>
            <div><dt>{t('log.training')}</dt><dd>{trainings.length}</dd></div>
          </dl>
          <button className="academy-button secondary" onClick={exportCard} disabled={exporting}>{t(exporting ? 'common.loading' : 'profile.export')}</button>
        </>}
        <PhotoUpload />
        <AcademyTeams onManage={() => setShowTeams(true)} />
      </div>
      <div className="academy-stack">
        {player && <><TacticalGraphic kind={profile?.positions?.length ? 'position' : 'touch'} position={profile?.positions?.[0]} /><AcademyPanel><PersonalGoals /></AcademyPanel><AcademyPanel><AchievementsList /></AcademyPanel></>}
        {player && <AcademyPhysicalHistory />}
      </div>
    </div>
    {showTeams && <TeamPicker mode={profile?.role === 'coach' ? 'coach' : 'player'} onClose={() => setShowTeams(false)} />}
  </AcademyPage>
}
