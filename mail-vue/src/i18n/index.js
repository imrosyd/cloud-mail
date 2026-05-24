import { createI18n } from 'vue-i18n';
import en from './en.js'
import zh from './zh.js'

const lang = (navigator.language || 'en').split('-')[0]

const i18n = createI18n({
    legacy: false,
    locale: lang === 'zh' ? 'zh' : 'en',
    fallbackLocale: 'en',
    messages: {
        zh,
        en
    },
});

export default i18n;