import { X } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatRupiah } from './reportData.js'
import './WithdrawModal.css'

function WithdrawModal({ balance, onClose }) {
  return (
    <div
      className="withdraw-modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="withdraw-modal-title"
        aria-modal="true"
        className="withdraw-modal"
        role="dialog"
      >
        <header className="withdraw-modal__header">
          <div>
            <h2 id="withdraw-modal-title">Informasi Settlement Penjualan</h2>
            <p>
              Rekap total penjualan selesai pada periode laporan terpilih.
            </p>
          </div>
          <button
            aria-label="Tutup dialog"
            className="withdraw-modal__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <div className="withdraw-modal__form">
          <section className="withdraw-modal__balance">
            <div>
              <span>Total Penjualan Pesanan Selesai (Periode)</span>
              <strong>{formatRupiah(balance || 0)}</strong>
            </div>
            <StatusBadge tone="green">Tercatat Backend</StatusBadge>
          </section>

          <p className="withdraw-modal__demo-note" role="note">
            Sesuai rancangan v2.4, pencairan dana QRIS/pembayaran digital dikelola melalui dashboard merchant Midtrans dan setoran tunai COD oleh kurir—tidak ada endpoint penarikan dana langsung di backend.
          </p>

          <footer className="withdraw-modal__footer">
            <button
              className="withdraw-modal__cancel"
              onClick={onClose}
              type="button"
            >
              Tutup
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

export default WithdrawModal
