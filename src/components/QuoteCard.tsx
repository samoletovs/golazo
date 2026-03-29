import { useTranslation } from 'react-i18next'
import type { Language } from '../engine/types'
import { getQuoteOfTheDay } from '../data/quotes'

export function QuoteCard() {
  const { t, i18n } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const quote = getQuoteOfTheDay(today)
  const lang = i18n.language as Language

  return (
    <div className="card-glow animate-fade-up relative overflow-hidden" style={{ padding: '24px 20px' }}>
      <div className="absolute top-3 right-4 text-5xl opacity-10">💬</div>
      <p className="section-label mb-3">
        {t('dashboard.quote')}
      </p>
      <p className="text-lg italic leading-relaxed font-medium" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
        &ldquo;{quote.text[lang] ?? quote.text.en}&rdquo;
      </p>
      <p className="text-sm mt-3 font-bold" style={{ color: 'var(--color-green-500)' }}>
        — {quote.player}
      </p>
    </div>
  )
}
