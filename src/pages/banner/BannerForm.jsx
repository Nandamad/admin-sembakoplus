import { Check, ImagePlus, UploadCloud } from 'lucide-react'
import BannerArtwork from './BannerArtwork.jsx'
import './BannerForm.css'

function BannerForm({ banner, onDraftChange, onSave, onUpload, message }) {
  function handleChange(event) {
    const { checked, name, type, value } = event.target
    onDraftChange({
      ...banner,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  return (
    <form className="banner-form" onSubmit={onSave}>
      <header className="banner-form__header">
        <h2>Form Banner Mobile</h2>
        <p>Unggah grafis banner dan tentukan link aksi tujuan pengguna.</p>
      </header>

      <label className="banner-form__upload-label" htmlFor="banner-image">
        <span className="banner-form__upload-preview">
          {banner.imageUrl ? (
            <img src={banner.imageUrl} alt="" />
          ) : (
            <BannerArtwork className="banner-form__artwork" />
          )}
        </span>
        <span className="banner-form__upload-prompt">
          <UploadCloud aria-hidden="true" size={19} />
          <strong>Klik untuk Upload Banner Baru</strong>
          <small>Format PNG/JPG · Rasio 2:1 1720 × 860 px</small>
        </span>
      </label>
      <input
        accept="image/png,image/jpeg,image/webp"
        className="banner-form__file-input"
        id="banner-image"
        onChange={onUpload}
        type="file"
      />

      <label className="banner-form__field">
        <span>Judul Promosi Banner</span>
        <input
          name="title"
          onChange={handleChange}
          required
          value={banner.title}
        />
      </label>

      <label className="banner-form__field">
        <span>Tautan / Aksi Saat Banner Diklik</span>
        <input
          name="link"
          onChange={handleChange}
          value={banner.link}
        />
      </label>

      <fieldset className="banner-form__schedule">
        <legend>Jadwal Periode Tayang</legend>
        <label>
          <span>Mulai</span>
          <input
            name="startsAt"
            onChange={handleChange}
            required
            type="datetime-local"
            value={banner.startsAt}
          />
        </label>
        <label>
          <span>Selesai</span>
          <input
            name="endsAt"
            onChange={handleChange}
            required
            type="datetime-local"
            value={banner.endsAt}
          />
        </label>
      </fieldset>

      <label className="banner-form__toggle-row">
        <span>
          <strong>Status Publikasi di Aplikasi</strong>
          <small>Banner akan langsung live di homepage user.</small>
        </span>
        <input
          checked={banner.isActive}
          name="isActive"
          onChange={handleChange}
          role="switch"
          type="checkbox"
        />
      </label>

      {message && (
        <p className="banner-form__message" role="status">
          {message}
        </p>
      )}

      <button className="banner-form__submit" type="submit">
        {banner.imageUrl ? (
          <ImagePlus aria-hidden="true" size={15} />
        ) : (
          <Check aria-hidden="true" size={15} />
        )}
        <span>Simpan &amp; Terapkan Perubahan</span>
      </button>
    </form>
  )
}

export default BannerForm
