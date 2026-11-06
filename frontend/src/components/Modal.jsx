import React from 'react'

// Reusable modal shell. Controlled from the parent via `open`/`onClose`.
// Any page can render <Modal> with its own body/footer content — this is
// the same "component" concept as openModal() in the old vanilla-JS file,
// just expressed as JSX instead of an innerHTML string.
export default function Modal({ open, onClose, title, footer, size = 'max-w-lg', children }) {
  if (!open) return null
  return (
    <div
      className="modal-overlay show"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`modal-content w-full ${size}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button className="btn-ghost btn-icon rounded-lg" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
