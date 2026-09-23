import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../../contexts/AppContext'
import { getAgeTier } from '../../engine/types'
import { getTrackedFieldConfigs, PHYSICAL_GROUPS } from '../../engine/physical'
import type { PhysicalFieldKey } from '../../engine/physical'
import { PhysicalUpdateFlow } from '../PhysicalUpdateFlow'
import { TrackedFieldsEditor } from '../TrackedFieldsEditor'
import { AcademyPanel } from './AcademyPage'

const LOWER_IS_BETTER = new Set<PhysicalFieldKey>(['sprintTime10m', 'sprintTime20m', 'sprintTime30m', 'agilityCourseTime', 'restingHeartRate', 'bodyFatPct'])

export function AcademyPhysicalHistory() {
  const { t, i18n } = useTranslation()
  const { profile, physicalProfile } = useApp()
  const [update, setUpdate] = useState(false)
  const [customize, setCustomize] = useState(false)
  const measurements = physicalProfile?.measurements ?? []
  const current = measurements[physicalProfile?.latestIndex ?? 0]
  const previous = measurements[(physicalProfile?.latestIndex ?? 0) - 1]
  const fields = getTrackedFieldConfigs(physicalProfile, profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12')
  const groups = [...new Set(fields.map(field => field.group))]
  return <AcademyPanel title={t('profile.physical')}>
    <div className="academy-actions mb-6">
      <button className="academy-button secondary" onClick={() => setUpdate(true)}>{t('physical.update')}</button>
      <button className="academy-link" onClick={() => setCustomize(true)}>{t('physical.customize')}</button>
    </div>
    {current ? <>
      <p className="academy-muted mb-5">{t('physical.lastUpdated', { date: new Date(current.measuredAt).toLocaleDateString(i18n.language) })} · {t('physical.measurementCount', { count: measurements.length })}</p>
      <div className="academy-stack">{groups.map(group => {
        const visible = fields.filter(field => field.group === group && typeof current[field.key] === 'number' && current[field.key] !== 0)
        if (!visible.length) return null
        return <section key={group}><h3>{t(PHYSICAL_GROUPS[group].labelKey)}</h3><dl className="academy-measurements">
          {visible.map(field => {
            const value = current[field.key]
            const old = previous?.[field.key]
            const diff = typeof value === 'number' && typeof old === 'number' && old !== 0 ? value - old : 0
            const improved = LOWER_IS_BETTER.has(field.key) ? diff < 0 : diff > 0
            return <div key={field.key}><dt>{t(field.labelKey)}</dt><dd>{value} <small>{field.unit}</small>
              {diff !== 0 && <small className="academy-measurement-diff" style={{ color: improved ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{diff > 0 ? '+' : '−'}{Math.abs(diff).toFixed(field.unit === 'sec' ? 2 : field.unit === '%' || field.unit === 'kg' ? 1 : 0)}</small>}
            </dd></div>
          })}
        </dl></section>
      })}</div>
    </> : <p className="academy-muted">{t('physical.reminderNever')}</p>}
    {update && <PhysicalUpdateFlow onClose={() => setUpdate(false)} />}
    {customize && <TrackedFieldsEditor onClose={() => setCustomize(false)} />}
  </AcademyPanel>
}
