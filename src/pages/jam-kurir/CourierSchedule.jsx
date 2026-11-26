import { useMemo, useState } from 'react'
import {
  Bike,
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import CourierSlotFormModal from './CourierSlotFormModal.jsx'
import './CourierSchedule.css'

const initialSlots = []

const emptyDraft = {
  name: '',
  detail: '',
  timeRange: '',
  cutoff: '',
  capacity: '',
  booked: 0,
  couriers: '',
  active: false,
}

function CourierSchedule() {
  const [slots, setSlots] = useState(initialSlots)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const activeSlots = slots.filter((slot) => slot.active)
  const slotCapacity = useMemo(
    () => activeSlots.reduce((total, slot) => total + slot.capacity, 0),
    [activeSlots],
  )
  const bookedSlots = useMemo(
    () => activeSlots.reduce((total, slot) => total + slot.booked, 0),
    [activeSlots],
  )
  const occupancy =
    slotCapacity > 0 ? Math.round((bookedSlots / slotCapacity) * 100) : 0
  const courierCount = activeSlots.reduce(
    (total, slot) => total + Number(slot.couriers || 0),
    0,
  )

  function openAddForm() {
    setDraft({ ...emptyDraft })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(slot) {
    setDraft({ ...slot })
    setEditing(true)
    setNotice('')
  }

  function saveSlot(event) {
    event.preventDefault()
    const savedSlot = {
      ...draft,
      id: draft.id || `slot-${Date.now()}`,
      name: draft.name.trim(),
      capacity: Number(draft.capacity),
      booked: Number(draft.booked) || 0,
      couriers: Number(draft.couriers),
    }
    const duplicateName = slots.some(
      (slot) =>
        slot.name.toLowerCase() === savedSlot.name.toLowerCase() &&
        slot.id !== savedSlot.id,
    )
    if (duplicateName) return false

    if (editing) {
      setSlots((current) =>
        current.map((slot) =>
          slot.id === savedSlot.id ? savedSlot : slot,
        ),
      )
      setNotice('Slot kurir diperbarui pada tampilan ini. Belum disimpan ke server.')
    } else {
      setSlots((current) => [...current, savedSlot])
      setNotice('Slot kurir ditambahkan pada tampilan ini. Belum disimpan ke server.')
    }

    setDraft(null)
    return true
  }

  function confirmDelete() {
    setSlots((current) =>
      current.filter((slot) => slot.id !== deleteTarget.id),
    )
    setNotice('Slot kurir dihapus dari tampilan ini. Belum dihapus dari server.')
    setDeleteTarget(null)
  }

  const columns = [
    {
      key: 'name',
      label: 'Sesi Pengiriman',
      render: (slot) => (
        <span className="courier-schedule__name">
          <strong>{slot.name}</strong>
          <small>{slot.detail}</small>
        </span>
      ),
    },
    {
      key: 'timeRange',
      label: 'Rentang Jam Antar',
      render: (slot) => (
        <strong className="courier-schedule__time">{slot.timeRange}</strong>
      ),
    },
    { key: 'cutoff', label: 'Batas Order Cut-Off' },
    {
      key: 'capacity',
      label: 'Kuota Slot',
      render: (slot) => `${slot.booked} / ${slot.capacity} Terisi`,
    },
    {
      key: 'couriers',
      label: 'Kurir Siaga',
      render: (slot) => `${slot.couriers} Kurir`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (slot) => (
        <StatusBadge tone={slot.active ? 'green' : 'neutral'}>
          {slot.active ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (slot) => (
        <div className="courier-schedule__actions">
          <button
            aria-label={`Edit ${slot.name}`}
            className="courier-schedule__action"
            onClick={() => openEditForm(slot)}
            type="button"
          >
            <Pencil aria-hidden="true" size={12} />
            Edit
          </button>
          <button
            aria-label={`Hapus ${slot.name}`}
            className="courier-schedule__action courier-schedule__action--delete"
            onClick={() => setDeleteTarget(slot)}
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
    <div className="courier-schedule">
      <PageHeader
        title="Kelola Jam Operasional & Slot Kurir Toko"
        description="Atur slot waktu pengantaran, kapasitas pesanan, dan armada kurir."
      />

      <p className="courier-schedule__sample-notice" role="note">
        Jadwal dan kapasitas akan ditampilkan setelah tersedia dari backend.
      </p>

      <section
        aria-label="Ringkasan operasional kurir"
        className="courier-schedule__stats"
      >
        <article className="courier-schedule__stat">
          <span className="courier-schedule__stat-icon courier-schedule__stat-icon--green">
            <Clock3 aria-hidden="true" size={15} />
          </span>
          <div>
            <p>Jam Operasional Toko</p>
            <strong>—</strong>
            <small>Jam operasional belum tersedia</small>
          </div>
        </article>
        <article className="courier-schedule__stat">
          <span className="courier-schedule__stat-icon courier-schedule__stat-icon--blue">
            <CalendarDays aria-hidden="true" size={15} />
          </span>
          <div>
            <p>Total Slot Pengiriman</p>
            <strong>{activeSlots.length ? `${activeSlots.length} Sesi / Hari` : '—'}</strong>
            <small>
              {activeSlots.length ? 'Berdasarkan jadwal aktif' : 'Data jadwal belum tersedia'}
            </small>
          </div>
        </article>
        <article className="courier-schedule__stat">
          <span className="courier-schedule__stat-icon courier-schedule__stat-icon--orange">
            <Bike aria-hidden="true" size={15} />
          </span>
          <div>
            <p>Armada Kurir Siaga</p>
            <strong>{activeSlots.length ? `${courierCount} Kurir Siaga` : '—'}</strong>
            <small>
              {activeSlots.length
                ? 'Alokasi pada slot aktif'
                : 'Data kurir belum tersedia'}
            </small>
          </div>
        </article>
        <article className="courier-schedule__stat">
          <span className="courier-schedule__stat-icon courier-schedule__stat-icon--purple">
            <Timer aria-hidden="true" size={15} />
          </span>
          <div>
            <p>Kapasitas Booking Hari Ini</p>
            <strong>
              {activeSlots.length ? `${bookedSlots} / ${slotCapacity} Slot` : '—'}
            </strong>
            <small>
              {activeSlots.length
                ? `Tingkat Keterisian: ${occupancy}%`
                : 'Data kapasitas belum tersedia'}
            </small>
          </div>
        </article>
      </section>

      <section className="courier-schedule__table-card">
        <header className="courier-schedule__table-header">
          <div>
            <h2>Daftar Slot Waktu &amp; Jam Pengiriman Kurir Toko</h2>
            <p>
              Kelola sesi waktu antar instan, kuota pesanan per slot, kurir yang
              bertugas, dan batas order cut-off
            </p>
          </div>
          <button
            className="courier-schedule__add"
            onClick={openAddForm}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            Tambah Slot Jam Kurir
          </button>
        </header>

        {notice && (
          <p className="courier-schedule__notice" role="status">
            {notice}
          </p>
        )}

        {slots.length ? (
          <DataTable
            columns={columns}
            label="Daftar slot pengiriman dan kapasitas kurir"
            rows={slots}
          />
        ) : (
          <p className="courier-schedule__empty">
            Belum ada slot pengiriman. Tambahkan slot jam kurir untuk mengatur
            jadwal antar.
          </p>
        )}

        <footer className="courier-schedule__table-footer">
          Menampilkan {slots.length ? '1' : '0'} - {slots.length} dari {slots.length}{' '}
          slot pengiriman terdaftar
        </footer>
      </section>

      {draft && (
        <CourierSlotFormModal
          draft={draft}
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveSlot}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Slot"
          message={`Slot "${deleteTarget.name}" akan dihapus dari jadwal pada tampilan ini.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Slot Jam Kurir?"
        />
      )}
    </div>
  )
}

export default CourierSchedule
