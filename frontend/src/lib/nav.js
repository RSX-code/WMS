export const NAV_SECTIONS = [
  { section: 'Overview', items: [{ id: 'dashboard', path: '/', icon: 'fa-chart-pie' }] },
  { section: 'Catalog', items: [
    { id: 'products', path: '/products', icon: 'fa-box' },
    { id: 'categories', path: '/categories', icon: 'fa-tags' },
  ]},
  { section: 'Warehouse', items: [
    { id: 'inventory', path: '/inventory', icon: 'fa-cubes' },
    { id: 'warehouses', path: '/warehouses', icon: 'fa-warehouse' },
    { id: 'locations', path: '/locations', icon: 'fa-location-dot' },
    { id: 'storage', path: '/storage', icon: 'fa-diagram-project' },
  ]},
  { section: 'Orders', items: [
    { id: 'purchase-orders', path: '/purchase-orders', icon: 'fa-cart-shopping' },
    { id: 'sales-orders', path: '/sales-orders', icon: 'fa-file-invoice' },
  ]},
  { section: 'Partners', items: [
    { id: 'suppliers', path: '/suppliers', icon: 'fa-truck-field' },
    { id: 'customers', path: '/customers', icon: 'fa-users' },
  ]},
  { section: 'Activity', items: [{ id: 'transactions', path: '/transactions', icon: 'fa-arrow-right-arrow-left' }] },
  { section: 'System', items: [{ id: 'settings', path: '/settings', icon: 'fa-gear' }] },
]

export const NAV_FLAT = NAV_SECTIONS.flatMap(s => s.items)

export function pageIdForPath(pathname) {
  const match = NAV_FLAT.find(i => (i.path === '/' ? pathname === '/' : pathname.startsWith(i.path)))
  return match ? match.id : 'dashboard'
}