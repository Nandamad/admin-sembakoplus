import { useState } from 'react'
import { X } from 'lucide-react'
import './CourierSlotFormModal.css'

function tomorrowDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

function CourierSlotFormModal({
  draft,
  editing,
  onChange,
  onClose,
  onSave,
  saving = false,
}) {
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { checked, name, type, value } = event.target
    onChange({ ...draft, [name]: type === 'checkbox' ? checked : value })
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!draft.delivery_date) {
      setMessage('Tanggal pengiriman wajib diisi.')
      return
    }
    if (!draft.start_time || !draft.end_time || draft.end_time <= draft.start_time) {
      setMessage('Jam selesai harus setelah jam mulai dalam satu hari.')
      return
    }
    if (Number(draft.quota) < Number(draft.reserved_count || 0)) {
      setMessage('Kuota tidak boleh lebih kecil dari pesanan yang sudah terisi.')
      return
    }

    const result = await onSave(event)
    if (typeof result === 'string') {
      setMessage(result)
      return
    }
    setMessage('')
  }

  return (
    <div
      className="courier-slot-modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="courier-slot-modal-title"
        aria-modal="true"
        className="courier-slot-modal"
        role="dialog"
      >
        <header className="courier-slot-modal__header">
          <div>
            <h2 id="courier-slot-modal-title">
              {editing ? 'Edit Slot Jadwal Pengiriman' : 'Tambah Slot Jadwal Baru'}
            </h2>
            <p>
              Jadwal pengiriman menggunakan tanggal spesifik setelah hari ini.
            </p>
          </div>
          <button
            aria-label="Tutup form jadwal"
            className="courier-slot-modal__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form className="courier-slot-modal__form" onSubmit={handleSubmit}>
          <label className="courier-slot-modal__field">
            <span>Tanggal Pengiriman *</span>
            <input
              autoFocus
              min={tomorrowDate()}
              name="delivery_date"
              onChange={handleChange}
              required
              type="date"
              value={draft.delivery_date}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Jam Mulai (WIB) *</span>
            <input
              name="start_time"
              onChange={handleChange}
              required
              type="time"
              value={draft.start_time}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Jam Selesai (WIB) *</span>
            <input
              name="end_time"
              onChange={handleChange}
              required
              type="time"
              value={draft.end_time}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Kuota Maksimal Pesanan *</span>
            <input
              min="1"
              name="quota"
              onChange={handleChange}
              required
              type="number"
              value={draft.quota}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Catatan Operasional (Opsional)</span>
            <input
              maxLength={500}
              name="notes"
              onChange={handleChange}
              placeholder="Contoh: Gelombang pagi armada prioritas"
              value={draft.notes || ''}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Status Jadwal</span>
            <select
              name="is_active"
              onChange={(event) => onChange({ ...draft, is_active: event.target.value === 'true' })}
              value={String(Boolean(draft.is_active))}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </label>

          {message && (
            <p className="courier-slot-modal__message" role="alert">
              {message}
            </p>
          )}

          <footer className="courier-slot-modal__footer">
            <button
              className="courier-slot-modal__cancel"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button className="courier-slot-modal__submit" disabled={saving} type="submit">
              {saving ? 'Menyimpan...' : 'Simpan Jadwal Pengiriman'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default CourierSlotFormModal
