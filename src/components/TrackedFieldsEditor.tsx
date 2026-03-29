import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import type { AgeTier } from '../engine/types'
import { getAgeTier } from '../engine/types'
import { PHYSICAL_FIELDS, PHYSICAL_GROUPS, getDefaultTrackedFields, type PhysicalFieldKey } from '../engine/physical'

interface Props {
  onClose: () => void
}

export function TrackedFieldsEditor({ onClose }: Props) {
  const { t } = useTranslation()
  const { profile, physicalProfile, setPhysicalProfile } = useApp()

  const tier: AgeTier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
  const defaults = getDefaultTrackedFields(tier)

  const [tracked, setTracked] = useState<PhysicalFieldKey[]>(() => {
    if (physicalProfile?.trackedFields && physicalProfile.trackedFields.length > 0) {
      return physicalProfile.trackedFields as PhysicalFieldKey[]
    }
    return defaults
  })

  const allGroups = [...new Set(PHYSICAL_FIELDS.map((f) => f.group))]

  function toggle(key: PhysicalFieldKey) {
    const field = PHYSICAL_FIELDS.find((f) => f.key === key)
    if (field?.required) return
    setTracked((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function resetToDefaults() {
    setTracked(defaults)
  }

  function save() {
    if (!physicalProfile) {
      onClose()
      return
    }
    setPhysicalProfile({
      ...physicalProfile,
      trackedFields: tracked,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="w-full max-w-lg rounded-t-2xl overflow-y-auto"
        style={{
          background: 'var(--color-bg)',
          maxHeight: '85vh',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div className="p-4 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{t('physical.customizeTitle')}</h2>
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
            {t('physical.customizeHint')}
          </p>

          {/* Field toggles by group */}
          {allGroups.map((group) => {
            const groupFields = PHYSICAL_FIELDS.filter((f) => f.group === group)
            const groupInfo = PHYSICAL_GROUPS[group]
            return (
              <div key={group}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {groupInfo.emoji} {t(groupInfo.labelKey)}
                </p>
                <div className="flex flex-col gap-1.5">
                  {groupFields.map((field) => {
                    const isOn = tracked.includes(field.key)
                    const isRequired = field.required
                    const isDefault = defaults.includes(field.key)
                    return (
                      <button
                        key={field.key}
                        type="button"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors tap-target"
                        style={{
                          background: isOn ? 'var(--color-primary-light, #dcfce7)' : 'var(--color-glass, #f8fafc)',
                          opacity: isRequired ? 0.8 : 1,
                        }}
                        onClick={() => toggle(field.key)}
                        disabled={isRequired}
                        aria-pressed={isOn}
                      >
                        <span className="text-base">{isOn ? '✅' : '⬜'}</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold" style={{ color: isOn ? 'var(--color-primary-dark, #166534)' : 'var(--color-text)' }}>
                            {t(field.labelKey)}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                            {field.unit}{isDefault ? ` · ${t('physical.recommended')}` : ''}
                          </p>
                        </div>
                        {isRequired && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-glass-active, #e2e8f0)', color: 'var(--color-text-muted)' }}>
                            {t('physical.required')}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Actions */}
          <div className="flex gap-2 mt-2">
            <button
              className="flex-1 text-xs font-bold py-2.5 rounded-xl tap-target"
              style={{ background: 'var(--color-glass, #f8fafc)', color: 'var(--color-text-muted)' }}
              onClick={resetToDefaults}
            >
              {t('physical.resetDefaults')}
            </button>
            <button className="btn-primary flex-1" onClick={save}>
              {t('physical.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
