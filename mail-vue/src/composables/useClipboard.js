import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

export function useClipboard() {
  const { t } = useI18n()

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      ElMessage({
        message: t('copySuccessMsg'),
        type: 'success',
        plain: true,
      })
    } catch (err) {
      console.error(`${t('copyFailMsg')}:`, err)
      ElMessage({
        message: t('copyFailMsg'),
        type: 'error',
        plain: true,
      })
    }
  }

  return { copy }
}
