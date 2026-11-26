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
import api, { extractApiError } from '../../services/api.js'
import ProductFormModal from './ProductFormModal.jsx'
import './ProdukList.css'

const productsPerPage = 8

const emptyProduct = {
  id: null,
  variantId: null,
  name: '',
  sku: '',
  categoryId: '',
  category: '',
  variantName: '',
  quantityValue: 1,
  unit: 'kg',
  price: '',
  discountPrice: '',
  stock: '',
  lowStockAlert: 5,
  description: '',
  isPublished: true,
  imageUrl: '',
  imageFile: null,
  tone: 'green',
}

function formatRupiah(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value))}`
}

function computeDiscountPrice(rawPrice, discount) {
  const price = Number(rawPrice || 0)
  if (!discount) return 0
  if (discount.type === 'percent') {
    return Math.max(0, Math.round(price * (1 - Number(discount.value || 0) / 100)))
  }
  if (discount.type === 'fixed') {
    return Math.max(0, price - Number(discount.value || 0))
  }
  return 0
}

function mapApiProduct(product) {
  const variants = product.variants ?? []
  const defaultVariant =
    variants.find((variant) => variant.is_default) ?? variants[0] ?? {}
  const price = Number(defaultVariant.price ?? 0)
  const discountPrice = computeDiscountPrice(price, defaultVariant.discount)
  const stock = Number(defaultVariant.stock ?? 0)

  return {
    id: product.id,
    variantId: defaultVariant.id ?? null,
    variantCount: variants.length,
    name: product.name,
    sku: defaultVariant.sku || '',
    categoryId: String(product.category_id ?? product.category?.id ?? ''),
    category: product.category?.name || 'Tanpa Kategori',
    variantName: defaultVariant.name || '',
    quantityValue: Number(defaultVariant.quantity_value ?? 1),
    unit: defaultVariant.quantity_unit || 'kg',
    price,
    discountPrice,
    stock,
    lowStockAlert: 5,
    description: product.description || '',
    isPublished: Boolean(product.is_active),
    imageUrl: product.image_url || '',
    imageFile: null,
    tone: stock <= 0 ? 'red' : stock <= 5 ? 'orange' : 'green',
  }
}

function getStockStatus(product) {
  if (!product.isPublished) return { label: 'Nonaktif', tone: 'neutral' }
  if (product.stock <= 0) return { label: 'Habis', tone: 'red' }
  if (product.stock <= product.lowStockAlert) {
    return { label: 'Menipis', tone: 'orange' }
  }
  return { label: 'Tersedia', tone: 'green' }
}

function ProdukList() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const imageUrls = useRef([])

  async function reloadProducts() {
    const [prodRes, catRes] = await Promise.all([
      api.get('/admin/products', { params: { per_page: 50 } }),
      api.get('/admin/categories'),
    ])
    setProducts((prodRes.data?.data ?? []).map(mapApiProduct))
    setCategories(catRes.data?.data ?? [])
  }

  useEffect(() => {
    let active = true
    const urls = imageUrls.current
    Promise.all([
      api.get('/admin/products', { params: { per_page: 50 } }),
      api.get('/admin/categories'),
    ])
      .then(([prodRes, catRes]) => {
        if (!active) return
        setProducts((prodRes.data?.data ?? []).map(mapApiProduct))
        setCategories(catRes.data?.data ?? [])
      })
      .catch((error) => {
        if (active) setNotice(extractApiError(error, 'Produk gagal dimuat dari server.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const categoryFilters = [
    { label: 'Semua Kategori', value: 'all', count: products.length },
    ...categories.map((category) => ({
      label: category.name,
      value: String(category.id),
      count: products.filter((product) => product.categoryId === String(category.id)).length,
    })),
  ]

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory
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
    setDraft({
      ...emptyProduct,
      categoryId: categories[0] ? String(categories[0].id) : '',
    })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(product) {
    setDraft({
      ...product,
      discountPrice: product.discountPrice > 0 ? product.discountPrice : '',
    })
    setEditing(true)
    setNotice('')
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    imageUrls.current.push(imageUrl)
    setDraft((current) => ({ ...current, imageUrl, imageFile: file }))
  }

  async function saveProduct(event) {
    event.preventDefault()
    if (!draft) return

    const unitLabel = draft.unit || 'pcs'
    const qtyValue = Number(draft.quantityValue) > 0 ? Number(draft.quantityValue) : 1
    const variantName = (draft.variantName || `${qtyValue} ${unitLabel}`).trim()
    const rawPrice = Number(draft.price)

    try {
      setSaving(true)
      setNotice('')

      const formData = new FormData()
      formData.append('category_id', String(draft.categoryId))
      formData.append('name', draft.name.trim())
      formData.append('description', (draft.description || '').trim())
      formData.append('is_active', draft.isPublished ? '1' : '0')
      if (draft.imageFile) {
        formData.append('image', draft.imageFile)
      }

      if (editing && draft.variantId) {
        formData.append('variants[0][id]', String(draft.variantId))
      }
      formData.append('variants[0][name]', variantName)
      if ((draft.sku || '').trim()) {
        formData.append('variants[0][sku]', draft.sku.trim())
      }
      formData.append('variants[0][quantity_value]', String(qtyValue))
      formData.append('variants[0][quantity_unit]', unitLabel)
      formData.append('variants[0][price]', String(rawPrice))
      formData.append('variants[0][stock]', String(Number(draft.stock) || 0))
      formData.append('variants[0][is_default]', '1')
      formData.append('variants[0][is_active]', '1')

      let savedProduct
      if (editing) {
        formData.append('_method', 'PATCH')
        const { data } = await api.post(`/admin/products/${draft.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        savedProduct = data?.data
      } else {
        const { data } = await api.post('/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        savedProduct = data?.data
      }

      const targetVariantId =
        savedProduct?.default_variant_id ?? savedProduct?.variants?.[0]?.id
      const targetDiscountPrice = Number(draft.discountPrice || 0)
      if (targetVariantId && targetDiscountPrice > 0 && targetDiscountPrice < rawPrice) {
        const startsAt = new Date(Date.now() - 60000).toISOString()
        const endsAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString()
        await api.post('/admin/discounts', {
          product_variant_id: targetVariantId,
          type: 'fixed',
          value: rawPrice - targetDiscountPrice,
          starts_at: startsAt,
          ends_at: endsAt,
          is_active: true,
        })
      }

      await reloadProducts()
      setNotice(
        editing
          ? `Produk "${draft.name.trim()}" berhasil diperbarui.`
          : `Produk "${draft.name.trim()}" berhasil disimpan ke database.`,
      )
      setDraft(null)
    } catch (error) {
      setNotice(extractApiError(error, 'Produk gagal disimpan ke server.'))
    } finally {
      setSaving(false)
    }
  }

  async function quickRestock(product) {
    if (!product.variantId) return
    const input = window.prompt(
      `Tambah/kurangi stok untuk "${product.name}" (contoh: 10 atau -2):`,
      '10',
    )
    if (input === null) return
    const quantity = Number.parseInt(input, 10)
    if (!Number.isFinite(quantity) || quantity === 0) return

    try {
      setNotice('')
      await api.post(`/admin/product-variants/${product.variantId}/stock`, {
        movement_type: quantity > 0 ? 'restock' : 'adjustment',
        quantity,
        notes: 'Penyesuaian stok cepat dari katalog admin',
      })
      await reloadProducts()
      setNotice(`Stok "${product.name}" berhasil disesuaikan (${quantity > 0 ? `+${quantity}` : quantity}).`)
    } catch (error) {
      setNotice(extractApiError(error, 'Penyesuaian stok gagal.'))
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      setNotice('')
      await api.delete(`/admin/products/${deleteTarget.id}`)
      setDeleteTarget(null)
      setPage(1)
      await reloadProducts()
      setNotice(`Produk "${deleteTarget.name}" berhasil dihapus.`)
    } catch (error) {
      setNotice(extractApiError(error, 'Produk gagal dihapus.'))
      setDeleteTarget(null)
    }
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
            <small>
              {product.sku || 'SKU belum diatur'} • {product.variantName || product.unit}
              {product.variantCount > 1 ? ` (+${product.variantCount - 1} varian)` : ''}
            </small>
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
      label: 'Harga Promo',
      render: (product) => (
        <strong className="products__discount">
          {product.discountPrice > 0 && product.discountPrice < product.price
            ? formatRupiah(product.discountPrice)
            : '—'}
        </strong>
      ),
    },
    {
      key: 'stock',
      label: 'Stok Gudang',
      render: (product) => {
        const status = getStockStatus(product)
        return (
          <button
            className={`products__stock products__stock--${status.tone}`}
            onClick={() => quickRestock(product)}
            style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, textAlign: 'left' }}
            title="Klik untuk penyesuaian stok cepat"
            type="button"
          >
            {product.stock} {product.unit}
          </button>
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
        description="Kelola data produk, harga varian utama, diskon, dan stok gudang (klik jumlah stok untuk mutasi cepat)."
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
        {categoryFilters.map((category) => (
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
        {loading ? (
          <p className="products__empty">Memuat katalog produk...</p>
        ) : visibleProducts.length ? (
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
              : 'Belum ada produk di katalog.'}
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
          categories={categories}
          isEditing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveProduct}
          onUpload={handleImageUpload}
          product={draft}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Produk"
          message={`Produk "${deleteTarget.name}" akan dihapus dari katalog server.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus produk ini?"
        />
      )}
    </div>
  )
}

export default ProdukList
