import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'

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
        resolve(canvas.toDataURL('image/jpeg', 0.3))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function PhotoUpload() {
  const { t } = useTranslation()
  const { profile, setProfile } = useApp()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    try {
      const dataUrl = await compressImage(file)
      setProfile({ ...profile, photoUrl: dataUrl })
    } catch {
      // Silently fail — user can try again
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removePhoto() {
    if (!profile) return
    const { photoUrl: _, ...rest } = profile
    setProfile({ ...rest, photoUrl: undefined } as typeof profile)
  }

  const hasPhoto = !!profile?.photoUrl

  return (
    <div className="flex flex-col items-center gap-2">
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
        <label className="btn-choice text-xs py-1.5 px-3 cursor-pointer" aria-label={t('profile.uploadPhoto')}>
          {uploading ? t('common.loading') : hasPhoto ? t('profile.changePhoto') : t('profile.uploadPhoto')}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
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
    </div>
  )
}
