import { useTranslation } from 'react-i18next'
import type { Language } from '../engine/types'
import { getQuoteOfTheDay } from '../data/quotes'

export function QuoteCard() {
  const { t, i18n } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const quote = getQuoteOfTheDay(today)
  const lang = i18n.language as Language

  return (
    <div className="card-glow animate-fade-up">
      <p className="section-label mb-2">
        {t('dashboard.quote')}
      </p>
      <p className="text-base italic leading-relaxed" style={{ color: 'var(--color-text)' }}>
        &ldquo;{quote.text[lang] ?? quote.text.en}&rdquo;
      </p>
      <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--color-green-500)' }}>
        — {quote.player}
      </p>
    </div>
  )
}
