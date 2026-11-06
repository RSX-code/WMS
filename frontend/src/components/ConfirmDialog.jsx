import React, { createContext, useContext, useState, useCallback } from 'react'
import Modal from './Modal.jsx'
import { useLang } from '../i18n/LangContext.jsx'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const { t } = useLang()
  const [dialog, setDialog] = useState(null) // { title, message, onConfirm, confirmLabel, danger }

  const confirmDialog = useCallback((title, message, onConfirm, confirmLabel, danger = true) => {
    setDialog({ title, message, onConfirm, confirmLabel: confirmLabel || t('common.delete'), danger })
  }, [t])

  const close = () => setDialog(null)

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      <Modal
        open={!!dialog}
        onClose={close}
        title={dialog?.title}
        footer={
          <>
            <button className="btn btn-secondary" onClick={close}>{t('common.cancel')}</button>
            <button
              className={`btn ${dialog?.danger === false ? 'btn-primary' : 'btn-danger'}`}
              onClick={() => { dialog?.onConfirm(); close() }}
            >
              {dialog?.confirmLabel}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">{dialog?.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
