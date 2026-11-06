import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { LangProvider } from "./i18n/LangContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { StoreProvider } from "./store/StoreContext.jsx";
import { ConfirmProvider } from "./components/ConfirmDialog.jsx";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import Warehouses from "./pages/Warehouses";
import Locations from "./pages/Locations";
import StorageExplorer from "./pages/StorageExplorer";
import PurchaseOrders from "./pages/PurchaseOrders";
import SalesOrders from "./pages/SalesOrders";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <ToastProvider>
          <StoreProvider>
            <ConfirmProvider>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/warehouses" element={<Warehouses />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/storage" element={<StorageExplorer />} />
                  <Route path="/purchase-orders" element={<PurchaseOrders />} />
                  <Route path="/sales-orders" element={<SalesOrders />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </MainLayout>
            </ConfirmProvider>
          </StoreProvider>
        </ToastProvider>
      </LangProvider>
    </BrowserRouter>
  );
}

export default App;