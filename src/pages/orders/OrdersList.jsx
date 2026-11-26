import { useEffect, useMemo, useState } from 'react'
import { Eye, Printer, Search, Truck } from 'lucide-react'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api, { extractApiError } from '../../services/api.js'
import OrderDetailModal from './OrderDetailModal.jsx'
import {
  ORDER_STATUS_META,
  formatOrderDate,
  formatRupiah,
  orderTabs,
} from './ordersData.js'
import './OrdersList.css'

function OrdersList() {
  const [orders, setOrders] = useState([])
  const [couriers, setCouriers] = useState([])
  const [selectedTab, setSelectedTab] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailCourierId, setDetailCourierId] = useState('')
  const [printOrder, setPrintOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function reloadOrders() {
    const [ordersRes, couriersRes] = await Promise.all([
      api.get('/admin/orders', { params: { per_page: 50 } }),
      api.get('/admin/couriers', { params: { is_active: 1 } }),
    ])
    setOrders(ordersRes.data?.data ?? [])
    setCouriers(couriersRes.data?.data ?? [])
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/orders', { params: { per_page: 50 } }),
      api.get('/admin/couriers', { params: { is_active: 1 } }),
    ])
      .then(([ordersRes, couriersRes]) => {
        if (!active) return
        setOrders(ordersRes.data?.data ?? [])
        setCouriers(couriersRes.data?.data ?? [])
      })
      .catch((error) => {
        if (active) setNotice(extractApiError(error, 'Daftar pesanan gagal dimuat.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!printOrder) return undefined
    const timeoutId = window.setTimeout(() => {
      window.print()
      setPrintOrder(null)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [printOrder])

  const tabs = orderTabs.map((tab) => ({
    ...tab,
    count:
      tab.key === 'all'
        ? orders.length
        : orders.filter((order) => order.order_status === tab.key).length,
  }))

  const visibleOrders = useMemo(() => {
    const searchTerm = query.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesTab =
        selectedTab === 'all' || order.order_status === selectedTab
      const searchableText =
        `${order.order_number} ${order.recipient_name} ${order.address_snapshot} ${order.order_status}`.toLowerCase()
      return matchesTab && searchableText.includes(searchTerm)
    })
  }, [orders, query, selectedTab])

  async function openDetails(order) {
    setNotice('')
    setDetailCourierId(String(order.courier_assignment?.courier_id || ''))
    setSelectedOrder(order)
    try {
      const { data } = await api.get(`/admin/orders/${order.id}`)
      const detail = data?.data
      if (detail) {
        setSelectedOrder(detail)
        const latestAssign =
          (detail.courier_assignments ?? []).find((a) => !['completed', 'failed', 'cancelled'].includes(a.status)) ??
          (detail.courier_assignments ?? [])[0]
        setDetailCourierId(String(latestAssign?.courier?.id || ''))
      }
    } catch (error) {
      setNotice(extractApiError(error, 'Detail pesanan gagal dimuat.'))
    }
  }

  function closeDetails() {
    setSelectedOrder(null)
  }

  async function assignCourier(orderId, courierIdValue) {
    if (!courierIdValue) return
    try {
      setBusy(true)
      setNotice('')
      await api.post(`/admin/orders/${orderId}/assign-courier`, {
        courier_id: Number(courierIdValue),
      })
      await reloadOrders()
      setNotice('Kurir berhasil ditugaskan ke pesanan.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menugaskan kurir.'))
    } finally {
      setBusy(false)
    }
  }

  async function dispatchSelectedOrder() {
    if (!selectedOrder || !detailCourierId) return
    try {
      setBusy(true)
      setNotice('')
      if (selectedOrder.order_status === 'created') {
        await api.patch(`/admin/orders/${selectedOrder.id}/status`, {
          order_status: 'processing',
          description: 'Diproses dan dikemas admin untuk pengantaran',
        })
      }
      const hasActiveAssignment = (selectedOrder.courier_assignments ?? []).some(
        (assignment) => !['completed', 'failed', 'cancelled'].includes(assignment.status),
      )
      if (!hasActiveAssignment) {
        await api.post(`/admin/orders/${selectedOrder.id}/assign-courier`, {
          courier_id: Number(detailCourierId),
        })
      }
      await reloadOrders()
      setNotice(`Pesanan #${selectedOrder.order_number} berhasil didispatch ke kurir.`)
      closeDetails()
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal dispatch pesanan.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleStatusUpdate(orderId, orderStatus, description) {
    try {
      setBusy(true)
      setNotice('')
      const { data } = await api.patch(`/admin/orders/${orderId}/status`, {
        order_status: orderStatus,
        description: description || null,
      })
      setSelectedOrder(data?.data ?? null)
      await reloadOrders()
      setNotice(`Status pesanan diperbarui ke "${orderStatus}".`)
    } catch (error) {
      setNotice(extractApiError(error, 'Status pesanan gagal diperbarui.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmPayment(order) {
    try {
      setBusy(true)
      setNotice('')
      await api.post(`/admin/orders/${order.id}/payment/confirm`, {
        amount: Number(order.total),
        note: 'Dikonfirmasi manual melalui dashboard admin',
      })
      await reloadOrders()
      const { data } = await api.get(`/admin/orders/${order.id}`)
      setSelectedOrder(data?.data ?? null)
      setNotice(`Pembayaran #${order.order_number} dikonfirmasi lunas.`)
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal mengonfirmasi pembayaran.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyInvoice(invoiceNumber) {
    try {
      const { data } = await api.get(`/admin/receipts/${encodeURIComponent(invoiceNumber)}/verify`)
      return data?.data ?? null
    } catch {
      return { valid: false }
    }
  }

  const columns = [
    {
      key: 'order_number',
      label: 'ID & Waktu',
      render: (order) => (
        <span className="orders__stack">
          <strong className="orders__id">#{order.order_number}</strong>
          <small>{formatOrderDate(order.placed_at)}</small>
        </span>
      ),
    },
    {
      key: 'recipient_name',
      label: 'Pelanggan & Alamat',
      render: (order) => (
        <span className="orders__stack orders__customer">
          <strong>{order.recipient_name}</strong>
          <small>{order.address_snapshot}</small>
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Total Bayar',
      render: (order) => (
        <span className="orders__stack">
          <strong className="orders__total">{formatRupiah(order.total)}</strong>
          <small>
            {(order.payment?.payment_method || 'qris').toUpperCase()} •{' '}
            {order.payment_status === 'paid' ? 'Lunas' : 'Belum'}
          </small>
        </span>
      ),
    },
    {
      key: 'order_status',
      label: 'Status Pesanan',
      render: (order) => {
        const meta = ORDER_STATUS_META[order.order_status] || {
          label: order.order_status,
          tone: 'neutral',
        }
        return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
      },
    },
    {
      key: 'courier',
      label: 'Penugasan Kurir',
      render: (order) => {
        const assignedId = order.courier_assignment?.courier_id
          ? String(order.courier_assignment.courier_id)
          : ''
        const canAssign = !['completed', 'cancelled'].includes(order.order_status)

        return (
          <label
            className={`orders__courier-select${
              assignedId ? ' orders__courier-select--assigned' : ''
            }`}
          >
            <Truck aria-hidden="true" size={13} />
            <select
              aria-label={`Pilih kurir untuk ${order.order_number}`}
              disabled={busy || !canAssign || Boolean(assignedId && order.courier_assignment?.status !== 'cancelled')}
              onChange={(event) => assignCourier(order.id, event.target.value)}
              value={assignedId}
            >
              <option value="">
                {assignedId ? order.courier_assignment?.courier_name : 'Pilih Kurir Antar...'}
              </option>
              {couriers.map((courier) => (
                <option key={courier.id} value={String(courier.id)}>
                  {courier.name}
                </option>
              ))}
            </select>
          </label>
        )
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (order) => (
        <div className="orders__actions">
          <button
            aria-label={`Cetak resi ${order.order_number}`}
            className="orders__icon-button"
            onClick={() => setPrintOrder(order)}
            title="Cetak resi gudang"
            type="button"
          >
            <Printer aria-hidden="true" size={14} />
          </button>
          <button
            aria-label={`Lihat detail ${order.order_number}`}
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
        description="Pantau pesanan masuk, ubah status, konfirmasi pembayaran COD/manual, dan tugaskan kurir pengantaran."
      />

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
            placeholder="Cari No. Pesanan, Nama, Alamat..."
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
        {loading ? (
          <p className="orders__empty">Memuat pesanan dari server...</p>
        ) : visibleOrders.length ? (
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
          busy={busy}
          canDispatch={!['completed', 'cancelled'].includes(selectedOrder.order_status)}
          courierId={detailCourierId}
          couriers={couriers}
          onClose={closeDetails}
          onConfirmPayment={handleConfirmPayment}
          onCourierChange={setDetailCourierId}
          onDispatch={dispatchSelectedOrder}
          onPrint={() => setPrintOrder(selectedOrder)}
          onStatusUpdate={handleStatusUpdate}
          onVerifyInvoice={handleVerifyInvoice}
          order={selectedOrder}
        />
      )}

      {printOrder && (
        <article className="orders__print">
          <header>
            <strong>SembakoPlus</strong>
            <span>RESI GUDANG</span>
          </header>
          <h1>Pesanan #{printOrder.order_number}</h1>
          <p>{formatOrderDate(printOrder.placed_at)}</p>
          <section>
            <strong>{printOrder.recipient_name}</strong>
            <span>{printOrder.recipient_phone}</span>
            <span>{printOrder.address_snapshot}</span>
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
              {(printOrder.items ?? []).map((item, index) => (
                <tr key={item.id ?? index}>
                  <td>{item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}</td>
                  <td>{item.quantity}</td>
                  <td>{formatRupiah(item.unit_price)}</td>
                  <td>{formatRupiah(item.line_total ?? item.quantity * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="orders__print-total">
            Total: <strong>{formatRupiah(printOrder.total)}</strong>
          </p>
        </article>
      )}
    </div>
  )
}

export default OrdersList
