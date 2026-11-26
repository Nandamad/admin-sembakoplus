import { useEffect, useRef, useState } from 'react'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api, { extractApiError } from '../../services/api.js'
import BannerArtwork from './BannerArtwork.jsx'
import BannerForm from './BannerForm.jsx'
import './BannerList.css'

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

function formatScheduleDate(value) {
  if (!value) return 'Tidak dibatasi'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tanggal belum diatur'
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const time = date.toTimeString().slice(0, 5)
  return `${day} ${month} ${year} ${time}`
}

function toInputDateTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapApiBanner(banner) {
  return {
    id: banner.id,
    isNew: false,
    slot: `Urutan #${banner.sort_order ?? 1}`,
    sortOrder: banner.sort_order ?? 1,
    title: banner.title || '',
    startsAt: toInputDateTime(banner.start_at),
    endsAt: toInputDateTime(banner.end_at),
    link: banner.target_path || (banner.target_type === 'product' && banner.target_id ? `/produk/${banner.target_id}` : ''),
    targetType: banner.target_type || 'none',
    targetId: banner.target_id ?? '',
    imageUrl: banner.image_url || '',
    imageFile: null,
    isActive: Boolean(banner.is_active),
  }
}

function BannerList() {
  const [banners, setBanners] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const previewUrls = useRef([])
  const selectedBanner = draft?.isNew
    ? draft
    : banners.find((banner) => banner.id === selectedId)

  async function refreshBanners(selectTargetId = null) {
    const { data } = await api.get('/admin/banners')
    const mapped = (data?.data ?? []).map(mapApiBanner)
    setBanners(mapped)
    const nextSelected =
      mapped.find((item) => item.id === selectTargetId) ?? mapped[0] ?? null
    setSelectedId(nextSelected?.id ?? null)
    setDraft(nextSelected ? { ...nextSelected } : null)
  }

  useEffect(() => {
    let active = true
    const urls = previewUrls.current
    api.get('/admin/banners')
      .then(({ data }) => {
        if (!active) return
        const mapped = (data?.data ?? []).map(mapApiBanner)
        setBanners(mapped)
        if (mapped.length) {
          setSelectedId(mapped[0].id)
          setDraft({ ...mapped[0] })
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(extractApiError(error, 'Daftar banner gagal dimuat.'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  function selectBanner(banner) {
    setSelectedId(banner.id)
    setDraft({ ...banner })
    setMessage('')
  }

  function addBanner() {
    const nextOrder = Math.max(0, ...banners.map((b) => Number(b.sortOrder) || 0)) + 1
    const newBanner = {
      id: `new-${Date.now()}`,
      isNew: true,
      slot: `Urutan #${nextOrder}`,
      sortOrder: nextOrder,
      title: '',
      startsAt: '',
      endsAt: '',
      link: '/promo',
      targetType: 'internal_path',
      targetId: '',
      imageUrl: '',
      imageFile: null,
      isActive: true,
    }
    setSelectedId(newBanner.id)
    setDraft(newBanner)
    setMessage('')
  }

  async function deleteBanner(banner) {
    if (banner.isNew) {
      setSelectedId(banners[0]?.id ?? null)
      setDraft(banners[0] ? { ...banners[0] } : null)
      return
    }
    const confirmed = window.confirm(`Hapus banner "${banner.title}"?`)
    if (!confirmed) return

    try {
      setMessage('')
      await api.delete(`/admin/banners/${banner.id}`)
      await refreshBanners()
      setMessage('Banner berhasil dihapus.')
    } catch (error) {
      setMessage(extractApiError(error, 'Gagal menghapus banner.'))
    }
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    previewUrls.current.push(imageUrl)
    setDraft((current) => ({ ...current, imageUrl, imageFile: file }))
    setMessage('')
  }

  async function saveBanner(event) {
    event.preventDefault()
    if (!draft) return

    if (draft.isNew && !draft.imageFile) {
      setMessage('Unggah file gambar banner (PNG/JPG/WEBP) terlebih dahulu.')
      return
    }

    try {
      setSaving(true)
      setMessage('')
      const formData = new FormData()
      formData.append('title', draft.title.trim())
      formData.append('sort_order', String(Number(draft.sortOrder) || 0))
      formData.append('is_active', draft.isActive ? '1' : '0')

      const trimmedLink = (draft.link || '').trim()
      if (trimmedLink.startsWith('/')) {
        formData.append('target_type', 'internal_path')
        formData.append('target_path', trimmedLink)
      } else {
        formData.append('target_type', 'none')
      }

      if (draft.startsAt) formData.append('start_at', draft.startsAt)
      if (draft.endsAt) formData.append('end_at', draft.endsAt)
      if (draft.imageFile) formData.append('image', draft.imageFile)

      let savedId = draft.id
      if (draft.isNew) {
        const { data } = await api.post('/admin/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        savedId = data?.data?.id
      } else {
        formData.append('_method', 'PATCH')
        const { data } = await api.post(`/admin/banners/${draft.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        savedId = data?.data?.id ?? draft.id
      }

      await refreshBanners(savedId)
      setMessage('Perubahan banner berhasil disimpan ke server.')
    } catch (error) {
      setMessage(extractApiError(error, 'Gagal menyimpan banner.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="banner-page">
      <PageHeader
        title="Kelola Hero Banner Beranda Mobile"
        description="Atur urutan slider hero banner promo yang tampil langsung di aplikasi SembakoPlus"
      />

      <div className="banner-page__layout">
        <section className="banner-list" aria-labelledby="banner-list-title">
          <header className="banner-list__header">
            <div>
              <h2 id="banner-list-title">Daftar Banner Beranda Mobile</h2>
              <p>Kelola urutan tayang banner pada beranda aplikasi pengguna</p>
            </div>
            <button
              className="banner-list__add"
              onClick={addBanner}
              type="button"
            >
              <Plus aria-hidden="true" size={15} />
              <span>Tambah</span>
            </button>
          </header>

          <div className="banner-list__items">
            {loading ? (
              <p className="banner-list__empty">Memuat banner dari server...</p>
            ) : banners.length ? (
              banners.map((banner) => {
                const isSelected = selectedId === banner.id
                const statusLabel = banner.isActive ? 'Aktif' : 'Nonaktif'

                return (
                  <article
                    className={`banner-item${isSelected ? ' banner-item--selected' : ''}`}
                    key={banner.id}
                  >
                    <GripVertical
                      aria-hidden="true"
                      className="banner-item__grip"
                      size={17}
                    />
                    <button
                      aria-label={`Edit ${banner.title || 'banner'}`}
                      className="banner-item__select"
                      onClick={() => selectBanner(banner)}
                      type="button"
                    >
                      {banner.imageUrl ? (
                        <img
                          alt=""
                          className="banner-item__image"
                          src={banner.imageUrl}
                        />
                      ) : (
                        <BannerArtwork className="banner-item__image" />
                      )}
                      <span className="banner-item__copy">
                        <span className="banner-item__meta">
                          <strong>{banner.slot}</strong>
                          <StatusBadge tone={banner.isActive ? 'green' : 'orange'}>
                            {statusLabel}
                          </StatusBadge>
                        </span>
                        <strong className="banner-item__title">
                          {banner.title || 'Banner baru'}
                        </strong>
                        <span className="banner-item__detail">
                          {formatScheduleDate(banner.startsAt)} –{' '}
                          {formatScheduleDate(banner.endsAt)} WIB
                        </span>
                      </span>
                    </button>
                    <div className="banner-item__actions">
                      <button
                        aria-label={`Edit ${banner.title || 'banner'}`}
                        className="banner-item__action"
                        onClick={() => selectBanner(banner)}
                        title="Edit banner"
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={14} />
                      </button>
                      <button
                        aria-label={`Hapus ${banner.title || 'banner'}`}
                        className="banner-item__action banner-item__action--delete"
                        onClick={() => deleteBanner(banner)}
                        title="Hapus banner"
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={14} />
                      </button>
                    </div>
                  </article>
                )
              })
            ) : (
              <p className="banner-list__empty">
                Belum ada banner. Klik Tambah untuk membuat banner baru.
              </p>
            )}
          </div>
        </section>

        {draft && selectedBanner && (
          <BannerForm
            banner={draft}
            message={message}
            onDraftChange={setDraft}
            onSave={saveBanner}
            onUpload={handleUpload}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

export default BannerList
