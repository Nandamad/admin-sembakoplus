import { useEffect, useMemo, useState } from 'react'
import { Eye, Printer, Search, Truck } from 'lucide-react'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import OrderDetailModal from './OrderDetailModal.jsx'
import {
  couriers,
  formatRupiah,
  getCourierName,
  initialOrders,
  orderTabs,
} from './ordersData.js'
import './OrdersList.css'

function OrdersList() {
  const [orders, setOrders] = useState(initialOrders)
  const [selectedTab, setSelectedTab] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [detailCourierId, setDetailCourierId] = useState('')
  const [printOrder, setPrintOrder] = useState(null)
  const [notice, setNotice] = useState('')

  const selectedOrder = orders.find((order) => order.id === selectedOrderId)
  const tabs = orderTabs.map((tab) => ({
    ...tab,
    count:
      tab.key === 'all'
        ? orders.length
        : orders.filter((order) => order.status === tab.key).length,
  }))

  const visibleOrders = useMemo(() => {
    const searchTerm = query.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesTab =
        selectedTab === 'all' || order.status === selectedTab
      const searchableText =
        `${order.id} ${order.customer} ${order.address} ${order.status}`.toLowerCase()
      return matchesTab && searchableText.includes(searchTerm)
    })
  }, [orders, query, selectedTab])

  useEffect(() => {
    if (!printOrder) return undefined

    const timeoutId = window.setTimeout(() => {
      window.print()
      setPrintOrder(null)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [printOrder])

  function openDetails(order) {
    setSelectedOrderId(order.id)
    setDetailCourierId(order.courierId || '')
    setNotice('')
  }

  function closeDetails() {
    setSelectedOrderId(null)
  }

  function assignCourier(orderId, courierId) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, courierId } : order,
      ),
    )
    const courierName = getCourierName(courierId)
    setNotice(
      courierName
        ? `${courierName} ditugaskan ke ${orderId} pada tampilan ini. Belum disimpan ke server.`
        : `Penugasan kurir ${orderId} dihapus dari tampilan ini.`,
    )
  }

  function dispatchSelectedOrder() {
    if (
      !selectedOrder ||
      !detailCourierId ||
      !['Perlu Diproses', 'Sedang Dipacking'].includes(selectedOrder.status)
    ) {
      return
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              courierId: detailCourierId,
              status: 'Sedang Dikirim',
              statusTone: 'green',
            }
          : order,
      ),
    )
    setNotice(
      `Pesanan ${selectedOrder.id} didispatch pada tampilan ini. Belum dikirim ke server.`,
    )
    closeDetails()
  }

  const columns = [
    {
      key: 'id',
      label: 'ID & Waktu',
      render: (order) => (
        <span className="orders__stack">
          <strong className="orders__id">{order.id}</strong>
          <small>{order.timeShort}</small>
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Pelanggan & Alamat',
      render: (order) => (
        <span className="orders__stack orders__customer">
          <strong>{order.customer}</strong>
          <small>{order.addressShort}</small>
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Bayar',
      render: (order) => (
        <span className="orders__stack">
          <strong className="orders__total">{formatRupiah(order.totalAmount)}</strong>
          <small>{order.paymentMethod}</small>
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status Pesanan',
      render: (order) => (
        <StatusBadge tone={order.statusTone}>{order.status}</StatusBadge>
      ),
    },
    {
      key: 'courierId',
      label: 'Penugasan Kurir',
      render: (order) => (
        <label
          className={`orders__courier-select${
            order.courierId ? ' orders__courier-select--assigned' : ''
          }`}
        >
          <Truck aria-hidden="true" size={13} />
          <select
            aria-label={`Pilih kurir untuk ${order.id}`}
            onChange={(event) => assignCourier(order.id, event.target.value)}
            value={order.courierId}
          >
            <option value="">Pilih Kurir Antar...</option>
            {couriers.map((courier) => (
              <option key={courier.id} value={courier.id}>
                {courier.name}
                {courier.statusLabel}
              </option>
            ))}
          </select>
        </label>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (order) => (
        <div className="orders__actions">
          <button
            aria-label={`Cetak resi ${order.id}`}
            className="orders__icon-button"
            onClick={() => setPrintOrder(order)}
            title="Cetak resi gudang"
            type="button"
          >
            <Printer aria-hidden="true" size={14} />
          </button>
          <button
            aria-label={`Lihat detail ${order.id}`}
            className="orders__icon-button orders__icon-button--detail"
            onClick={() => openDetails(order)}
            title="Lihat detail pesanan"
            type="button"
          >
            <Eye aria-hidden="true" size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="orders">
      <PageHeader
        title="Pesanan Masuk & Dispatch Kurir"
        description="Pantau pesanan masuk, atur proses packing, dan tugaskan kurir pengantaran."
      />

      <p className="orders__sample-notice" role="note">
        Data pesanan dan kurir akan ditampilkan setelah tersedia dari backend.
      </p>

      <div className="orders__toolbar">
        <div aria-label="Filter status pesanan" className="orders__tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              aria-selected={selectedTab === tab.key}
              className={`orders__tab${
                selectedTab === tab.key ? ' orders__tab--active' : ''
              }`}
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              role="tab"
              type="button"
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <label className="orders__search">
          <Search aria-hidden="true" size={14} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari ID Pesanan, Nama Pemesan..."
            type="search"
            value={query}
          />
        </label>
      </div>

      {notice && (
        <p className="orders__notice" role="status">
          {notice}
        </p>
      )}

      <section className="orders__table-card">
        {visibleOrders.length ? (
          <div className="orders__table">
            <DataTable
              columns={columns}
              label="Daftar pesanan masuk dan penugasan kurir"
              rows={visibleOrders}
            />
          </div>
        ) : (
          <p className="orders__empty">
            Tidak ada pesanan yang sesuai dengan filter atau pencarian.
          </p>
        )}
      </section>

      {selectedOrder && (
        <OrderDetailModal
          courierId={detailCourierId}
          couriers={couriers}
          onClose={closeDetails}
          onCourierChange={setDetailCourierId}
          onDispatch={dispatchSelectedOrder}
          onPrint={() => setPrintOrder(selectedOrder)}
          order={selectedOrder}
          canDispatch={['Perlu Diproses', 'Sedang Dipacking'].includes(
            selectedOrder.status,
          )}
        />
      )}

      {printOrder && (
        <article className="orders__print">
          <header>
            <strong>SembakoPlus</strong>
            <span>RESI GUDANG</span>
          </header>
          <h1>Pesanan {printOrder.id}</h1>
          <p>{printOrder.timeLabel}</p>
          <section>
            <strong>{printOrder.customer}</strong>
            <span>{printOrder.phone}</span>
            <span>{printOrder.address}</span>
          </section>
          <table>
            <thead>
              <tr>
                <th>Item Belanjaan</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {printOrder.items.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{formatRupiah(item.unitPrice)}</td>
                  <td>{formatRupiah(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="orders__print-total">
            Total: <strong>{formatRupiah(printOrder.totalAmount)}</strong>
          </p>
        </article>
      )}
    </div>
  )
}

export default OrdersList
