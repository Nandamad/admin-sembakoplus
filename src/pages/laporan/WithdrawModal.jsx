import { CheckCircle2, X } from 'lucide-react'
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
            <h2 id="withdraw-modal-title">Tarik Saldo Penjualan (Withdraw)</h2>
            <p>
              Informasi saldo dan rekening tujuan akan dimuat setelah backend
              tersedia.
            </p>
          </div>
          <button
            aria-label="Tutup form penarikan"
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
              <span>Total Saldo Siap Ditarik</span>
              <strong>
                {balance != null && balance > 0 ? formatRupiah(balance) : '—'}
              </strong>
            </div>
            <StatusBadge tone="neutral">Belum tersedia</StatusBadge>
          </section>

          <label className="withdraw-modal__field">
            <span>Rekening Bank Tujuan</span>
            <span className="withdraw-modal__static-field">
              <strong>Rekening tujuan belum diatur.</strong>
            </span>
          </label>

          <label className="withdraw-modal__field">
            <span>Nominal Penarikan Saldo *</span>
            <span className="withdraw-modal__amount-field">
              <span>Rp</span>
              <input
                aria-label="Nominal penarikan saldo"
                min="1"
                required
                type="number"
                disabled
              />
              <button
                className="withdraw-modal__all"
                disabled
                type="button"
              >
                Tarik Semua (100%)
              </button>
            </span>
          </label>

          <label className="withdraw-modal__field">
            <span>Berita Acara / Catatan Penarikan</span>
            <span className="withdraw-modal__note-field">
              <input
                maxLength={100}
                placeholder="Catatan penarikan (opsional)"
                value=""
                readOnly
              />
              <span>Catatan</span>
            </span>
          </label>

          <section className="withdraw-modal__summary" aria-label="Ringkasan transfer">
            <div>
              <span>Nominal Penarikan Pokok</span>
              <strong>—</strong>
            </div>
            <div>
              <span>Biaya Kliring / BI-FAST</span>
              <strong>—</strong>
            </div>
            <div>
              <span>Estimasi Waktu</span>
              <strong>—</strong>
            </div>
            <div className="withdraw-modal__net">
              <span>Total Uang Bersih Masuk ke Rekening</span>
              <strong>—</strong>
            </div>
          </section>

          <p className="withdraw-modal__demo-note" role="note">
            Penarikan belum dapat diproses sebelum backend dan rekening tujuan
            dikonfigurasi.
          </p>

          <footer className="withdraw-modal__footer">
            <button
              className="withdraw-modal__cancel"
              onClick={onClose}
              type="button"
            >
              Batalkan
            </button>
            <button className="withdraw-modal__submit" disabled type="button">
              <CheckCircle2 aria-hidden="true" size={14} />
              Belum Tersedia
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

export default WithdrawModal
