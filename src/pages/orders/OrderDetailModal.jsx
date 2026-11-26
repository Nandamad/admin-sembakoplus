import { useMemo } from 'react'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatRupiah } from './ordersData.js'
import './OrderDetailModal.css'

function OrderDetailModal({
  order,
  couriers,
  courierId,
  onCourierChange,
  onClose,
  onDispatch,
  onPrint,
  canDispatch,
}) {
  const subtotal = useMemo(
    () =>
      order.items.reduce(
        (total, item) => total + item.quantity * item.unitPrice,
        0,
      ),
    [order.items],
  )

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
              <h2 id="order-detail-title">Rincian Pesanan {order.id}</h2>
              <StatusBadge tone={order.statusTone}>{order.status}</StatusBadge>
            </div>
            <p>
              Waktu Pesanan: {order.timeLabel} <span aria-hidden="true">•</span>{' '}
              Metode: {order.paymentMethod}
            </p>
          </div>
        </header>

        <div className="order-detail__content">
          <section className="order-detail__recipient">
            <strong>
              Penerima: {order.customer} ({order.phone})
            </strong>
            <span>Alamat: {order.address}</span>
            {order.note && (
              <p>
                <strong>Catatan Pembeli:</strong> {order.note}
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
                  {order.items.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{formatRupiah(item.unitPrice)}</td>
                      <td>{formatRupiah(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="order-detail__totals">
              <div>
                <dt>Subtotal Produk ({order.items.length} Barang)</dt>
                <dd>{formatRupiah(subtotal)}</dd>
              </div>
              <div>
                <dt>{order.shippingLabel}</dt>
                <dd>{formatRupiah(order.shippingFee)}</dd>
              </div>
              {order.discount > 0 && (
                <div>
                  <dt>{order.discountLabel}</dt>
                  <dd className="order-detail__discount">
                    -{formatRupiah(order.discount)}
                  </dd>
                </div>
              )}
              <div className="order-detail__grand-total">
                <dt>TOTAL TAGIHAN ({order.paymentShortLabel})</dt>
                <dd>{formatRupiah(order.totalAmount)}</dd>
              </div>
            </dl>
          </section>

          <section className="order-detail__courier">
            <strong>Penugasan Kurir Toko untuk Dispatch</strong>
            <label htmlFor="order-courier-select">Pilih Kurir Pengantar *</label>
            <select
              id="order-courier-select"
              onChange={(event) => onCourierChange(event.target.value)}
              required
              value={courierId}
            >
              <option value="">Pilih kurir pengantar...</option>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.detailLabel}
                </option>
              ))}
            </select>
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
            disabled={!courierId || !canDispatch}
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
