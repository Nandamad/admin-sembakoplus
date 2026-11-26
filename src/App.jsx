import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import { MENU } from './layouts/menu.js'
import AdminLogin from './pages/auth/AdminLogin.jsx'
import BannerList from './pages/banner/BannerList.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import ProdukList from './pages/produk/ProdukList.jsx'
import PromoList from './pages/promo/PromoList.jsx'
import OrdersList from './pages/orders/OrdersList.jsx'
import TokoSettings from './pages/pengaturan/TokoSettings.jsx'
import ShippingZones from './pages/ongkir/ShippingZones.jsx'
import CourierSchedule from './pages/jam-kurir/CourierSchedule.jsx'
import PointsRewards from './pages/poin/PointsRewards.jsx'
import ReportsPage from './pages/laporan/ReportsPage.jsx'
import CategoryManagement from './pages/kategori/CategoryManagement.jsx'

function UnavailablePage() {
  const { pathname } = useLocation()
  const page = MENU.find((item) => item.to === pathname)

  return (
    <section className="admin-placeholder">
      <h1>{page?.label || 'Halaman tidak ditemukan'}</h1>
      <p>Halaman ini belum dibuat. Untuk sekarang, kamu bisa kembali ke dashboard.</p>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route
          element={
            import.meta.env.DEV ? <AdminLayout /> : <Navigate replace to="/login" />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="banner" element={<BannerList />} />
          <Route path="produk" element={<ProdukList />} />
          <Route path="promo" element={<PromoList />} />
          <Route path="pesanan" element={<OrdersList />} />
          <Route path="pengaturan" element={<TokoSettings />} />
          <Route path="ongkir" element={<ShippingZones />} />
          <Route path="jam-kurir" element={<CourierSchedule />} />
          <Route path="poin" element={<PointsRewards />} />
          <Route path="laporan" element={<ReportsPage />} />
          <Route path="kategori" element={<CategoryManagement />} />
          <Route path="*" element={<UnavailablePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
