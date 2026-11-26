import { useState } from 'react'
import { X } from 'lucide-react'
import './CategoryFormModal.css'

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function CategoryFormModal({ draft, editing, onChange, onClose, onSave, saving = false }) {
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    const updatedDraft = { ...draft, [name]: value }
    if (name === 'name') updatedDraft.slug = createSlug(value)
    onChange(updatedDraft)
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const ok = await onSave(event)
    if (ok === false) {
      setMessage('Gagal menyimpan kategori. Periksa ulang isian Anda.')
    }
  }

  return (
    <div
      className="category-form__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="category-form-title"
        aria-modal="true"
        className="category-form"
        role="dialog"
      >
        <header className="category-form__header">
          <div>
            <h2 id="category-form-title">
              {editing ? 'Edit Kategori Produk' : 'Tambah Kategori Produk Baru'}
            </h2>
            <p>
              Buat master kategori baru untuk klasifikasi produk di katalog dan
              beranda mobile.
            </p>
          </div>
          <button
            aria-label="Tutup form kategori"
            className="category-form__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form className="category-form__body" onSubmit={handleSubmit}>
          <label className="category-form__field">
            <span>Nama Kategori Produk *</span>
            <input
              autoFocus
              maxLength={100}
              name="name"
              onChange={handleChange}
              placeholder="Masukkan nama kategori"
              required
              value={draft.name}
            />
          </label>

          <label className="category-form__field">
            <span>Slug URL Sistem (Auto-Generate)</span>
            <input
              aria-label="Slug URL sistem"
              placeholder="Slug dibuat otomatis"
              readOnly
              value={draft.slug}
            />
          </label>

          <label className="category-form__field">
            <span>Urutan Prioritas Tampil di Mobile *</span>
            <input
              min="0"
              name="priority"
              onChange={handleChange}
              required
              type="number"
              value={draft.priority}
            />
          </label>

          <label className="category-form__field">
            <span>Deskripsi Ringkas Kategori</span>
            <input
              maxLength={500}
              name="description"
              onChange={handleChange}
              placeholder="Jelaskan isi kategori secara singkat"
              value={draft.description}
            />
          </label>

          <label className="category-form__field">
            <span>Status Tayang di Aplikasi</span>
            <select
              name="active"
              onChange={(event) =>
                onChange({ ...draft, active: event.target.value === 'true' })
              }
              value={String(draft.active)}
            >
              <option value="true">
                Aktif &amp; Tampilkan Langsung di Beranda Mobile
              </option>
              <option value="false">Nonaktif &amp; Sembunyikan dari Beranda</option>
            </select>
          </label>

          {message && (
            <p className="category-form__message" role="alert">
              {message}
            </p>
          )}

          <footer className="category-form__footer">
            <button
              className="category-form__cancel"
              onClick={onClose}
              type="button"
            >
              Batalkan
            </button>
            <button className="category-form__submit" disabled={saving} type="submit">
              {saving
                ? 'Menyimpan...'
                : editing
                  ? 'Simpan Perubahan'
                  : 'Simpan Kategori Baru'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default CategoryFormModal
