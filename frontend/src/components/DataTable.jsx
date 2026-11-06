import React, { useMemo, useState } from 'react'
import { useLang } from '../i18n/LangContext.jsx'

// Generic, reusable table — this is the React equivalent of the DataTable()
// factory function in the original vanilla-JS file. One component, many
// pages: Products, Categories, Warehouses, Suppliers, etc. all pass in
// different `columns`/`data`/`filters` props but share this same code.
export default function DataTable({
  columns,
  data,
  filters = [],
  toolbar,
  rowActions,
  pageSize = 8,
  searchable = true,
  searchPlaceholder,
  initialSearch = '',
}) {
  const { t } = useLang()
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState(null)
  const [dir, setDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [activeFilters, setActiveFilters] = useState({})

  const rows = useMemo(() => {
    let out = data
    if (search) {
      const q = search.toLowerCase()
      out = out.filter(r =>
        columns.some(c => {
          const v = c.searchValue ? c.searchValue(r) : r[c.key]
          return String(v ?? '').toLowerCase().includes(q)
        })
      )
    }
    Object.entries(activeFilters).forEach(([k, v]) => {
      if (v) out = out.filter(r => String(r[k]) === String(v))
    })
    if (sort) {
      out = [...out].sort((a, b) => {
        let va = a[sort], vb = b[sort]
        if (typeof va === 'number' && typeof vb === 'number') return dir === 'asc' ? va - vb : vb - va
        va = String(va ?? '').toLowerCase(); vb = String(vb ?? '').toLowerCase()
        return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      })
    }
    return out
  }, [data, search, activeFilters, sort, dir, columns])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  const toggleSort = (key) => {
    if (sort === key) setDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSort(key); setDir('asc') }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {searchable && (
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
            <input
              type="text"
              className="form-input pl-8 w-56"
              placeholder={searchPlaceholder || t('common.search')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        )}
        {filters.map(f => (
          <select
            key={f.key}
            className="form-input form-select w-40"
            value={activeFilters[f.key] || ''}
            onChange={(e) => { setActiveFilters(af => ({ ...af, [f.key]: e.target.value })); setPage(1) }}
          >
            <option value="">{f.label}</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <div className="flex-1"></div>
        {toolbar}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} onClick={() => c.sortable !== false && toggleSort(c.key)}>
                  {c.label}
                  {sort === c.key && (dir === 'asc' ? <i className="fa-solid fa-caret-up"></i> : <i className="fa-solid fa-caret-down"></i>)}
                </th>
              ))}
              {rowActions && <th style={{ width: 110 }}>{t('common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? pageRows.map((r) => (
              <tr key={r.id}>
                {columns.map(c => <td key={c.key}>{c.render ? c.render(r) : (r[c.key] ?? '—')}</td>)}
                {rowActions && <td><div className="flex gap-1">{rowActions(r)}</div></td>}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="text-center py-10 text-slate-400 text-xs">
                  {t('common.noRecords')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>{rows.length ? t('common.showing', { start: start + 1, end: Math.min(start + pageSize, rows.length), total: rows.length }) : t('common.results0')}</span>
        <div className="flex items-center gap-1">
          <button className="btn btn-secondary btn-sm btn-icon" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>
            <i className="fa-solid fa-chevron-left text-[10px]"></i>
          </button>
          <span className="px-2">{safePage} / {totalPages}</span>
          <button className="btn btn-secondary btn-sm btn-icon" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
