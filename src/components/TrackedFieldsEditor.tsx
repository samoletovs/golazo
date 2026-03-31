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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl overflow-y-auto"
        style={{
          background: 'var(--color-bg, #fafafa)',
          maxHeight: '85vh',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex flex-col gap-5">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>{t('physical.customizeTitle')}</h2>
              <button
                className="tap-target w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-glass-active)', color: 'var(--color-text-muted)' }}
                onClick={onClose}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {t('physical.customizeHint')}
            </p>
          </div>

          {/* Field toggles by group */}
          {allGroups.map((group) => {
            const groupFields = PHYSICAL_FIELDS.filter((f) => f.group === group)
            const groupInfo = PHYSICAL_GROUPS[group]
            return (
              <div key={group}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  {groupInfo.emoji} {t(groupInfo.labelKey)}
                </p>
                <div className="card p-0 overflow-hidden">
                  {groupFields.map((field, idx) => {
                    const isOn = tracked.includes(field.key)
                    const isRequired = field.required
                    const isDefault = defaults.includes(field.key)
                    return (
                      <button
                        key={field.key}
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 w-full text-left tap-target"
                        style={{
                          borderBottom: idx < groupFields.length - 1 ? '1px solid var(--color-glass-border, #e5e7eb)' : undefined,
                          background: 'transparent',
                        }}
                        onClick={() => toggle(field.key)}
                        disabled={isRequired}
                        aria-pressed={isOn}
                      >
                        {/* Toggle indicator */}
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            background: isOn ? 'var(--color-primary-dark)' : 'var(--color-glass-active, #e2e8f0)',
                            border: isOn ? 'none' : '1.5px solid var(--color-glass-border, #cbd5e1)',
                          }}
                        >
                          {isOn && <span className="text-white text-[10px] font-bold">✓</span>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">{t(field.labelKey)}</p>
                          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                            {field.unit}{isDefault ? ` · ${t('physical.recommended')}` : ''}
                          </p>
                        </div>
                        {isRequired && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'var(--color-glass-active, #e2e8f0)', color: 'var(--color-text-muted)' }}>
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
