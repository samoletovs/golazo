import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'
import lv from './lv.json'
import en from './en.json'
import es from './es.json'
import lt from './lt.json'
import et from './et.json'

i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, lv: { translation: lv }, en: { translation: en }, es: { translation: es }, lt: { translation: lt }, et: { translation: et } },
  lng: localStorage.getItem('golazo-lang') ?? 'en',
  fallbackLng: 'en',
  keySeparator: false,
  interpolation: { escapeValue: false },
})

export default i18n
