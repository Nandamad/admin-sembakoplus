import { useState } from 'react'
import { X } from 'lucide-react'
import './ShippingZoneFormModal.css'

function ShippingZoneFormModal({
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
    const radiusValues = draft.radiusRange.match(/\d+(?:[.,]\d+)?/g) || []

    if (!radiusValues.length) {
      setMessage('Masukkan rentang radius dalam kilometer.')
      return
    }

    if (
      radiusValues.length > 1 &&
      Number(radiusValues[0].replace(',', '.')) >
        Number(radiusValues[1].replace(',', '.'))
    ) {
      setMessage('Radius akhir harus lebih besar atau sama dengan radius awal.')
      return
    }

    if (onSave(event) === false) {
      setMessage('Nama zona sudah digunakan. Gunakan nama yang berbeda.')
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
              {editing
                ? `Edit Skema & Zona Ongkir: ${draft.zoneLabel}`
                : 'Tambah Skema & Zona Ongkir Baru'}
            </h2>
            <p>
              Tentukan batasan radius kilometer, tarif dasar, dan subsidi toko
            </p>
          </div>
          <button
            aria-label="Tutup form zona ongkir"
            className="shipping-zone-modal__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form className="shipping-zone-modal__form" onSubmit={handleSubmit}>
          <label className="shipping-zone-modal__field">
            <span>Nama Zona &amp; Wilayah Cakupan *</span>
            <input
              autoFocus
              maxLength={120}
              name="zoneLabel"
              onChange={handleChange}
              placeholder="Masukkan nama zona dan wilayah"
              required
              value={draft.zoneLabel}
            />
          </label>

          <label className="shipping-zone-modal__field">
            <span>Rentang Radius Kilometer (KM) *</span>
            <input
              maxLength={40}
              name="radiusRange"
              onChange={handleChange}
              placeholder="Masukkan rentang radius (KM)"
              required
              value={draft.radiusRange}
            />
          </label>

          <label className="shipping-zone-modal__field">
            <span>Tarif Ongkos Kirim Standar (Rp) *</span>
            <input
              min="0"
              name="normalFee"
              onChange={handleChange}
              placeholder="Masukkan tarif standar"
              required
              type="number"
              value={draft.normalFee}
            />
          </label>

          <label className="shipping-zone-modal__field">
            <span>Alokasi Subsidi Ongkir Toko (Rp) *</span>
            <input
              min="0"
              name="subsidy"
              onChange={handleChange}
              placeholder="Masukkan alokasi subsidi"
              required
              type="number"
              value={draft.subsidy}
            />
          </label>

          <label className="shipping-zone-modal__field">
            <span>Estimasi Durasi Pengantaran Kurir *</span>
            <input
              maxLength={40}
              name="eta"
              onChange={handleChange}
              placeholder="Masukkan estimasi durasi"
              required
              value={draft.eta}
            />
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
            <button className="shipping-zone-modal__submit" type="submit">
              Simpan Zona Ongkir
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default ShippingZoneFormModal
