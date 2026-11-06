import React from 'react'

export function Field({ label, className = '', children }) {
  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

export function TextInput(props) {
  return <input type="text" className="form-input" {...props} />
}

export function NumInput({ step = '1', ...props }) {
  return <input type="number" step={step} className="form-input" {...props} />
}

export function DateInput(props) {
  return <input type="date" className="form-input" {...props} />
}

export function SelectInput({ options, ...props }) {
  return (
    <select className="form-input form-select" {...props}>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
