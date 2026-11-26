import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api, { extractApiError } from '../../services/api.js'
import CategoryFormModal from './CategoryFormModal.jsx'
import './CategoryManagement.css'

const emptyDraft = {
  name: '',
  slug: '',
  priority: '',
  description: '',
  active: true,
}

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function mapApiCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    priority: Number(category.sort_order ?? 0),
    description: category.description || '',
    active: Boolean(category.is_active),
    skuCount: Number(category.products_count ?? 0),
  }
}

function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function reloadCategories() {
    const { data } = await api.get('/admin/categories')
    setCategories((data?.data ?? []).map(mapApiCategory))
  }

  useEffect(() => {
    let active = true
    api.get('/admin/categories')
      .then(({ data }) => {
        if (active) setCategories((data?.data ?? []).map(mapApiCategory))
      })
      .catch((error) => {
        if (active) setNotice(extractApiError(error, 'Kategori gagal dimuat.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

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
  const topCategory = categories.reduce(
    (best, category) => (category.skuCount > best.skuCount ? category : best),
    { name: '—', skuCount: -1 },
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
      id: category.id,
      name: category.name,
      slug: category.slug,
      priority: String(category.priority),
      description: category.description || '',
      active: category.active,
    })
    setEditing(true)
    setNotice('')
  }

  async function saveCategory(event) {
    event.preventDefault()
    if (!draft) return false

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      sort_order: Number(draft.priority) || 0,
      is_active: Boolean(draft.active),
    }

    try {
      setSaving(true)
      setNotice('')
      if (editing) {
        await api.patch(`/admin/categories/${draft.id}`, payload)
        setNotice(`Kategori "${payload.name}" berhasil diperbarui.`)
      } else {
        await api.post('/admin/categories', payload)
        setNotice(`Kategori "${payload.name}" berhasil dibuat.`)
      }
      await reloadCategories()
      setDraft(null)
      return true
    } catch (error) {
      setNotice(extractApiError(error, 'Kategori gagal disimpan.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      setNotice('')
      await api.delete(`/admin/categories/${deleteTarget.id}`)
      setNotice(`Kategori "${deleteTarget.name}" berhasil dihapus.`)
      setDeleteTarget(null)
      await reloadCategories()
    } catch (error) {
      setNotice(extractApiError(error, 'Kategori gagal dihapus.'))
      setDeleteTarget(null)
    }
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
        <code className="categories__slug">{category.slug || createSlug(category.name)}</code>
      ),
    },
    {
      key: 'skuCount',
      label: 'Jumlah Produk',
      render: (category) => `${category.skuCount} Produk`,
    },
    {
      key: 'description',
      label: 'Deskripsi',
      render: (category) => (
        <span className="categories__desc">{category.description || '—'}</span>
      ),
    },
    {
      key: 'active',
      label: 'Status Tayang',
      render: (category) => (
        <StatusBadge tone={category.active ? 'green' : 'neutral'}>
          {category.active ? 'Aktif Beranda' : 'Nonaktif'}
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
            Atur klasifikasi produk, deskripsi, dan urutan tampil di aplikasi mobile.
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

      <section className="categories__stats" aria-label="Ringkasan kategori">
        <article className="categories__stat">
          <span className="categories__stat-mark">01</span>
          <div>
            <p>Total Kategori Aktif</p>
            <strong>
              {categories.length
                ? `${categories.filter((category) => category.active).length} Kategori`
                : '0'}
            </strong>
            <small>Dari total {categories.length} kategori</small>
          </div>
        </article>
        <article className="categories__stat">
          <span className="categories__stat-mark categories__stat-mark--blue">
            02
          </span>
          <div>
            <p>Total Produk Terklasifikasi</p>
            <strong>{totalSkus} Produk</strong>
            <small>Akumulasi seluruh kategori</small>
          </div>
        </article>
        <article className="categories__stat">
          <span className="categories__stat-mark categories__stat-mark--orange">
            03
          </span>
          <div>
            <p>Kategori Terbanyak</p>
            <strong>{topCategory.skuCount >= 0 ? topCategory.name : '—'}</strong>
            <small>
              {topCategory.skuCount >= 0
                ? `${topCategory.skuCount} produk`
                : 'Belum ada data'}
            </small>
          </div>
        </article>
        <article className="categories__stat">
          <span className="categories__stat-mark categories__stat-mark--purple">
            04
          </span>
          <div>
            <p>Urutan Terdepan</p>
            <strong>{sortedCategories[0]?.name || '—'}</strong>
            <small>
              {sortedCategories[0]
                ? `Urutan #${sortedCategories[0].priority}`
                : 'Belum tersedia'}
            </small>
          </div>
        </article>
      </section>

      <section className="categories__table-card">
        {notice && (
          <p className="categories__notice" role="status">
            {notice}
          </p>
        )}
        {loading ? (
          <p className="categories__empty">Memuat kategori dari server...</p>
        ) : filteredCategories.length ? (
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
          saving={saving}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Kategori"
          message={`Kategori "${deleteTarget.name}" akan dihapus permanen dari database.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Kategori?"
        />
      )}
    </div>
  )
}

export default CategoryManagement
