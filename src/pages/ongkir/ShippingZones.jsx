import { useMemo, useState } from 'react'
import {
  CircleDollarSign,
  Gift,
  Map,
  MapPinned,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import ShippingZoneFormModal from './ShippingZoneFormModal.jsx'
import './ShippingZones.css'

const initialZones = []

const emptyDraft = {
  zoneLabel: '',
  radiusRange: '',
  normalFee: '',
  subsidy: '',
  subsidyNote: '',
  eta: '',
  active: false,
}

function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

function getRadiusValues(zone) {
  return (zone.radiusRange.match(/\d+(?:[.,]\d+)?/g) || []).map((value) =>
    Number(value.replace(',', '.')),
  )
}

function zoneToDraft(zone) {
  return {
    id: zone.id,
    zoneLabel: [zone.name, zone.area].filter(Boolean).join(' - '),
    radiusRange: zone.radiusRange,
    normalFee: String(zone.normalFee),
    subsidy: String(zone.subsidy),
    subsidyNote: zone.subsidyNote,
    eta: zone.eta,
    active: zone.active,
  }
}

function splitZoneLabel(zoneLabel) {
  const [name, ...areaParts] = zoneLabel.split(/\s+-\s+/)
  return { name: name.trim(), area: areaParts.join(' - ').trim() }
}

function ShippingZones() {
  const [zones, setZones] = useState(initialZones)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const activeZones = zones.filter((zone) => zone.active)
  const maxRadius = useMemo(
    () =>
      activeZones.length
        ? Math.max(...activeZones.flatMap((zone) => getRadiusValues(zone))).toFixed(1)
        : '—',
    [activeZones],
  )
  const nearestZone = useMemo(
    () =>
      [...activeZones].sort(
        (left, right) =>
          (getRadiusValues(left)[0] || 0) - (getRadiusValues(right)[0] || 0),
      )[0],
    [activeZones],
  )

  function openAddForm() {
    setDraft({ ...emptyDraft })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(zone) {
    setDraft(zoneToDraft(zone))
    setEditing(true)
    setNotice('')
  }

  function saveZone(event) {
    event.preventDefault()
    const { name, area } = splitZoneLabel(draft.zoneLabel)
    const updatedZone = {
      ...draft,
      ...splitZoneLabel(draft.zoneLabel),
      normalFee: Number(draft.normalFee),
      subsidy: Number(draft.subsidy),
      subsidyNote:
        Number(draft.subsidy) > 0
          ? draft.subsidyNote || 'Otomatis'
          : '',
      id: draft.id || `zone-${Date.now()}`,
      name,
      area,
    }

    const isDuplicateName = zones.some(
      (zone) =>
        zone.name.toLowerCase() === updatedZone.name.toLowerCase() &&
        zone.id !== updatedZone.id,
    )
    if (isDuplicateName) return false

    if (editing) {
      setZones((current) =>
        current.map((zone) =>
          zone.id === updatedZone.id ? updatedZone : zone,
        ),
      )
      setNotice('Zona ongkir diperbarui pada tampilan ini. Belum disimpan ke server.')
    } else {
      setZones((current) => [...current, updatedZone])
      setNotice('Zona ongkir ditambahkan pada tampilan ini. Belum disimpan ke server.')
    }

    setDraft(null)
    return true
  }

  function confirmDelete() {
    setZones((current) =>
      current.filter((zone) => zone.id !== deleteTarget.id),
    )
    setNotice('Zona ongkir dihapus dari tampilan ini. Belum dihapus dari server.')
    setDeleteTarget(null)
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama Zona / Area',
      render: (zone) => (
        <span className="shipping-zones__name">
          <strong>{zone.name}</strong>
          <small>{zone.area}</small>
        </span>
      ),
    },
    { key: 'radiusRange', label: 'Radius Jarak' },
    {
      key: 'normalFee',
      label: 'Tarif Normal',
      render: (zone) => (
        <strong className="shipping-zones__fee">
          {formatRupiah(zone.normalFee)}
        </strong>
      ),
    },
    {
      key: 'subsidy',
      label: 'Subsidi Toko',
      render: (zone) =>
        zone.subsidy > 0
          ? `${formatRupiah(zone.subsidy)} (${zone.subsidyNote})`
          : 'Tidak Disubsidi',
    },
    { key: 'eta', label: 'Estimasi Sampai' },
    {
      key: 'status',
      label: 'Status',
      render: (zone) => (
        <StatusBadge tone={zone.active ? 'green' : 'neutral'}>
          {zone.active ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (zone) => (
        <div className="shipping-zones__actions">
          <button
            aria-label={`Edit ${zone.name}`}
            className="shipping-zones__action"
            onClick={() => openEditForm(zone)}
            type="button"
          >
            <Pencil aria-hidden="true" size={12} />
            Edit
          </button>
          <button
            aria-label={`Hapus ${zone.name}`}
            className="shipping-zones__action shipping-zones__action--delete"
            onClick={() => setDeleteTarget(zone)}
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
    <div className="shipping-zones">
      <PageHeader
        title="Kelola Ongkos Kirim & Radius Distribusi"
        description="Atur skema tarif pengantaran, batas jarak tempuh kurir, dan subsidi promo gratis ongkir."
      />

      <p className="shipping-zones__sample-notice" role="note">
        Skema ongkir akan ditampilkan setelah tersedia dari backend.
      </p>

      <section className="shipping-zones__stats" aria-label="Ringkasan distribusi">
        <article className="shipping-zones__stat">
          <span className="shipping-zones__stat-icon shipping-zones__stat-icon--green">
            <MapPinned aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Radius Maksimal Pengantaran</p>
            <strong>{maxRadius === '—' ? '—' : `${maxRadius} KM`}</strong>
            <small>Data zona aktif</small>
          </div>
        </article>
        <article className="shipping-zones__stat">
          <span className="shipping-zones__stat-icon shipping-zones__stat-icon--blue">
            <CircleDollarSign aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Tarif Dasar Terdekat</p>
            <strong>{nearestZone ? formatRupiah(nearestZone.normalFee) : '—'}</strong>
            <small>Tarif zona terdekat</small>
          </div>
        </article>
        <article className="shipping-zones__stat">
          <span className="shipping-zones__stat-icon shipping-zones__stat-icon--orange">
            <Gift aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Program Subsidi Toko</p>
            <strong>Belum diatur</strong>
            <small>Skema subsidi belum tersedia</small>
          </div>
        </article>
        <article className="shipping-zones__stat">
          <span className="shipping-zones__stat-icon shipping-zones__stat-icon--purple">
            <Map aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Total Zona Distribusi</p>
            <strong>{activeZones.length ? `${activeZones.length} Zona Aktif` : '—'}</strong>
            <small>Jumlah zona dari backend</small>
          </div>
        </article>
      </section>

      <section className="shipping-zones__table-card">
        <header className="shipping-zones__table-header">
          <div>
            <h2>Daftar Skema &amp; Master Tarif Ongkir Berdasarkan Zona</h2>
            <p>
              Atur tarif pengiriman kurir instan, subsidi ongkir otomatis, dan
              estimasi jangkauan kilometer
            </p>
          </div>
          <button
            className="shipping-zones__add"
            onClick={openAddForm}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            Tambah Zona Ongkir
          </button>
        </header>

        {notice && (
          <p className="shipping-zones__notice" role="status">
            {notice}
          </p>
        )}

        {zones.length ? (
          <DataTable
            columns={columns}
            label="Daftar skema dan tarif ongkos kirim"
            rows={zones}
          />
        ) : (
          <p className="shipping-zones__empty">
            Belum ada zona pengiriman. Tambahkan zona ongkir baru untuk
            menetapkan tarif.
          </p>
        )}

        <footer className="shipping-zones__table-footer">
          Menampilkan {zones.length ? '1' : '0'} - {zones.length} dari {zones.length}{' '}
          zona pengiriman terdaftar
        </footer>
      </section>

      {draft && (
        <ShippingZoneFormModal
          draft={draft}
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveZone}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Zona"
          message={`Zona "${deleteTarget.name}" akan dihapus dari daftar pada tampilan ini.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Zona Ongkir?"
        />
      )}
    </div>
  )
}

export default ShippingZones
