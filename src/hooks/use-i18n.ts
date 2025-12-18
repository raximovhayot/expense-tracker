import { t, type TranslationKey } from '@/lib/i18n'
import { useWorkspace } from './use-workspace'

export function useI18n() {
  const { language } = useWorkspace()

  const translate = (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ) => {
    return t(key, language, params)
  }

  return {
    t: translate,
    language,
  }
}

// Shorthand hook
export function useT() {
  const { t } = useI18n()
  return t
}
