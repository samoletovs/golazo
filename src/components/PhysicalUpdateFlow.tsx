import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import type { AgeTier } from '../engine/types'
import { getAgeTier } from '../engine/types'
import { getTrackedFieldConfigs, buildMeasurement, PHYSICAL_GROUPS, type PhysicalFieldKey } from '../engine/physical'

interface Props {
  onClose: () => void
}

export function PhysicalUpdateFlow({ onClose }: Props) {
  const { t } = useTranslation()
  const { profile, physicalProfile, setPhysicalProfile } = useApp()

  const tier: AgeTier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
  const fields = getTrackedFieldConfigs(physicalProfile, tier)
  const groups = [...new Set(fields.map((f) => f.group))]

  // Pre-fill with latest measurement values
  const latest = physicalProfile?.measurements[physicalProfile.latestIndex]
  const [values, setValues] = useState<Partial<Record<PhysicalFieldKey, string>>>(() => {
    const init: Partial<Record<PhysicalFieldKey, string>> = {}
    if (latest) {
      for (const field of fields) {
        const val = latest[field.key]
        if (val !== null && val !== undefined && val !== 0) {
          init[field.key] = String(val)
        }
      }
    }
    return init
  })

  function save() {
    const measurement = buildMeasurement(values)

    const existing = physicalProfile?.measurements ?? []
    setPhysicalProfile({
      measurements: [...existing, measurement],
      latestIndex: existing.length,
      trackedFields: physicalProfile?.trackedFields,
    })
    onClose()
  }

  // Show delta from previous value
  function renderDelta(key: PhysicalFieldKey, currentVal: string) {
    if (!latest) return null
    const prev = latest[key]
    const curr = parseFloat(currentVal)
    if (prev === null || prev === undefined || isNaN(curr) || curr === 0) return null
    const diff = curr - (prev as number)
    if (Math.abs(diff) < 0.01) return null
    const isPositive = diff > 0
    // For sprint/agility times, lower is better
    const lowerIsBetter = key === 'sprintTime10m' || key === 'sprintTime20m' || key === 'sprintTime30m' || key === 'agilityCourseTime' || key === 'restingHeartRate'
    const isGood = lowerIsBetter ? !isPositive : isPositive
    return (
      <span className="text-xs font-bold font-data ml-1" style={{ color: isGood ? 'var(--color-primary-dark)' : 'var(--color-danger)' }}>
        {isPositive ? '+' : ''}{diff.toFixed(1)}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="w-full max-w-lg rounded-t-2xl overflow-y-auto"
        style={{
          background: 'var(--color-bg)',
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div className="p-4 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t('physical.updateTitle')}</h2>
            <button
              className="text-sm font-bold tap-target"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={onClose}
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('physical.updateHint')}
          </p>

          {/* Fields by group */}
          {groups.map((group) => {
            const groupFields = fields.filter((f) => f.group === group)
            const groupInfo = PHYSICAL_GROUPS[group]
            return (
              <div key={group}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {groupInfo.emoji} {t(groupInfo.labelKey)}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {groupFields.map((field) => (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className="text-xs font-bold flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
                        {t(field.labelKey)}
                        {renderDelta(field.key, values[field.key] ?? '')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step={field.step ?? '1'}
                          min={field.min}
                          max={field.max}
                          value={values[field.key] ?? ''}
                          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-text-muted)' }}>{field.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Save */}
          <button className="btn-primary w-full mt-2" onClick={save}>
            {t('physical.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
