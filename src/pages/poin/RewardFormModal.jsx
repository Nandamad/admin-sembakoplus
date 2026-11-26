import { useState } from 'react'
import { X } from 'lucide-react'
import './RewardFormModal.css'

function RewardFormModal({ draft, editing, onChange, onClose, onSave }) {
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    onChange({ ...draft, [name]: value })
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (onSave(event) === false) {
      setMessage('Nama reward sudah digunakan. Gunakan nama yang berbeda.')
      return
    }

    setMessage('')
  }

  return (
    <div
      className="reward-form__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="reward-form-title"
        aria-modal="true"
        className="reward-form"
        role="dialog"
      >
        <header className="reward-form__header">
          <div>
            <h2 id="reward-form-title">
              {editing
                ? `Edit Reward & Kupon Poin: ${draft.name}`
                : 'Buat Reward & Kupon Poin Loyalitas Baru'}
            </h2>
            <p>
              Buat penawaran diskon sembako yang dapat ditukarkan pelanggan
              dengan poin.
            </p>
          </div>
          <button
            aria-label="Tutup form reward"
            className="reward-form__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form className="reward-form__body" onSubmit={handleSubmit}>
          <label className="reward-form__field">
            <span>Nama Kupon / Reward Poin *</span>
            <input
              autoFocus
              maxLength={100}
              name="name"
              onChange={handleChange}
              placeholder="Masukkan nama reward"
              required
              value={draft.name}
            />
          </label>

          <label className="reward-form__field">
            <span>Jumlah Poin Penukaran Dibutuhkan *</span>
            <input
              min="1"
              name="pointsRequired"
              onChange={handleChange}
              placeholder="Masukkan jumlah poin"
              required
              type="number"
              value={draft.pointsRequired}
            />
          </label>

          <label className="reward-form__field">
            <span>Nilai Potongan Diskon (Rp) *</span>
            <input
              min="1"
              name="discountAmount"
              onChange={handleChange}
              placeholder="Masukkan nilai potongan"
              required
              type="number"
              value={draft.discountAmount}
            />
          </label>

          <label className="reward-form__field">
            <span>Syarat Minimal Belanja Pengguna (Rp) *</span>
            <input
              min="0"
              name="minSpend"
              onChange={handleChange}
              placeholder="Masukkan minimal belanja"
              required
              type="number"
              value={draft.minSpend}
            />
          </label>

          <label className="reward-form__field">
            <span>Alokasi Kuota Klaim Voucher *</span>
            <input
              min="1"
              name="quota"
              onChange={handleChange}
              placeholder="Masukkan jumlah kuota"
              required
              type="number"
              value={draft.quota}
            />
          </label>

          {message && (
            <p className="reward-form__message" role="alert">
              {message}
            </p>
          )}

          <footer className="reward-form__footer">
            <button
              className="reward-form__cancel"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button className="reward-form__submit" type="submit">
              {editing ? 'Simpan Perubahan' : 'Terbitkan Reward Poin'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default RewardFormModal
