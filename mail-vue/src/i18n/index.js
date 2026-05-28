import { createI18n } from 'vue-i18n';
import en from './en.js'
import zh from './zh.js'
import id from './id.js'

const lang = (navigator.language || 'en').split('-')[0]
const supportedLangs = ['zh', 'id']
const defaultLocale = supportedLangs.includes(lang) ? lang : 'en'

const i18n = createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: 'en',
    messages: {
        zh,
        en,
        id
    },
});

export default i18n;