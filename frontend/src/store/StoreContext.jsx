import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { reducer, initialState } from './reducer.js'
import { api } from '../api.js'
import { useToast } from '../components/Toast.jsx'

const StoreContext = createContext(null)

// แปลง action ของหน้า UI (เหมือนเดิมทุกตัว ไม่ต้องแก้ pages เลย) ให้ไปเรียก
// endpoint จริงฝั่ง backend — คืนค่าเป็น { shortages } เฉพาะ FULFILL_SO
// เท่านั้น ตัวอื่นคืน undefined
async function callApi(action) {
  switch (action.type) {
    case 'SAVE_CATEGORY': return api.saveCategory(action.payload)
    case 'DELETE_CATEGORY': return api.deleteCategory(action.id)

    case 'SAVE_PRODUCT': return api.saveProduct(action.payload)
    case 'DELETE_PRODUCT': return api.deleteProduct(action.id)

    case 'SAVE_WAREHOUSE': return api.saveWarehouse(action.payload)
    case 'DELETE_WAREHOUSE': return api.deleteWarehouse(action.id)

    case 'SAVE_LOCATION': return api.saveLocation(action.payload)
    case 'DELETE_LOCATION': return api.deleteLocation(action.id)

    case 'SAVE_SUPPLIER': return api.saveSupplier(action.payload)
    case 'DELETE_SUPPLIER': return api.deleteSupplier(action.id)

    case 'SAVE_CUSTOMER': return api.saveCustomer(action.payload)
    case 'DELETE_CUSTOMER': return api.deleteCustomer(action.id)

    case 'ADJUST_STOCK': return api.adjustStock(action.payload)
    case 'TRANSFER_STOCK': return api.transferStock(action.payload)

    case 'CREATE_PO': return api.createPurchaseOrder(action.payload)
    case 'MARK_PO_ORDERED': return api.markPoOrdered(action.id)
    case 'CANCEL_PO': return api.cancelPo(action.id)
    case 'DELETE_PO': return api.deletePo(action.id)
    case 'RECEIVE_PO_ITEMS':
      return api.receivePoItems(action.payload.poId, action.payload.locationId, action.payload.receipts)

    case 'CREATE_SO': return api.createSalesOrder(action.payload)
    case 'CONFIRM_SO': return api.confirmSalesOrder(action.id)
    case 'CANCEL_SO': return api.cancelSalesOrder(action.id)
    case 'DELETE_SO': return api.deleteSalesOrder(action.id)
    case 'FULFILL_SO': return api.fulfillSalesOrder(action.id) // { order, shortages }

    case 'RESET_DEMO': return null // ข้อมูลจริงแล้ว ไม่มี "seed" ให้รีเซ็ตกลับไป แค่โหลดของจริงซ้ำ

    default: return undefined // action ที่ reducer จัดการเอง (HYDRATE ฯลฯ) ไม่ต้องยิง API
  }
}

export function StoreProvider({ children }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, initialState)
  const showToast = useToast()

  const refresh = useCallback(async () => {
    const data = await api.getBootstrap()
    rawDispatch({ type: 'HYDRATE', payload: data })
  }, [])

  // โหลดข้อมูลจริงจาก backend ตอนเปิดแอปครั้งแรก (แทนที่ localStorage/seed เดิม)
  useEffect(() => {
    refresh().catch(err => rawDispatch({ type: 'SET_ERROR', message: err.message }))
  }, [refresh])

  // dispatch ตัวที่ pages เรียกใช้จริง — ยิง API ก่อน แล้วโหลดข้อมูลทั้งก้อน
  // กลับมาใหม่เสมอ เพื่อให้ state ตรงกับ database 100% ไม่ต้องคำนวณเอง
  const dispatch = useCallback((action) => {
    if (action.type === 'HYDRATE' || action.type === 'SET_LOADING' || action.type === 'SET_ERROR') {
      rawDispatch(action)
      return
    }

    callApi(action)
      .then(async (result) => {
        const data = await api.getBootstrap()
        const shortages = action.type === 'FULFILL_SO' ? (result?.shortages || []) : undefined
        rawDispatch({ type: 'HYDRATE', payload: data, shortages })
      })
      .catch((err) => {
        console.error(`[${action.type}] failed:`, err)
        rawDispatch({ type: 'SET_ERROR', message: err.message })
        // แจ้งผู้ใช้ว่าบันทึกไม่สำเร็จ (เดิมเงียบ เห็นแต่ toast "สำเร็จ" ทั้งที่ไม่ได้บันทึก)
        showToast(err.message, 'danger')
      })
  }, [showToast])

  return (
    <StoreContext.Provider value={{ state, dispatch, refresh }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
