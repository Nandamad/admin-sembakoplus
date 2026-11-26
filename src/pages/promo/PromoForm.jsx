import { useState } from 'react'
import { X } from 'lucide-react'
import './PromoForm.css'

const discountTypes = [
  { value: 'fixed', label: 'Nominal Tetap (Potongan Langsung Rp)' },
  { value: 'percentage', label: 'Persentase Diskon (%)' },
  { value: 'free_shipping', label: 'Gratis Ongkir / Subsidi Ongkir' },
]

function PromoForm({ voucher, editing, onChange, onClose, onSave, saving = false }) {
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { checked, name, type, value } = event.target
    const nextValue =
      type === 'checkbox'
        ? checked
        : type === 'number' && value !== ''
          ? Number(value)
          : name === 'code'
            ? value.toUpperCase()
            : value

    onChange({ ...voucher, [name]: nextValue })
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (voucher.startsAt && voucher.endsAt && new Date(voucher.endsAt) <= new Date(voucher.startsAt)) {
      setMessage('Tanggal selesai harus setelah tanggal mulai.')
      return
    }

    const ok = await onSave(event)
    if (ok === false) {
      setMessage('Gagal menyimpan voucher. Periksa kode atau nilai potongan.')
      return
    }

    setMessage('')
  }

  const discountLabel =
    voucher.type === 'percentage'
      ? 'Nilai Potongan (%) *'
      : voucher.type === 'free_shipping'
        ? 'Subsidi Ongkir (Rp) *'
        : 'Nilai Potongan (Rp) *'

  return (
    <div
      className="promo-form__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="promo-form-title"
        aria-modal="true"
        className="promo-form"
        role="dialog"
      >
        <header className="promo-form__header">
          <div>
            <h2 id="promo-form-title">
              {editing
                ? `Edit Kupon Voucher: ${voucher.code || voucher.name}`
                : 'Buat Kupon Voucher Baru'}
            </h2>
            <p>
              Terbitkan voucher diskon atau gratis ongkir yang dikelola server SembakoPlus.
            </p>
          </div>
          <button
            aria-label="Tutup form voucher"
            className="promo-form__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form className="promo-form__body" onSubmit={handleSubmit}>
          <label className="promo-form__field promo-form__field--wide">
            <span>Kode Voucher *</span>
            <input
              autoFocus
              maxLength={40}
              name="code"
              onChange={handleChange}
              placeholder="Contoh: HEMAT10K"
              required
              value={voucher.code}
            />
          </label>

          <label className="promo-form__field promo-form__field--wide">
            <span>Nama Promosi Voucher *</span>
            <input
              name="name"
              onChange={handleChange}
              placeholder="Masukkan nama promosi voucher"
              required
              value={voucher.name}
            />
          </label>

          <div className="promo-form__grid">
            <label className="promo-form__field">
              <span>Tipe Potongan *</span>
              <select
                name="type"
                onChange={handleChange}
                value={voucher.type}
              >
                {discountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="promo-form__field">
              <span>{discountLabel}</span>
              <input
                min="0"
                name="discountValue"
                onChange={handleChange}
                required
                type="number"
                value={voucher.discountValue}
              />
            </label>

            <label className="promo-form__field">
              <span>Maksimum Potongan (Rp)</span>
              <input
                min="0"
                name="discountMax"
                onChange={handleChange}
                placeholder="Opsional (untuk tipe %)"
                type="number"
                value={voucher.discountMax ?? ''}
              />
            </label>

            <label className="promo-form__field">
              <span>Minimal Belanja (Rp) *</span>
              <input
                min="0"
                name="minSpend"
                onChange={handleChange}
                required
                type="number"
                value={voucher.minSpend}
              />
            </label>

            <label className="promo-form__field">
              <span>Kuota Global</span>
              <input
                min="1"
                name="quota"
                onChange={handleChange}
                placeholder="Kosong = tak terbatas"
                type="number"
                value={voucher.quota ?? ''}
              />
            </label>

            <label className="promo-form__field">
              <span>Batas per Pelanggan</span>
              <input
                min="1"
                name="perCustomerLimit"
                onChange={handleChange}
                placeholder="Contoh: 1"
                type="number"
                value={voucher.perCustomerLimit ?? ''}
              />
            </label>

            <label className="promo-form__field">
              <span>Tanggal Mulai Berlaku</span>
              <input
                name="startsAt"
                onChange={handleChange}
                type="datetime-local"
                value={voucher.startsAt}
              />
            </label>

            <label className="promo-form__field">
              <span>Tanggal Selesai</span>
              <input
                name="endsAt"
                onChange={handleChange}
                type="datetime-local"
                value={voucher.endsAt}
              />
            </label>
          </div>

          <label className="promo-form__publish">
            <span>Dapat Digabung dengan Koin Loyalitas</span>
            <input
              checked={Boolean(voucher.canCombineCoin)}
              name="canCombineCoin"
              onChange={handleChange}
              role="switch"
              type="checkbox"
            />
          </label>

          <label className="promo-form__publish">
            <span>Aktif &amp; Berlaku di Aplikasi Mobile</span>
            <input
              checked={Boolean(voucher.isActive)}
              name="isActive"
              onChange={handleChange}
              role="switch"
              type="checkbox"
            />
          </label>

          {message && (
            <p className="promo-form__message" role="status">
              {message}
            </p>
          )}

          <footer className="promo-form__footer">
            <button
              className="promo-form__cancel"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button className="promo-form__submit" disabled={saving} type="submit">
              {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Terbitkan Voucher'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default PromoForm
