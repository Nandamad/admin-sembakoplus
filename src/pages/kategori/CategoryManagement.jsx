import { useMemo, useState } from 'react'
import { LayoutGrid, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import CategoryFormModal from './CategoryFormModal.jsx'
import './CategoryManagement.css'

const initialCategories = []

const emptyDraft = {
  name: '',
  slug: '',
  priority: '',
  description: '',
  active: false,
}

function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function CategoryManagement() {
  const [categories, setCategories] = useState(initialCategories)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.priority - right.priority),
    [categories],
  )
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return sortedCategories
    return sortedCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query),
    )
  }, [search, sortedCategories])
  const totalSkus = categories.reduce(
    (total, category) => total + category.skuCount,
    0,
  )
  const bestSeller = categories.reduce(
    (best, category) => (category.revenue > best.revenue ? category : best),
    { name: '—', revenue: 0 },
  )

  function openAddForm() {
    const nextPriority =
      Math.max(0, ...categories.map((category) => category.priority)) + 1
    setDraft({ ...emptyDraft, priority: String(nextPriority) })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(category) {
    setDraft({
      name: category.name,
      slug: category.slug,
      priority: String(category.priority),
      description: category.description,
      active: category.active,
      id: category.id,
    })
    setEditing(true)
    setNotice('')
  }

  function saveCategory(event) {
    event.preventDefault()
    const savedCategory = {
      ...draft,
      id: draft.id || `category-${Date.now()}`,
      name: draft.name.trim(),
      slug: createSlug(draft.name),
      priority: Number(draft.priority),
      description: draft.description.trim(),
      skuCount: draft.skuCount || 0,
      revenue: draft.revenue || 0,
    }
    const duplicateCategory = categories.some(
      (category) =>
        category.id !== savedCategory.id &&
        (category.name.toLowerCase() === savedCategory.name.toLowerCase() ||
          category.slug === savedCategory.slug),
    )
    if (duplicateCategory) return false

    if (editing) {
      setCategories((current) =>
        current.map((category) =>
          category.id === savedCategory.id ? savedCategory : category,
        ),
      )
      setNotice('Kategori diperbarui pada tampilan ini. Belum disimpan ke server.')
    } else {
      setCategories((current) => [...current, savedCategory])
      setNotice('Kategori ditambahkan pada tampilan ini. Belum disimpan ke server.')
    }

    setDraft(null)
    return true
  }

  function confirmDelete() {
    setCategories((current) =>
      current.filter((category) => category.id !== deleteTarget.id),
    )
    setNotice('Kategori dihapus dari tampilan ini. Belum dihapus dari server.')
    setDeleteTarget(null)
  }

  const columns = [
    {
      key: 'priority',
      label: 'Urutan',
      render: (category) => (
        <strong className="categories__priority">#{category.priority}</strong>
      ),
    },
    {
      key: 'name',
      label: 'Ikon & Nama Kategori',
      render: (category) => (
        <span className="categories__name">
          <span aria-hidden="true" className="categories__emoji">
            <LayoutGrid size={12} />
          </span>
          <strong>{category.name}</strong>
        </span>
      ),
    },
    {
      key: 'slug',
      label: 'Slug Sistem',
      render: (category) => (
        <code className="categories__slug">{category.slug}</code>
      ),
    },
    {
      key: 'skuCount',
      label: 'Jumlah SKU',
      render: (category) => `${category.skuCount} Produk`,
    },
    {
      key: 'revenue',
      label: 'Kontribusi Omset',
      render: (category) => (
        <strong className="categories__revenue">
          {formatRupiah(category.revenue)}
        </strong>
      ),
    },
    {
      key: 'active',
      label: 'Status Tayang',
      render: (category) => (
        <StatusBadge tone={category.active ? 'green' : 'neutral'}>
          {category.active ? 'Aktif Beranda' : 'Belum Aktif'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (category) => (
        <div className="categories__actions">
          <button
            aria-label={`Edit ${category.name}`}
            className="categories__action"
            onClick={() => openEditForm(category)}
            type="button"
          >
            <Pencil aria-hidden="true" size={12} />
            Edit
          </button>
          <button
            aria-label={`Hapus ${category.name}`}
            className="categories__action categories__action--delete"
            onClick={() => setDeleteTarget(category)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={12} />
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="categories">
      <header className="categories__header">
        <div>
          <h1>Kelola Kategori Produk Sembako</h1>
          <p>
            Atur klasifikasi produk, ikon kategori, dan urutan tampil di aplikasi
            mobile.
          </p>
        </div>
        <div className="categories__header-actions">
          <label className="categories__search">
            <Search aria-hidden="true" size={13} />
            <input
              aria-label="Cari nama atau slug kategori"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama kategori..."
              value={search}
            />
          </label>
          <button
            className="categories__add"
            onClick={openAddForm}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            Tambah Kategori
          </button>
        </div>
      </header>

      <p className="categories__sample-notice" role="note">
        Data kategori akan dimuat setelah backend terhubung.
      </p>

      <section className="categories__stats" aria-label="Ringkasan kategori">
        <article className="categories__stat">
          <span className="categories__stat-mark">01</span>
          <div>
            <p>Total Kategori Aktif</p>
            <strong>
              {categories.length
                ? `${categories.filter((category) => category.active).length} Kategori`
                : '—'}
            </strong>
            <small>Data kategori dari backend</small>
          </div>
        </article>
        <article className="categories__stat">
          <span className="categories__stat-mark categories__stat-mark--blue">
            02
          </span>
          <div>
            <p>Total SKU Terklasifikasi</p>
            <strong>{categories.length ? `${totalSkus} Produk` : '—'}</strong>
            <small>Data produk dari backend</small>
          </div>
        </article>
        <article className="categories__stat">
          <span className="categories__stat-mark categories__stat-mark--orange">
            03
          </span>
          <div>
            <p>Kategori Terlaris</p>
            <strong>{bestSeller.name === '—' ? '—' : bestSeller.name.replace(' Pokok', '')}</strong>
            <small>Kontribusi omzet tertinggi</small>
          </div>
        </article>
        <article className="categories__stat">
          <span className="categories__stat-mark categories__stat-mark--purple">
            04
          </span>
          <div>
            <p>Prioritas Kategori</p>
            <strong>—</strong>
            <small>Menunggu data backend</small>
          </div>
        </article>
      </section>

      <section className="categories__table-card">
        {notice && (
          <p className="categories__notice" role="status">
            {notice}
          </p>
        )}
        {filteredCategories.length ? (
          <DataTable
            columns={columns}
            label="Daftar kategori produk sembako"
            rows={filteredCategories}
          />
        ) : (
          <p className="categories__empty">
            Tidak ada kategori yang cocok dengan pencarian.
          </p>
        )}
        <footer className="categories__table-footer">
          Menampilkan {filteredCategories.length ? '1' : '0'} -{' '}
          {filteredCategories.length} dari {categories.length} kategori
          terdaftar
        </footer>
      </section>

      {draft && (
        <CategoryFormModal
          draft={draft}
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveCategory}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Kategori"
          message={`Kategori "${deleteTarget.name}" akan dihapus dari tampilan ini.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Kategori?"
        />
      )}
    </div>
  )
}

export default CategoryManagement
