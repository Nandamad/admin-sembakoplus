import { useEffect, useMemo, useState } from 'react'
import {
  Bike,
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Timer,
  Trash2,
  UserPlus,
} from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api, { extractApiError } from '../../services/api.js'
import CourierSlotFormModal from './CourierSlotFormModal.jsx'
import './CourierSchedule.css'

function tomorrowDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

function CourierSchedule() {
  const [slots, setSlots] = useState([])
  const [couriers, setCouriers] = useState([])
  const [cutoffTime, setCutoffTime] = useState('11:00')
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [courierName, setCourierName] = useState('')
  const [courierPhone, setCourierPhone] = useState('')
  const [courierEmail, setCourierEmail] = useState('')
  const [courierPassword, setCourierPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function reloadData() {
    const [schedRes, courierRes, settingsRes] = await Promise.all([
      api.get('/admin/delivery-schedules'),
      api.get('/admin/couriers'),
      api.get('/admin/settings'),
    ])
    setSlots(schedRes.data?.data ?? [])
    setCouriers(courierRes.data?.data ?? [])
    if (settingsRes.data?.data?.['cutoff.time']) {
      setCutoffTime(String(settingsRes.data.data['cutoff.time']))
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/delivery-schedules'),
      api.get('/admin/couriers'),
      api.get('/admin/settings'),
    ])
      .then(([schedRes, courierRes, settingsRes]) => {
        if (!active) return
        setSlots(schedRes.data?.data ?? [])
        setCouriers(courierRes.data?.data ?? [])
        if (settingsRes.data?.data?.['cutoff.time']) {
          setCutoffTime(String(settingsRes.data.data['cutoff.time']))
        }
      })
      .catch((error) => {
        if (active) setNotice(extractApiError(error, 'Jadwal pengiriman gagal dimuat.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const activeSlots = slots.filter((slot) => slot.is_active)
  const slotCapacity = useMemo(
    () => activeSlots.reduce((total, slot) => total + Number(slot.quota || 0), 0),
    [activeSlots],
  )
  const bookedSlots = useMemo(
    () => activeSlots.reduce((total, slot) => total + Number(slot.reserved_count || 0), 0),
    [activeSlots],
  )
  const occupancy =
    slotCapacity > 0 ? Math.round((bookedSlots / slotCapacity) * 100) : 0
  const activeCouriers = couriers.filter((courier) => courier.is_active)

  function openAddForm() {
    setDraft({
      delivery_date: tomorrowDate(),
      start_time: '08:00',
      end_time: '10:00',
      quota: 25,
      reserved_count: 0,
      is_active: true,
      notes: '',
    })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(slot) {
    setDraft({
      id: slot.id,
      delivery_date: slot.delivery_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      quota: slot.quota,
      reserved_count: slot.reserved_count ?? 0,
      is_active: Boolean(slot.is_active),
      notes: slot.notes || '',
    })
    setEditing(true)
    setNotice('')
  }

  async function saveSlot(event) {
    event.preventDefault()
    if (!draft) return false

    const payload = {
      delivery_date: draft.delivery_date,
      start_time: draft.start_time,
      end_time: draft.end_time,
      quota: Number(draft.quota),
      is_active: Boolean(draft.is_active),
      notes: (draft.notes || '').trim() || null,
    }

    try {
      setSaving(true)
      setNotice('')
      if (editing) {
        await api.patch(`/admin/delivery-schedules/${draft.id}`, payload)
        setNotice(`Slot ${payload.delivery_date} (${payload.start_time}–${payload.end_time}) diperbarui.`)
      } else {
        await api.post('/admin/delivery-schedules', payload)
        setNotice(`Slot ${payload.delivery_date} (${payload.start_time}–${payload.end_time}) dibuat.`)
      }
      await reloadData()
      setDraft(null)
      return true
    } catch (error) {
      const msg = extractApiError(error, 'Jadwal pengiriman gagal disimpan.')
      setNotice(msg)
      return msg
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      setNotice('')
      await api.delete(`/admin/delivery-schedules/${deleteTarget.id}`)
      setDeleteTarget(null)
      await reloadData()
      setNotice('Slot jadwal berhasil dihapus/dinonaktifkan.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menghapus slot jadwal.'))
      setDeleteTarget(null)
    }
  }

  async function createCourier(event) {
    event.preventDefault()
    if (!courierName.trim() || !courierPhone.trim() || !courierPassword) return
    try {
      setNotice('')
      await api.post('/admin/users', {
        name: courierName.trim(),
        phone: courierPhone.trim(),
        email: courierEmail.trim() || null,
        password: courierPassword,
        is_active: true,
      })
      setCourierName('')
      setCourierPhone('')
      setCourierEmail('')
      setCourierPassword('')
      await reloadData()
      setNotice('Akun kurir baru berhasil dibuat.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal membuat akun kurir baru.'))
    }
  }

  async function toggleCourierStatus(courier) {
    try {
      setNotice('')
      await api.patch(`/admin/users/${courier.id}`, {
        is_active: !courier.is_active,
      })
      await reloadData()
      setNotice(`Status kurir ${courier.name} diperbarui.`)
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal mengubah status kurir.'))
    }
  }

  const columns = [
    {
      key: 'delivery_date',
      label: 'Tanggal Pengiriman',
      render: (slot) => (
        <span className="courier-schedule__name">
          <strong>{slot.delivery_date}</strong>
          <small>{slot.notes || 'Jadwal operasional toko'}</small>
        </span>
      ),
    },
    {
      key: 'timeRange',
      label: 'Rentang Jam Antar',
      render: (slot) => (
        <strong className="courier-schedule__time">
          {slot.start_time} – {slot.end_time} WIB
        </strong>
      ),
    },
    {
      key: 'cutoff',
      label: 'Aturan Cut-Off Harian',
      render: () => `${cutoffTime} WIB`,
    },
    {
      key: 'capacity',
      label: 'Kuota Terpakai',
      render: (slot) => `${slot.reserved_count ?? 0} / ${slot.quota} Slot`,
    },
    {
      key: 'available',
      label: 'Sisa Kuota',
      render: (slot) => `${slot.available_quota ?? Math.max(0, slot.quota - (slot.reserved_count ?? 0))} Slot`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (slot) => (
        <StatusBadge tone={slot.is_active ? 'green' : 'neutral'}>
          {slot.is_active ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (slot) => (
        <div className="courier-schedule__actions">
          <button
            aria-label={`Edit ${slot.delivery_date}`}
            className="courier-schedule__action"
            onClick={() => openEditForm(slot)}
            type="button"
          >
            <Pencil aria-hidden="true" size={12} />
            Edit
          </button>
          <button
            aria-label={`Hapus ${slot.delivery_date}`}
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
        title="Kelola Jadwal Pengiriman & Armada Kurir"
        description="Atur jadwal pengantaran bertanggal, batas kuota slot, serta manajemen akun kurir."
      />

      <section
        aria-label="Ringkasan operasional kurir"
        className="courier-schedule__stats"
      >
        <article className="courier-schedule__stat">
          <span className="courier-schedule__stat-icon courier-schedule__stat-icon--green">
            <Clock3 aria-hidden="true" size={15} />
          </span>
          <div>
            <p>Batas Order Cut-Off</p>
            <strong>{cutoffTime} WIB</strong>
            <small>Pengiriman terjadwal per tanggal</small>
          </div>
        </article>
        <article className="courier-schedule__stat">
          <span className="courier-schedule__stat-icon courier-schedule__stat-icon--blue">
            <CalendarDays aria-hidden="true" size={15} />
          </span>
          <div>
            <p>Total Slot Aktif</p>
            <strong>{activeSlots.length} Jadwal</strong>
            <small>Dari total {slots.length} jadwal tersimpan</small>
          </div>
        </article>
        <article className="courier-schedule__stat">
          <span className="courier-schedule__stat-icon courier-schedule__stat-icon--orange">
            <Bike aria-hidden="true" size={15} />
          </span>
          <div>
            <p>Armada Kurir Aktif</p>
            <strong>{activeCouriers.length} Kurir</strong>
            <small>Dari {couriers.length} akun kurir</small>
          </div>
        </article>
        <article className="courier-schedule__stat">
          <span className="courier-schedule__stat-icon courier-schedule__stat-icon--purple">
            <Timer aria-hidden="true" size={15} />
          </span>
          <div>
            <p>Kapasitas Terpesan</p>
            <strong>{bookedSlots} / {slotCapacity} Slot</strong>
            <small>Keterisian {occupancy}%</small>
          </div>
        </article>
      </section>

      <section className="courier-schedule__table-card">
        <header className="courier-schedule__table-header">
          <div>
            <h2>Daftar Jadwal Pengiriman Bertanggal</h2>
            <p>
              Jadwal baru harus bertanggal setelah hari ini (aturan H+1 MD v2.4).
            </p>
          </div>
          <button
            className="courier-schedule__add"
            onClick={openAddForm}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            Tambah Slot Jadwal
          </button>
        </header>

        {notice && (
          <p className="courier-schedule__notice" role="status">
            {notice}
          </p>
        )}

        {loading ? (
          <p className="courier-schedule__empty">Memuat jadwal pengiriman...</p>
        ) : slots.length ? (
          <DataTable
            columns={columns}
            label="Daftar slot pengiriman bertanggal"
            rows={slots}
          />
        ) : (
          <p className="courier-schedule__empty">Belum ada jadwal pengiriman.</p>
        )}
      </section>

      <section className="courier-schedule__table-card" style={{ marginTop: 16 }}>
        <header className="courier-schedule__table-header">
          <div>
            <h2>Manajemen Akun Kurir ({couriers.length})</h2>
            <p>Tambah kurir baru atau aktif/nonaktifkan akun driver untuk tugas pengantaran.</p>
          </div>
        </header>

        <form
          onSubmit={createCourier}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px 12px' }}
        >
          <input
            onChange={(event) => setCourierName(event.target.value)}
            placeholder="Nama lengkap kurir"
            required
            style={{ flex: '1 1 160px', padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
            value={courierName}
          />
          <input
            onChange={(event) => setCourierPhone(event.target.value)}
            placeholder="No. HP (+628...)"
            required
            style={{ width: 150, padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
            value={courierPhone}
          />
          <input
            onChange={(event) => setCourierEmail(event.target.value)}
            placeholder="Email (opsional)"
            style={{ width: 160, padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
            type="email"
            value={courierEmail}
          />
          <input
            minLength={8}
            onChange={(event) => setCourierPassword(event.target.value)}
            placeholder="Password (min. 8)"
            required
            style={{ width: 140, padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
            type="password"
            value={courierPassword}
          />
          <button className="courier-schedule__add" type="submit">
            <UserPlus size={14} /> Tambah Kurir
          </button>
        </form>

        <div style={{ padding: '0 16px 16px', display: 'grid', gap: 8 }}>
          {couriers.map((courier) => (
            <div
              key={courier.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 12px',
                border: '1px solid #e4eadc',
                borderRadius: 8,
                fontSize: 11,
              }}
            >
              <div>
                <strong>{courier.name}</strong>
                <div style={{ color: '#6b7765', marginTop: 2 }}>
                  {courier.phone} • {courier.email || 'Tanpa email'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge tone={courier.is_active ? 'green' : 'neutral'}>
                  {courier.is_active ? 'Aktif' : 'Nonaktif'}
                </StatusBadge>
                <button
                  className="courier-schedule__action"
                  onClick={() => toggleCourierStatus(courier)}
                  type="button"
                >
                  {courier.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {draft && (
        <CourierSlotFormModal
          draft={draft}
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveSlot}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Slot"
          message={`Slot ${deleteTarget.delivery_date} (${deleteTarget.start_time}-${deleteTarget.end_time}) akan dihapus atau dinonaktifkan jika sudah memiliki pesanan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Slot Jadwal?"
        />
      )}
    </div>
  )
}

export default CourierSchedule
