import { Check, ImagePlus, UploadCloud, X } from 'lucide-react'
import './ProductFormModal.css'

const units = ['kg', 'pack', 'ikat', 'pouch', 'sak', 'ekor', 'liter', 'botol']

function ProductFormModal({
  product,
  isEditing,
  onChange,
  onClose,
  onSave,
  onUpload,
  categories,
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
              user.
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
              <strong>Upload Foto Produk Berkualitas</strong>
              <small>Format PNG/JPG · Rasio 1:1 (Min. 500 × 500 px)</small>
              <small>Latar belakang bersih dan pencahayaan terang.</small>
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
                placeholder="SKU-SAY-018"
                value={product.sku}
              />
            </label>
            <label className="product-modal__field">
              <span>Kategori Produk *</span>
              <select
                name="category"
                onChange={handleChange}
                required
                value={product.category}
              >
                <option disabled value="">
                  {categories.length ? 'Pilih kategori' : 'Kategori belum tersedia'}
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="product-modal__field">
              <span>Satuan Barang</span>
              <select name="unit" onChange={handleChange} value={product.unit}>
                <option value="">Pilih satuan</option>
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
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
              <span>Harga Diskon / Promo (Opsional)</span>
              <input
                min="0"
                name="discountPrice"
                onChange={handleChange}
                type="number"
                value={product.discountPrice || ''}
              />
            </label>
            <label className="product-modal__field">
              <span>Stok Gudang Awal *</span>
              <input
                min="0"
                name="stock"
                onChange={handleChange}
                required
                type="number"
                value={product.stock}
              />
            </label>
            <label className="product-modal__field">
              <span>Peringatan Stok Menipis</span>
              <input
                min="0"
                name="lowStockAlert"
                onChange={handleChange}
                type="number"
                value={product.lowStockAlert}
              />
            </label>
          </div>

          <label className="product-modal__publish">
            <span>Publikasikan &amp; Langsung Tampilkan di Aplikasi Mobile</span>
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
            <button className="product-modal__save" type="submit">
              {product.imageUrl ? (
                <ImagePlus aria-hidden="true" size={15} />
              ) : (
                <Check aria-hidden="true" size={15} />
              )}
              <span>
                {isEditing ? 'Simpan Perubahan' : 'Simpan & Publikasikan'}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default ProductFormModal
