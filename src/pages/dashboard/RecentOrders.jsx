import { Link } from 'react-router-dom'
import DataTable from '../../components/DataTable.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { initialOrders as orders } from '../orders/ordersData.js'
import './RecentOrders.css'

const columns = [
  {
    key: 'order',
    label: 'No. Pesanan',
    render: (order) => (
      <div className="datatable__stack">
        <strong className="datatable__primary">#{order.id}</strong>
        <span className="datatable__secondary">{order.time}</span>
      </div>
    ),
  },
  {
    key: 'customer',
    label: 'Pemesan & Alamat',
    render: (order) => (
      <div className="datatable__stack">
        <strong className="datatable__primary">{order.customer}</strong>
        <span className="datatable__secondary">{order.address}</span>
      </div>
    ),
  },
  {
    key: 'total',
    label: 'Total Item',
    render: (order) => (
      <div className="datatable__stack">
        <strong className="datatable__primary">{order.total}</strong>
        <span className="datatable__secondary">{order.items}</span>
      </div>
    ),
  },
  {
    key: 'payment',
    label: 'Metode Bayar',
    render: (order) => (
      <StatusBadge tone={order.payment.startsWith('QRIS') ? 'green' : 'neutral'}>
        {order.payment}
      </StatusBadge>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (order) => <StatusBadge tone={order.tone}>{order.status}</StatusBadge>,
  },
  {
    key: 'courier',
    label: 'Penugasan Kurir',
    render: (order) =>
      order.courier ? (
        <span className="recent-orders__courier">{order.courier}</span>
      ) : (
        <Link className="datatable__action" to="/pesanan">
          Tugaskan Kurir...
        </Link>
      ),
  },
]

function RecentOrders() {
  return (
    <section className="dashboard__panel recent-orders">
      <div className="dashboard__panel-header recent-orders__header">
        <div>
          <h2 className="dashboard__panel-title">Pesanan Masuk Terbaru</h2>
          <p>Daftar transaksi yang baru saja diselesaikan pengguna aplikasi</p>
        </div>
        <Link className="recent-orders__all" to="/pesanan">
          Lihat Semua Pesanan
        </Link>
      </div>
      {orders.length ? (
        <DataTable columns={columns} label="Pesanan masuk terbaru" rows={orders} />
      ) : (
        <p className="recent-orders__empty">
          Belum ada data pesanan dari backend.
        </p>
      )}
    </section>
  )
}

export default RecentOrders
