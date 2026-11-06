import React from 'react'
import { useLang } from '../i18n/LangContext.jsx'

export function ActiveBadge({ isActive }) {
  const { t } = useLang()
  return isActive
    ? <span className="badge badge-success">{t('common.active')}</span>
    : <span className="badge badge-neutral">{t('common.inactive')}</span>
}

const STOCK_MAP = { 'In Stock': 'badge-success', 'Low Stock': 'badge-warning', 'Out of Stock': 'badge-danger' }
export function StockBadge({ status }) {
  const { t } = useLang()
  return <span className={`badge ${STOCK_MAP[status]}`}>{t('badge.stock.' + status)}</span>
}

const PO_MAP = { DRAFT: 'badge-neutral', ORDERED: 'badge-info', RECEIVED: 'badge-success', CANCELLED: 'badge-danger' }
export function PoStatusBadge({ status }) {
  const { t } = useLang()
  return <span className={`badge ${PO_MAP[status] || 'badge-neutral'}`}>{t('badge.po.' + status)}</span>
}

const SO_MAP = { DRAFT: 'badge-neutral', CONFIRMED: 'badge-info', COMPLETED: 'badge-success', CANCELLED: 'badge-danger' }
export function SoStatusBadge({ status }) {
  const { t } = useLang()
  return <span className={`badge ${SO_MAP[status] || 'badge-neutral'}`}>{t('badge.so.' + status)}</span>
}

const TXN_MAP = { RECEIVE: 'badge-success', ISSUE: 'badge-warning', TRANSFER: 'badge-info', ADJUST: 'badge-neutral' }
export function TxnTypeBadge({ type }) {
  const { t } = useLang()
  return <span className={`badge ${TXN_MAP[type] || 'badge-neutral'}`}>{t('badge.txn.' + type)}</span>
}
