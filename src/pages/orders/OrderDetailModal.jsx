import { useMemo, useState } from 'react'
import StatusBadge from '../../components/StatusBadge.jsx'
import { ORDER_STATUS_META, formatOrderDate, formatRupiah } from './ordersData.js'
import './OrderDetailModal.css'

const STATUS_OPTIONS = [
  { value: 'created', label: 'Menunggu Proses' },
  { value: 'processing', label: 'Sedang Diproses / Packing' },
  { value: 'delivering', label: 'Sedang Diantar' },
  { value: 'arrived', label: 'Tiba di Tujuan' },
  { value: 'completed', label: 'Selesai' },
  { value: 'failed_delivery', label: 'Pengantaran Gagal' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

function OrderDetailModal({
  order,
  couriers,
  courierId,
  onCourierChange,
  onClose,
  onDispatch,
  onStatusUpdate,
  onConfirmPayment,
  onVerifyInvoice,
  onPrint,
  canDispatch,
  busy = false,
}) {
  const [nextStatus, setNextStatus] = useState(order.order_status || 'processing')
  const [statusNote, setStatusNote] = useState('')
  const [verifyResult, setVerifyResult] = useState(null)

  const items = useMemo(() => order.items ?? [], [order.items])
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + Number(item.line_total ?? item.unit_price * item.quantity), 0),
    [items],
  )

  const statusMeta = ORDER_STATUS_META[order.order_status] || {
    label: order.order_status,
    tone: 'neutral',
  }
  const activeAssignment =
    (order.courier_assignments ?? []).find((item) => !['completed', 'failed', 'cancelled'].includes(item.status)) ??
    (order.courier_assignments ?? [])[0] ??
    order.courier_assignment ??
    null
  const proofUrl = (order.courier_assignments ?? []).find((item) => item.proof_photo_url)?.proof_photo_url
  const totalDiscount =
    Number(order.product_discount_total || 0) +
    Number(order.voucher_discount_total || 0) +
    Number(order.coin_discount_total || 0) +
    Number(order.shipping_discount || 0)

  async function handleCheckInvoice() {
    if (!order.invoice_number || !onVerifyInvoice) return
    const res = await onVerifyInvoice(order.invoice_number)
    setVerifyResult(res)
  }

  return (
    <div
      className="order-detail__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="order-detail-title"
        aria-modal="true"
        className="order-detail"
        role="dialog"
      >
        <header className="order-detail__header">
          <div>
            <div className="order-detail__title-row">
              <h2 id="order-detail-title">Rincian Pesanan #{order.order_number}</h2>
              <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
            </div>
            <p>
              Waktu Pesanan: {formatOrderDate(order.placed_at)} <span aria-hidden="true">•</span>{' '}
              Metode: {(order.payment?.payment_method || 'qris').toUpperCase()} (
              {order.payment_status === 'paid' ? 'Lunas' : 'Belum Dibayar'})
            </p>
          </div>
        </header>

        <div className="order-detail__content">
          <section className="order-detail__recipient">
            <strong>
              Penerima: {order.recipient_name} ({order.recipient_phone})
            </strong>
            <span>Alamat: {order.address_snapshot}</span>
            {order.delivery_schedule?.delivery_date && (
              <span>
                Jadwal: {order.delivery_schedule.delivery_date} • {order.delivery_schedule.start_time}–
                {order.delivery_schedule.end_time} WIB
              </span>
            )}
            {order.notes && (
              <p>
                <strong>Catatan Pembeli:</strong> {order.notes}
              </p>
            )}
            {order.invoice_number && (
              <p style={{ marginTop: 6 }}>
                <strong>Invoice:</strong> {order.invoice_number}{' '}
                <button
                  className="order-detail__button order-detail__button--print"
                  onClick={handleCheckInvoice}
                  style={{ padding: '3px 8px', fontSize: 10, marginLeft: 6 }}
                  type="button"
                >
                  Verifikasi Invoice
                </button>
                {verifyResult && (
                  <small style={{ display: 'block', marginTop: 4, color: '#166534' }}>
                    {verifyResult.valid
                      ? `Valid: ${verifyResult.order_number} (${verifyResult.payment_status})`
                      : 'Nomor invoice tidak ditemukan'}
                  </small>
                )}
              </p>
            )}
          </section>

          <section aria-label="Rincian item belanja" className="order-detail__items">
            <div className="order-detail__items-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Item Belanjaan</th>
                    <th scope="col">Qty</th>
                    <th scope="col">Harga Satuan</th>
                    <th scope="col">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id ?? `${item.product_name}-${index}`}>
                      <td>
                        {item.product_name} {item.variant_name ? `(${item.variant_name})` : ''}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatRupiah(item.unit_price)}</td>
                      <td>{formatRupiah(item.line_total ?? item.unit_price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="order-detail__totals">
              <div>
                <dt>Subtotal Produk ({items.length} Baris)</dt>
                <dd>{formatRupiah(order.subtotal ?? subtotal)}</dd>
              </div>
              <div>
                <dt>Ongkos Kirim ({order.delivery_service_type || 'regular'})</dt>
                <dd>{formatRupiah(order.shipping_cost)}</dd>
              </div>
              {totalDiscount > 0 && (
                <div>
                  <dt>Total Diskon / Subsidi / Koin</dt>
                  <dd className="order-detail__discount">-{formatRupiah(totalDiscount)}</dd>
                </div>
              )}
              <div className="order-detail__grand-total">
                <dt>TOTAL TAGIHAN ({(order.payment?.payment_method || 'QRIS').toUpperCase()})</dt>
                <dd>{formatRupiah(order.total)}</dd>
              </div>
            </dl>
          </section>

          {proofUrl && (
            <section className="order-detail__recipient">
              <strong>Bukti Pengantaran Kurir (Signed URL Admin)</strong>
              <a href={proofUrl} rel="noreferrer" target="_blank" style={{ color: '#2f6f18', fontSize: 11 }}>
                Buka Foto Bukti Pengantaran
              </a>
            </section>
          )}

          <section className="order-detail__courier">
            <strong>Penugasan Kurir Toko untuk Dispatch</strong>
            <label htmlFor="order-courier-select">
              {activeAssignment
                ? `Kurir Saat Ini: ${activeAssignment.courier?.name || activeAssignment.courier_name || '-'} (${activeAssignment.status})`
                : 'Pilih Kurir Pengantar *'}
            </label>
            <select
              id="order-courier-select"
              onChange={(event) => onCourierChange(event.target.value)}
              value={courierId}
            >
              <option value="">Pilih kurir pengantar...</option>
              {couriers.map((courier) => (
                <option key={courier.id} value={String(courier.id)}>
                  {courier.name} ({courier.phone || courier.email})
                </option>
              ))}
            </select>
          </section>

          <section className="order-detail__courier">
            <strong>Ubah Status Pesanan &amp; Konfirmasi Pembayaran</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              <select
                onChange={(event) => setNextStatus(event.target.value)}
                value={nextStatus}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                onChange={(event) => setStatusNote(event.target.value)}
                placeholder="Catatan perubahan status (opsional)"
                style={{ flex: '1 1 160px', padding: '6px 8px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 11 }}
                value={statusNote}
              />
              <button
                className="order-detail__button order-detail__button--print"
                disabled={busy}
                onClick={() => onStatusUpdate(order.id, nextStatus, statusNote)}
                type="button"
              >
                Simpan Status
              </button>
              {order.payment_status !== 'paid' && (
                <button
                  className="order-detail__button order-detail__button--dispatch"
                  disabled={busy}
                  onClick={() => onConfirmPayment(order)}
                  type="button"
                >
                  Konfirmasi Lunas Manual
                </button>
              )}
            </div>
          </section>
        </div>

        <footer className="order-detail__footer">
          <button
            className="order-detail__button order-detail__button--close"
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
          <button
            className="order-detail__button order-detail__button--print"
            onClick={onPrint}
            type="button"
          >
            Cetak Resi Gudang
          </button>
          <button
            className="order-detail__button order-detail__button--dispatch"
            disabled={busy || !courierId || !canDispatch}
            onClick={onDispatch}
            type="button"
          >
            Dispatch &amp; Tugaskan Kurir
          </button>
        </footer>
      </section>
    </div>
  )
}

export default OrderDetailModal
