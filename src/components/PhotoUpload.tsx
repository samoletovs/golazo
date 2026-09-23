import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'

const MAX_SIZE_PX = 512
const MAX_BYTES = 200_000 // 200KB after compression

/**
 * Compress an image file to a data URL within size limits.
 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > MAX_SIZE_PX || height > MAX_SIZE_PX) {
          const ratio = Math.min(MAX_SIZE_PX / width, MAX_SIZE_PX / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('No canvas context')); return }
        ctx.drawImage(img, 0, 0, width, height)

        // Try progressively lower quality until under size limit
        for (let q = 0.8; q >= 0.3; q -= 0.1) {
          const dataUrl = canvas.toDataURL('image/jpeg', q)
          if (dataUrl.length <= MAX_BYTES * 1.37) { // base64 overhead
            resolve(dataUrl)
            return
          }
        }
        reject(new Error('Image exceeds the supported local storage size'))
      }
      img.onerror = reject
      if (typeof reader.result !== 'string') { reject(new Error('Image file could not be read')); return }
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function PhotoUpload() {
  const { t } = useTranslation()
  const { profile, setProfile } = useApp()
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [failedFile, setFailedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function savePhoto(file: File) {
    if (!profile || uploading) return
    setUploading(true)
    try {
      const dataUrl = await compressImage(file)
      setProfile({ ...profile, photoUrl: dataUrl })
      setFailedFile(null)
    } catch (cause) {
      console.error('Photo could not be saved:', cause)
      setFailedFile(file)
      showToast(t('academy.photoError'), 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removePhoto() {
    if (!profile) return
    try { setProfile({ ...profile, photoUrl: undefined }) }
    catch (cause) {
      console.error('Photo could not be removed:', cause)
      showToast(t('academy.saveError'), 'error')
    }
  }

  const hasPhoto = !!profile?.photoUrl

  return (
    <section className="academy-photo-controls" data-academy-surface="profile-photo">
      {/* Photo preview */}
      <div
        className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: hasPhoto ? 'none' : 'var(--color-glass-active)',
          border: '2px solid var(--color-glass-border)',
        }}
      >
        {hasPhoto ? (
          <img
            src={profile.photoUrl}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">📷</span>
        )}
      </div>

      {/* Upload / Remove buttons */}
      <div className="flex gap-2">
        <button type="button" className="academy-button secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? t('common.loading') : hasPhoto ? t('profile.changePhoto') : t('profile.uploadPhoto')}
        </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={event => { const file = event.target.files?.[0]; if (file) void savePhoto(file) }}
            disabled={uploading}
          />
        {hasPhoto && (
          <button
            className="btn-choice text-xs py-1.5 px-3"
            onClick={removePhoto}
            aria-label={t('profile.removePhoto')}
            style={{ color: 'var(--color-danger)' }}
          >
            ✕
          </button>
        )}
      </div>
      {failedFile && <div className="academy-error" role="alert"><p>{t('academy.photoError')}</p><button className="academy-link" onClick={() => void savePhoto(failedFile)} disabled={uploading}>{t('academy.retry')}</button></div>}
    </section>
  )
}
