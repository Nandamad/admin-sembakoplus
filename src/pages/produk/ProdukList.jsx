import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import ProductFormModal from './ProductFormModal.jsx'
import './ProdukList.css'

const productsPerPage = 6
const initialProducts = []

const emptyProduct = {
  name: '',
  sku: '',
  category: '',
  price: '',
  discountPrice: '',
  stock: '',
  unit: '',
  lowStockAlert: '',
  isPublished: false,
  tone: 'green',
}

function formatRupiah(value) {
  if (!value) return '—'
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

function getStockStatus(product) {
  if (product.stock <= 0) return { label: 'Habis', tone: 'red' }
  if (product.stock <= product.lowStockAlert) {
    return { label: 'Menipis', tone: 'orange' }
  }
  return { label: 'Tersedia', tone: 'green' }
}

function ProdukList() {
  const [products, setProducts] = useState(initialProducts)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')
  const imageUrls = useRef([])
  const categoryNames = [...new Set(products.map((product) => product.category).filter(Boolean))]
  const categories = [
    { label: 'Semua Kategori', value: 'all', count: products.length },
    ...categoryNames.map((name) => ({
      label: name,
      value: name,
      count: products.filter((product) => product.category === name).length,
    })),
  ]

  useEffect(
    () => () => {
      imageUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory
    const searchText = `${product.name} ${product.sku} ${product.category}`.toLowerCase()
    return matchesCategory && searchText.includes(query.trim().toLowerCase())
  })

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage))
  const visibleProducts = filteredProducts.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage,
  )
  const displayTotal = filteredProducts.length
  const firstProduct = filteredProducts.length ? (page - 1) * productsPerPage + 1 : 0
  const lastProduct = Math.min(page * productsPerPage, filteredProducts.length)

  function openAddForm() {
    setDraft({ ...emptyProduct })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(product) {
    setDraft({ ...product })
    setEditing(true)
    setNotice('')
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    imageUrls.current.push(imageUrl)
    setDraft((current) => ({ ...current, imageUrl }))
  }

  function saveProduct(event) {
    event.preventDefault()
    const savedProduct = {
      ...draft,
      id: draft.id || Date.now(),
      price: Number(draft.price),
      discountPrice: Number(draft.discountPrice) || 0,
      stock: Number(draft.stock),
      lowStockAlert: Number(draft.lowStockAlert) || 0,
    }

    if (editing) {
      setProducts((current) =>
        current.map((product) =>
          product.id === savedProduct.id ? savedProduct : product,
        ),
      )
      setNotice('Produk diperbarui pada tampilan ini. Belum disimpan ke server.')
    } else {
      setProducts((current) => [savedProduct, ...current])
      setPage(1)
      setNotice('Produk ditambahkan pada tampilan ini. Belum disimpan ke server.')
    }

    setSelectedCategory('all')
    setQuery('')
    setDraft(null)
  }

  function confirmDelete() {
    setProducts((current) =>
      current.filter((product) => product.id !== deleteTarget.id),
    )
    setDeleteTarget(null)
    setPage(1)
    setNotice('Produk dihapus dari tampilan ini. Belum dihapus dari server.')
  }

  const columns = [
    {
      key: 'product',
      label: 'Produk & SKU',
      render: (product) => (
        <div className="products__identity">
          <span
            className={`products__image products__image--${product.tone}`}
            aria-hidden="true"
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="" />
            ) : (
              <Package aria-hidden="true" size={18} />
            )}
          </span>
          <span className="products__identity-copy">
            <strong>{product.name}</strong>
            <small>{product.sku || 'SKU belum diatur'}</small>
          </span>
        </div>
      ),
    },
    { key: 'category', label: 'Kategori' },
    {
      key: 'price',
      label: 'Harga Normal',
      render: (product) => formatRupiah(product.price),
    },
    {
      key: 'discountPrice',
      label: 'Harga Diskon',
      render: (product) => (
        <strong className="products__discount">
          {formatRupiah(product.discountPrice)}
        </strong>
      ),
    },
    {
      key: 'stock',
      label: 'Stok Gudang',
      render: (product) => {
        const status = getStockStatus(product)
        return (
          <span className={`products__stock products__stock--${status.tone}`}>
            {product.stock} {product.unit}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (product) => {
        const status = getStockStatus(product)
        return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (product) => (
        <div className="products__actions">
          <button
            aria-label={`Edit ${product.name}`}
            className="products__action"
            onClick={() => openEditForm(product)}
            title="Edit produk"
            type="button"
          >
            <Pencil aria-hidden="true" size={14} />
          </button>
          <button
            aria-label={`Hapus ${product.name}`}
            className="products__action products__action--delete"
            onClick={() => setDeleteTarget(product)}
            title="Hapus produk"
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="products">
      <PageHeader
        title="Katalog & Manajemen Stok Produk"
        description="Kelola data produk, harga, dan ketersediaan stok."
      />

      <div className="products__toolbar">
        <label className="products__search">
          <Search aria-hidden="true" size={16} />
          <input
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Cari nama sembako, SKU, atau kategori..."
            type="search"
            value={query}
          />
        </label>
        <button
          className="products__add"
          onClick={openAddForm}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      <div className="products__categories" aria-label="Filter kategori produk">
        {categories.map((category) => (
          <button
            aria-pressed={selectedCategory === category.value}
            className={`products__category${
              selectedCategory === category.value
                ? ' products__category--active'
                : ''
            }`}
            key={category.value}
            onClick={() => {
              setSelectedCategory(category.value)
              setPage(1)
            }}
            type="button"
          >
            {category.label} ({category.count})
          </button>
        ))}
      </div>

      {notice && (
        <p className="products__notice" role="status">
          {notice}
        </p>
      )}

      <section className="products__table-card">
        {visibleProducts.length ? (
          <div className="products__table">
            <DataTable
              columns={columns}
              label="Katalog dan stok produk"
              rows={visibleProducts}
            />
          </div>
        ) : (
          <p className="products__empty">
            {products.length
              ? 'Produk tidak ditemukan. Coba kata kunci atau kategori lain.'
              : 'Belum ada data produk dari backend.'}
          </p>
        )}

        <footer className="products__pagination">
          <span>
            Menampilkan {firstProduct} - {lastProduct} dari {displayTotal}{' '}
            Produk Sembako
          </span>
          <nav aria-label="Halaman produk">
            <button
              aria-label="Halaman sebelumnya"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={15} />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  aria-current={pageNumber === page ? 'page' : undefined}
                  className={pageNumber === page ? 'is-active' : ''}
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              aria-label="Halaman selanjutnya"
              disabled={page === pageCount}
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              type="button"
            >
              <ChevronRight aria-hidden="true" size={15} />
            </button>
          </nav>
        </footer>
      </section>

      {draft && (
        <ProductFormModal
          isEditing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveProduct}
          onUpload={handleImageUpload}
          product={draft}
          categories={categoryNames}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Produk"
          message={`Produk "${deleteTarget.name}" akan dihapus dari daftar tampilan ini.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus produk ini?"
        />
      )}
    </div>
  )
}

export default ProdukList
