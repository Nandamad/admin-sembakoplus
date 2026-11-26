import { useState } from 'react'
import { X } from 'lucide-react'
import './ShippingZoneFormModal.css'

function ShippingZoneFormModal({
  draft,
  editing,
  rateTypes = [],
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

    if (Number(draft.maxKm) <= Number(draft.minKm)) {
      setMessage('Jarak akhir (KM) harus lebih besar dari jarak awal (KM).')
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
      className="shipping-zone-modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="shipping-zone-modal-title"
        aria-modal="true"
        className="shipping-zone-modal"
        role="dialog"
      >
        <header className="shipping-zone-modal__header">
          <div>
            <h2 id="shipping-zone-modal-title">
              {editing ? 'Edit Tier Tarif Ongkir' : 'Tambah Tier Tarif Ongkir'}
            </h2>
            <p>
              Rentang jarak (KM) akan dikonversi ke meter dan divalidasi kontiguitasnya oleh backend.
            </p>
          </div>
          <button
            aria-label="Tutup form tier ongkir"
            className="shipping-zone-modal__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form className="shipping-zone-modal__form" onSubmit={handleSubmit}>
          <label className="shipping-zone-modal__field">
            <span>Jenis Layanan *</span>
            <select
              name="rateTypeId"
              onChange={handleChange}
              required
              value={draft.rateTypeId}
            >
              {rateTypes.map((type) => (
                <option key={type.id} value={String(type.id)}>
                  {type.name} — {type.description || 'Layanan pengiriman'}
                </option>
              ))}
            </select>
          </label>

          <label className="shipping-zone-modal__field">
            <span>Jarak Minimum (KM) *</span>
            <input
              min="0"
              name="minKm"
              onChange={handleChange}
              required
              step="0.1"
              type="number"
              value={draft.minKm}
            />
          </label>

          <label className="shipping-zone-modal__field">
            <span>Jarak Maksimum (KM) *</span>
            <input
              min="0.1"
              name="maxKm"
              onChange={handleChange}
              required
              step="0.1"
              type="number"
              value={draft.maxKm}
            />
          </label>

          <label className="shipping-zone-modal__field">
            <span>Tarif Ongkos Kirim (Rp) *</span>
            <input
              min="0"
              name="fee"
              onChange={handleChange}
              required
              type="number"
              value={draft.fee}
            />
          </label>

          <label className="shipping-zone-modal__field">
            <span>Prioritas</span>
            <input
              min="0"
              name="priority"
              onChange={handleChange}
              type="number"
              value={draft.priority}
            />
          </label>

          <label className="shipping-zone-modal__field">
            <span>Status Tier</span>
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
            <p className="shipping-zone-modal__message" role="alert">
              {message}
            </p>
          )}

          <footer className="shipping-zone-modal__footer">
            <button
              className="shipping-zone-modal__cancel"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button className="shipping-zone-modal__submit" disabled={saving} type="submit">
              {saving ? 'Menyimpan...' : 'Simpan Tier Ongkir'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default ShippingZoneFormModal
