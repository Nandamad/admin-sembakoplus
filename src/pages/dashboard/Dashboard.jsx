import { lazy, Suspense } from 'react'
import { AlertTriangle, DollarSign, ShoppingBag, Truck } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import StatCard from '../../components/StatCard.jsx'
import ContentStatus from './ContentStatus.jsx'
import RecentOrders from './RecentOrders.jsx'
import './Dashboard.css'

const SalesChart = lazy(() => import('./SalesChart.jsx'))

const stats = [
  {
    label: 'Omset Penjualan Hari Ini',
    value: '—',
    note: 'Menunggu data backend',
    icon: DollarSign,
    tone: 'green',
  },
  {
    label: 'Total Pesanan Masuk',
    value: '—',
    note: 'Menunggu data backend',
    icon: ShoppingBag,
    tone: 'blue',
  },
  {
    label: 'Stok Sembako Kritis',
    value: '—',
    note: 'Menunggu data backend',
    icon: AlertTriangle,
    tone: 'orange',
  },
  {
    label: 'Armada Kurir Bertugas',
    value: '—',
    note: 'Menunggu data backend',
    icon: Truck,
    tone: 'green',
  },
]

function Dashboard() {
  return (
    <div className="dashboard">
      <PageHeader
        title="Dashboard Overview & Ringkasan Toko"
        description="Pantau omzet harian, antrean packing pesanan, dan armada kurir instan"
      />

      <p className="dashboard__sample-notice" role="note">
        Ringkasan akan tersedia setelah dashboard terhubung ke backend.
      </p>

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
          <SalesChart />
        </Suspense>
        <ContentStatus />
      </section>

      <RecentOrders />
    </div>
  )
}

export default Dashboard
