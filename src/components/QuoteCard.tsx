import { useTranslation } from 'react-i18next'
import type { Language } from '../engine/types'
import { getQuoteOfTheDay } from '../data/quotes'

export function QuoteCard() {
  const { t, i18n } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const quote = getQuoteOfTheDay(today)
  const lang = i18n.language as Language

  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
        {t('dashboard.quote')}
      </p>
      <p className="text-base italic leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
        &ldquo;{quote.text[lang] ?? quote.text.en}&rdquo;
      </p>
      <p className="text-sm mt-2" style={{ color: 'var(--color-pitch-green-light)' }}>
        — {quote.player}
      </p>
    </div>
  )
}
