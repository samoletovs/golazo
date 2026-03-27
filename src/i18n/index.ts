import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'
import lv from './lv.json'
import en from './en.json'
import es from './es.json'

i18n.use(initReactI18next).init({
  resources: { ru: { translation: ru }, lv: { translation: lv }, en: { translation: en }, es: { translation: es } },
  lng: localStorage.getItem('golazo-lang') ?? 'ru',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
