import { useEffect, useRef, useState } from 'react'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import BannerArtwork from './BannerArtwork.jsx'
import BannerForm from './BannerForm.jsx'
import './BannerList.css'

const initialBanners = []

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

function formatScheduleDate(value) {
  if (!value) return 'Tanggal belum diatur'

  const [year, month, day] = value.slice(0, 10).split('-')
  const time = value.slice(11, 16)
  return `${Number(day)} ${months[Number(month) - 1]} ${year} ${time}`
}

function BannerList() {
  const [banners, setBanners] = useState(initialBanners)
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const previewUrls = useRef([])
  const selectedBanner = banners.find((banner) => banner.id === selectedId)

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  function selectBanner(banner) {
    setSelectedId(banner.id)
    setDraft({ ...banner })
    setMessage('')
  }

  function addBanner() {
    const availableSlot = [1, 2, 3, 4].find(
      (slotNumber) =>
        !banners.some((banner) => banner.slot.startsWith(`Slot ${slotNumber}`)),
    )
    if (!availableSlot) return

    const id = Date.now()
    const newBanner = {
      id,
      slot:
        availableSlot === 1
          ? 'Slot 1 (Hero Utama)'
          : `Slot ${availableSlot}`,
      title: '',
      startsAt: '',
      endsAt: '',
      link: '',
      isActive: false,
    }

    setBanners((current) => [...current, newBanner])
    setSelectedId(id)
    setDraft(newBanner)
    setMessage('')
  }

  function deleteBanner(banner) {
    const confirmed = window.confirm(`Hapus "${banner.title || 'Banner baru'}"?`)
    if (!confirmed) return

    const remaining = banners.filter((item) => item.id !== banner.id)
    setBanners(remaining)

    if (selectedId === banner.id && remaining.length > 0) {
      selectBanner(remaining[0])
    } else if (selectedId === banner.id) {
      setSelectedId(null)
      setDraft(null)
    }
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const imageUrl = URL.createObjectURL(file)
    previewUrls.current.push(imageUrl)
    setDraft((current) => ({ ...current, imageUrl }))
    setMessage('')
  }

  function saveBanner(event) {
    event.preventDefault()
    setBanners((current) =>
      current.map((banner) => (banner.id === draft.id ? { ...draft } : banner)),
    )
    setMessage(
      'Perubahan tampil di halaman ini. Hubungkan API untuk menyimpan permanen.',
    )
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
              <h2 id="banner-list-title">Daftar Banner Beranda Mobile (Maks. 4 Slot)</h2>
              <p>Geser posisi urutan tayang pada slider beranda aplikasi pengguna</p>
            </div>
            {banners.length < 4 && (
              <button
                className="banner-list__add"
                onClick={addBanner}
                type="button"
              >
                <Plus aria-hidden="true" size={15} />
                <span>Tambah</span>
              </button>
            )}
          </header>

          <div className="banner-list__items">
            {banners.length ? banners.map((banner) => {
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
                    aria-label={`Edit ${banner.title || 'banner baru'}`}
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
                      <BannerArtwork
                        className="banner-item__image"
                      />
                    )}
                    <span className="banner-item__copy">
                      <span className="banner-item__meta">
                        <strong>{banner.slot}</strong>
                        <StatusBadge
                          tone={banner.isActive ? 'green' : 'orange'}
                        >
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
                      aria-label={`Edit ${banner.title || 'banner baru'}`}
                      className="banner-item__action"
                      onClick={() => selectBanner(banner)}
                      title="Edit banner"
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={14} />
                    </button>
                    <button
                      aria-label={`Hapus ${banner.title || 'banner baru'}`}
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
            }) : (
              <p className="banner-list__empty">
                Belum ada banner. Tambahkan banner untuk mulai mengelola konten
                beranda.
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
          />
        )}
      </div>
    </div>
  )
}

export default BannerList
