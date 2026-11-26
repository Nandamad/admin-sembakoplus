import { useState } from 'react'
import { X } from 'lucide-react'
import './CourierSlotFormModal.css'

function getMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number)
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function CourierSlotFormModal({
  draft,
  editing,
  onChange,
  onClose,
  onSave,
}) {
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    onChange({ ...draft, [name]: value })
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    const times = draft.timeRange.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) || []
    if (times.length < 2) {
      setMessage('Gunakan format jam mulai dan selesai: HH:MM - HH:MM WIB.')
      return
    }

    if (getMinutes(times[1]) <= getMinutes(times[0])) {
      setMessage('Jam selesai harus setelah jam mulai dalam satu hari.')
      return
    }

    if (Number(draft.capacity) < Number(draft.booked || 0)) {
      setMessage('Kuota tidak boleh lebih kecil dari pesanan yang sudah terisi.')
      return
    }

    if (onSave(event) === false) {
      setMessage('Nama sesi sudah digunakan. Gunakan nama sesi yang berbeda.')
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
              {editing
                ? `Edit Slot Pengiriman: ${draft.name}`
                : 'Tambah Slot Jam Pengiriman Kurir Baru'}
            </h2>
            <p>
              Atur batasan jam antar, waktu pemesanan (cut-off), dan alokasi
              kuota
            </p>
          </div>
          <button
            aria-label="Tutup form slot jam kurir"
            className="courier-slot-modal__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form className="courier-slot-modal__form" onSubmit={handleSubmit}>
          <label className="courier-slot-modal__field">
            <span>Nama Sesi Pengiriman *</span>
            <input
              autoFocus
              maxLength={100}
              name="name"
              onChange={handleChange}
              placeholder="Masukkan nama sesi"
              required
              value={draft.name}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Rentang Jam Pengantaran (WIB) *</span>
            <input
              maxLength={40}
              name="timeRange"
              onChange={handleChange}
              placeholder="HH:MM - HH:MM WIB"
              required
              value={draft.timeRange}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Batas Maksimal Order / Cut-Off (WIB) *</span>
            <input
              maxLength={40}
              name="cutoff"
              onChange={handleChange}
              placeholder="Masukkan batas waktu cut-off"
              required
              value={draft.cutoff}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Batas Kuota Pesanan (Slot) *</span>
            <input
              min="1"
              name="capacity"
              onChange={handleChange}
              placeholder="Masukkan jumlah slot"
              required
              type="number"
              value={draft.capacity}
            />
          </label>

          <label className="courier-slot-modal__field">
            <span>Jumlah Armada Kurir Siaga *</span>
            <input
              min="1"
              name="couriers"
              onChange={handleChange}
              placeholder="Masukkan jumlah kurir"
              required
              type="number"
              value={draft.couriers}
            />
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
            <button className="courier-slot-modal__submit" type="submit">
              Simpan Slot Jam Kurir
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default CourierSlotFormModal
