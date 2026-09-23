import { AcademyDialog } from './academy/AcademyDialog'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import type { AgeTier } from '../engine/types'
import { getAgeTier } from '../engine/types'
import { PHYSICAL_FIELDS, PHYSICAL_GROUPS, getDefaultTrackedFields, type PhysicalFieldKey } from '../engine/physical'

interface Props {
  onClose: () => void
}

export function TrackedFieldsEditor({ onClose }: Props) {
  const { t } = useTranslation()
  const { profile, physicalProfile, setPhysicalProfile } = useApp()
  const { showToast } = useToast()

  const tier: AgeTier = profile?.birthDate ? getAgeTier(profile.birthDate) : 'u12'
  const defaults = getDefaultTrackedFields(tier)

  const [tracked, setTracked] = useState<PhysicalFieldKey[]>(() => {
    if (physicalProfile?.trackedFields && physicalProfile.trackedFields.length > 0) {
      return PHYSICAL_FIELDS.filter(field => physicalProfile.trackedFields?.includes(field.key)).map(field => field.key)
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
    try {
      setPhysicalProfile({
        ...(physicalProfile ?? { measurements: [], latestIndex: 0 }),
        trackedFields: tracked,
      })
    } catch (cause) {
      console.error('Tracked fields could not be saved:', cause)
      showToast(t('academy.saveError'), 'error')
      return
    }
    onClose()
  }

  return (
    <AcademyDialog surface="components-tracked-fields-editor" title={t('physical.customizeTitle')} onClose={onClose} wide>
      <div className="academy-dialog-flow">
        <div className="p-5 flex flex-col gap-5">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">


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
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
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
                          {isOn && <span className="text-white text-xs font-bold">✓</span>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">{t(field.labelKey)}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {field.unit}{isDefault ? ` · ${t('physical.recommended')}` : ''}
                          </p>
                        </div>
                        {isRequired && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'var(--color-glass-active, #e2e8f0)', color: 'var(--color-text-muted)' }}>
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
    </AcademyDialog>
  )
}
