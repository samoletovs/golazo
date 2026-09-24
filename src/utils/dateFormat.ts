import i18n from '../i18n'

export function formatDisplayDate(value: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString(i18n.resolvedLanguage || i18n.language, options)
}
