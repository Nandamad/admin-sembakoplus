import { useState } from 'react'
import { X } from 'lucide-react'
import './RewardFormModal.css'

function RewardFormModal({ draft, editing, onChange, onClose, onSave, saving = false }) {
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { checked, name, type, value } = event.target
    onChange({ ...draft, [name]: type === 'checkbox' ? checked : value })
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await onSave(event)
    if (typeof result === 'string') {
      setMessage(result)
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
              {editing ? `Edit Reward: ${draft.name}` : 'Buat Reward Penukaran Koin Baru'}
            </h2>
            <p>
              Buat hadiah atau potongan belanja yang dapat ditukar pelanggan dengan koin.
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
            <span>Nama Reward Poin *</span>
            <input
              autoFocus
              maxLength={150}
              name="name"
              onChange={handleChange}
              placeholder="Contoh: Potongan Belanja Rp5.000"
              required
              value={draft.name}
            />
          </label>

          <label className="reward-form__field">
            <span>Tipe Reward *</span>
            <select name="type" onChange={handleChange} value={draft.type || 'discount'}>
              <option value="discount">Diskon / Potongan (Rp)</option>
              <option value="gift">Hadiah Barang (Gift)</option>
            </select>
          </label>

          <label className="reward-form__field">
            <span>Jumlah Koin Dibutuhkan *</span>
            <input
              min="1"
              name="pointsRequired"
              onChange={handleChange}
              required
              type="number"
              value={draft.pointsRequired}
            />
          </label>

          <label className="reward-form__field">
            <span>Nilai Reward (Rp)</span>
            <input
              min="0"
              name="discountAmount"
              onChange={handleChange}
              placeholder="Contoh: 5000"
              type="number"
              value={draft.discountAmount}
            />
          </label>

          <label className="reward-form__field">
            <span>Stok / Kuota Reward (Opsional)</span>
            <input
              min="0"
              name="quota"
              onChange={handleChange}
              placeholder="Kosongkan jika tak terbatas"
              type="number"
              value={draft.quota ?? ''}
            />
          </label>

          <label className="reward-form__field">
            <span>Deskripsi</span>
            <input
              maxLength={255}
              name="description"
              onChange={handleChange}
              placeholder="Keterangan penukaran reward"
              value={draft.description || ''}
            />
          </label>

          <label className="reward-form__field">
            <span>Status</span>
            <select
              name="active"
              onChange={(event) => onChange({ ...draft, active: event.target.value === 'true' })}
              value={String(Boolean(draft.active))}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
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
            <button className="reward-form__submit" disabled={saving} type="submit">
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Terbitkan Reward Koin'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default RewardFormModal
