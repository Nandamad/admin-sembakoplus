import { Link } from 'react-router-dom'
import DataTable from '../../components/DataTable.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import './RecentOrders.css'

const STATUS_LABEL = {
  created: { label: 'Menunggu Proses', tone: 'orange' },
  processing: { label: 'Sedang Diproses', tone: 'blue' },
  scheduled_tomorrow: { label: 'Jadwal Besok', tone: 'blue' },
  delivering: { label: 'Sedang Diantar', tone: 'green' },
  arrived: { label: 'Tiba di Tujuan', tone: 'green' },
  completed: { label: 'Selesai', tone: 'green' },
  cancelled: { label: 'Dibatalkan', tone: 'red' },
  failed_delivery: { label: 'Gagal Antar', tone: 'red' },
}

function formatRupiah(amount) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(amount || 0))}`
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns = [
  {
    key: 'order',
    label: 'No. Pesanan',
    render: (order) => (
      <div className="datatable__stack">
        <strong className="datatable__primary">#{order.order_number}</strong>
        <span className="datatable__secondary">{formatTime(order.placed_at)}</span>
      </div>
    ),
  },
  {
    key: 'customer',
    label: 'Pemesan & Alamat',
    render: (order) => (
      <div className="datatable__stack">
        <strong className="datatable__primary">{order.recipient_name}</strong>
        <span className="datatable__secondary">{order.address_snapshot}</span>
      </div>
    ),
  },
  {
    key: 'total',
    label: 'Total Item',
    render: (order) => (
      <div className="datatable__stack">
        <strong className="datatable__primary">{formatRupiah(order.total)}</strong>
        <span className="datatable__secondary">
          {(order.items ?? []).length} Produk
        </span>
      </div>
    ),
  },
  {
    key: 'payment',
    label: 'Metode Bayar',
    render: (order) => {
      const method = order.payment?.payment_method?.toUpperCase() || '—'
      const paid = order.payment_status === 'paid'
      return (
        <StatusBadge tone={paid ? 'green' : 'neutral'}>
          {method} • {paid ? 'Lunas' : 'Belum'}
        </StatusBadge>
      )
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (order) => {
      const meta = STATUS_LABEL[order.order_status] || {
        label: order.order_status,
        tone: 'neutral',
      }
      return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
    },
  },
  {
    key: 'courier',
    label: 'Penugasan Kurir',
    render: (order) =>
      order.courier_assignment?.courier_name ? (
        <span className="recent-orders__courier">
          {order.courier_assignment.courier_name}
        </span>
      ) : (
        <Link className="datatable__action" to="/pesanan">
          Tugaskan Kurir...
        </Link>
      ),
  },
]

function RecentOrders({ orders = [], loading = false }) {
  return (
    <section className="dashboard__panel recent-orders">
      <div className="dashboard__panel-header recent-orders__header">
        <div>
          <h2 className="dashboard__panel-title">Pesanan Masuk Terbaru</h2>
          <p>Daftar transaksi terbaru dari aplikasi pelanggan SembakoPlus</p>
        </div>
        <Link className="recent-orders__all" to="/pesanan">
          Lihat Semua Pesanan
        </Link>
      </div>
      {loading ? (
        <p className="recent-orders__empty">Memuat pesanan terbaru...</p>
      ) : orders.length ? (
        <DataTable columns={columns} label="Pesanan masuk terbaru" rows={orders} />
      ) : (
        <p className="recent-orders__empty">Belum ada pesanan masuk.</p>
      )}
    </section>
  )
}

export default RecentOrders
