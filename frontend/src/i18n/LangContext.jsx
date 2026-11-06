import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { I18N } from './translations.js'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('wms_lang') || 'th')

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t('appTitle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const setLang = useCallback((l) => {
    localStorage.setItem('wms_lang', l)
    setLangState(l)
  }, [])

  const t = useCallback((path, vars) => {
    const pick = (l) => path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), I18N[l])
    let str = pick(lang)
    if (str === undefined) str = pick('en')
    if (str === undefined) return path
    if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replace(`{${k}}`, v) })
    return str
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
