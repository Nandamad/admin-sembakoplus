import { lazy, Suspense, useEffect, useState } from 'react'
import { AlertTriangle, DollarSign, ShoppingBag, Truck } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import StatCard from '../../components/StatCard.jsx'
import api, { extractApiError } from '../../services/api.js'
import ContentStatus from './ContentStatus.jsx'
import RecentOrders from './RecentOrders.jsx'
import './Dashboard.css'

const SalesChart = lazy(() => import('./SalesChart.jsx'))

function formatRupiah(amount) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(amount || 0))}`
}

function getDateOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function Dashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [sales, setSales] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [contentSummary, setContentSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const from = getDateOffset(-6)
    const to = getDateOffset(0)

    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/reports/sales', { params: { from, to, group: 'day' } }),
      api.get('/admin/orders', { params: { per_page: 5 } }),
      api.get('/admin/banners'),
      api.get('/admin/vouchers'),
      api.get('/admin/products', { params: { per_page: 1 } }),
    ])
      .then(([dashRes, salesRes, ordersRes, bannersRes, vouchersRes, productsRes]) => {
        if (!active) return
        const dash = dashRes.data?.data ?? {}
        const breakdown = salesRes.data?.data?.breakdown ?? []
        const orders = ordersRes.data?.data ?? []
        const banners = bannersRes.data?.data ?? []
        const vouchers = vouchersRes.data?.data ?? []
        const totalProducts = productsRes.data?.meta?.total ?? (productsRes.data?.data?.length ?? 0)

        setDashboard(dash)
        setSales(
          breakdown.map((row) => ({
            day: String(row.period).slice(5),
            value: Number(row.total_sales || 0),
            short:
              Number(row.total_sales || 0) >= 1000
                ? `${Math.round(Number(row.total_sales || 0) / 1000)}rb`
                : String(row.total_sales || 0),
          })),
        )
        setRecentOrders(orders)
        setContentSummary({
          activeBanners: banners.filter((item) => item.is_active).length,
          totalBanners: banners.length,
          activeVouchers: vouchers.filter((item) => item.status === 'active').length,
          totalProducts,
          pendingOrders: dash.pending_orders ?? 0,
          deliveringOrders: dash.delivering_orders ?? 0,
        })
        setError('')
      })
      .catch((err) => {
        if (active) {
          setError(extractApiError(err, 'Gagal memuat ringkasan dashboard.'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const stats = [
    {
      label: 'Omset Penjualan Hari Ini',
      value: dashboard ? formatRupiah(dashboard.revenue_today) : '—',
      note: dashboard ? `Pesanan pending: ${dashboard.pending_orders ?? 0}` : 'Memuat data...',
      icon: DollarSign,
      tone: 'green',
    },
    {
      label: 'Total Pesanan Masuk Hari Ini',
      value: dashboard ? String(dashboard.orders_today ?? 0) : '—',
      note: dashboard ? `Dalam pengiriman: ${dashboard.delivering_orders ?? 0}` : 'Memuat data...',
      icon: ShoppingBag,
      tone: 'blue',
    },
    {
      label: 'Varian Stok Menipis (<= 5)',
      value: dashboard ? String(dashboard.low_stock_variants ?? 0) : '—',
      note: 'Perlu pengecekan stok gudang',
      icon: AlertTriangle,
      tone: 'orange',
    },
    {
      label: 'Armada Kurir Aktif',
      value: dashboard ? String(dashboard.active_couriers ?? 0) : '—',
      note: 'Kurir aktif siap bertugas',
      icon: Truck,
      tone: 'green',
    },
  ]

  return (
    <div className="dashboard">
      <PageHeader
        title="Dashboard Overview & Ringkasan Toko"
        description="Pantau omzet harian, antrean packing pesanan, dan armada kurir instan"
      />

      {error && (
        <p className="dashboard__sample-notice" role="alert">
          {error}
        </p>
      )}

      <section className="dashboard__stats" aria-label="Ringkasan toko hari ini">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="dashboard__insights" aria-label="Analisis dan status aplikasi">
        <Suspense
          fallback={
            <div className="dashboard__panel sales-chart sales-chart--loading" role="status">
              Memuat grafik penjualan...
            </div>
          }
        >
          <SalesChart loading={loading} sales={sales} />
        </Suspense>
        <ContentStatus loading={loading} summary={contentSummary} />
      </section>

      <RecentOrders loading={loading} orders={recentOrders} />
    </div>
  )
}

export default Dashboard
