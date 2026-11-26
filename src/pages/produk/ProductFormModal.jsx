import { Check, ImagePlus, UploadCloud, X } from 'lucide-react'
import './ProductFormModal.css'

const units = ['kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'ikat', 'pouch', 'sak', 'botol']

function ProductFormModal({
  product,
  isEditing,
  onChange,
  onClose,
  onSave,
  onUpload,
  categories = [],
  saving = false,
}) {
  function handleChange(event) {
    const { checked, name, type, value } = event.target
    onChange({
      ...product,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number' && value !== ''
            ? Number(value)
            : value,
    })
  }

  return (
    <div
      className="product-modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="product-modal-title"
        aria-modal="true"
        className="product-modal"
        role="dialog"
      >
        <header className="product-modal__header">
          <div>
            <h2 id="product-modal-title">
              {isEditing ? 'Edit Produk Katalog' : 'Tambah Produk Baru ke Katalog'}
            </h2>
            <p>
              Lengkapi detail informasi produk sembako agar tampil di aplikasi
              pelanggan.
            </p>
          </div>
          <button
            aria-label="Tutup form produk"
            className="product-modal__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </header>

        <form className="product-modal__form" onSubmit={onSave}>
          <label className="product-modal__upload" htmlFor="product-image">
            <span className="product-modal__image">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" />
              ) : (
                <ImagePlus aria-hidden="true" size={18} />
              )}
            </span>
            <span className="product-modal__upload-copy">
              <UploadCloud aria-hidden="true" size={17} />
              <strong>Upload Foto Produk (Opsional)</strong>
              <small>Format PNG/JPG/WEBP · Maks 5 MB</small>
            </span>
          </label>
          <input
            accept="image/png,image/jpeg,image/webp"
            className="product-modal__file-input"
            id="product-image"
            onChange={onUpload}
            type="file"
          />

          <div className="product-modal__fields">
            <label className="product-modal__field product-modal__field--wide">
              <span>Nama Produk Sembako *</span>
              <input
                autoFocus
                name="name"
                onChange={handleChange}
                placeholder="Masukkan nama produk"
                required
                value={product.name}
              />
            </label>
            <label className="product-modal__field">
              <span>Kode SKU / Barcode</span>
              <input
                name="sku"
                onChange={handleChange}
                placeholder="SKU-SEMBAKO-01"
                value={product.sku}
              />
            </label>
            <label className="product-modal__field">
              <span>Kategori Produk *</span>
              <select
                name="categoryId"
                onChange={handleChange}
                required
                value={String(product.categoryId || '')}
              >
                <option disabled value="">
                  {categories.length ? 'Pilih kategori' : 'Kategori belum tersedia'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="product-modal__field">
              <span>Label Varian Utama *</span>
              <input
                name="variantName"
                onChange={handleChange}
                placeholder="Contoh: 1 Kg atau 500 Gram"
                value={product.variantName}
              />
            </label>
            <label className="product-modal__field">
              <span>Bobot Angka &amp; Satuan *</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <input
                  min="0.01"
                  name="quantityValue"
                  onChange={handleChange}
                  required
                  step="0.01"
                  type="number"
                  value={product.quantityValue}
                />
                <select name="unit" onChange={handleChange} required value={product.unit}>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className="product-modal__field">
              <span>Harga Normal (Rp) *</span>
              <input
                min="0"
                name="price"
                onChange={handleChange}
                required
                type="number"
                value={product.price}
              />
            </label>
            <label className="product-modal__field">
              <span>Harga Setelah Diskon (Opsional)</span>
              <input
                min="0"
                name="discountPrice"
                onChange={handleChange}
                placeholder="Kosongkan jika tidak diskon"
                type="number"
                value={product.discountPrice || ''}
              />
            </label>
            <label className="product-modal__field">
              <span>Stok Gudang *</span>
              <input
                min="0"
                name="stock"
                onChange={handleChange}
                required
                type="number"
                value={product.stock}
              />
            </label>
            <label className="product-modal__field product-modal__field--wide">
              <span>Deskripsi Produk</span>
              <input
                name="description"
                onChange={handleChange}
                placeholder="Keterangan singkat produk untuk pelanggan"
                value={product.description}
              />
            </label>
          </div>

          <label className="product-modal__publish">
            <span>Publikasikan &amp; Tampilkan di Aplikasi Mobile</span>
            <input
              checked={product.isPublished}
              name="isPublished"
              onChange={handleChange}
              role="switch"
              type="checkbox"
            />
          </label>

          <footer className="product-modal__footer">
            <button
              className="product-modal__cancel"
              onClick={onClose}
              type="button"
            >
              Batal
            </button>
            <button className="product-modal__save" disabled={saving} type="submit">
              {product.imageUrl ? (
                <ImagePlus aria-hidden="true" size={15} />
              ) : (
                <Check aria-hidden="true" size={15} />
              )}
              <span>
                {saving
                  ? 'Menyimpan...'
                  : isEditing
                    ? 'Simpan Perubahan'
                    : 'Simpan & Publikasikan'}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default ProductFormModal
