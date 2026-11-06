import React, { createContext, useContext, useCallback, useRef, useState } from 'react'

const ToastContext = createContext(null)
const ICONS = { success: 'fa-circle-check', danger: 'fa-circle-exclamation', info: 'fa-circle-info' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((msg, type = 'success') => {
    const id = ++idRef.current
    setToasts(t => [...t, { id, msg, type, show: false }])
    // trigger enter animation next tick
    requestAnimationFrame(() => {
      setToasts(t => t.map(x => (x.id === id ? { ...x, show: true } : x)))
    })
    setTimeout(() => {
      setToasts(t => t.map(x => (x.id === id ? { ...x, show: false } : x)))
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 300)
    }, 2600)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div id="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} ${t.show ? 'show' : ''}`}>
            <i className={`fa-solid ${ICONS[t.type] || ICONS.info}`}></i>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
