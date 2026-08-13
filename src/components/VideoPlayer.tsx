import { useTranslation } from 'react-i18next'

interface VideoPlayerProps {
  videoUrl: string
  title: string
}

/**
 * Extracts a YouTube video ID from the URL formats used in the exercise data.
 * Unknown providers intentionally fall back to a normal external link.
 */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Embeds YouTube videos with the privacy-enhanced no-cookie domain, or renders
 * an accessible outbound link for non-YouTube exercise videos.
 */
export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const { t } = useTranslation()
  const videoId = getYouTubeId(videoUrl)

  if (!videoId) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-choice text-center text-sm"
        aria-label={`${t('exercises.watchVideo')}: ${title}`}
      >
        ▶️ {t('exercises.watchVideo')}
      </a>
    )
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
      />
    </div>
  )
}
