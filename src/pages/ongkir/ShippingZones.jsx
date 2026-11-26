import { useEffect, useMemo, useState } from 'react'
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
import api, { extractApiError } from '../../services/api.js'
import ShippingZoneFormModal from './ShippingZoneFormModal.jsx'
import './ShippingZones.css'

const emptyDraft = {
  rateTypeId: '',
  minKm: '0',
  maxKm: '2',
  fee: '3000',
  priority: '0',
  active: true,
}

function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value || 0))}`
}

function ShippingZones() {
  const [shippingSetting, setShippingSetting] = useState(null)
  const [rateTypes, setRateTypes] = useState([])
  const [rates, setRates] = useState([])
  const [freeRules, setFreeRules] = useState([])
  const [selectedTypeId, setSelectedTypeId] = useState('all')
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [ruleName, setRuleName] = useState('')
  const [ruleMinPurchase, setRuleMinPurchase] = useState('')
  const [ruleMaxSubsidy, setRuleMaxSubsidy] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function reloadShipping() {
    const [setRes, typesRes, ratesRes, rulesRes] = await Promise.all([
      api.get('/admin/shipping-settings'),
      api.get('/admin/shipping-rate-types'),
      api.get('/admin/shipping-rates'),
      api.get('/admin/free-shipping-rules'),
    ])
    setShippingSetting(setRes.data?.data ?? null)
    setRateTypes(typesRes.data?.data ?? [])
    setRates(ratesRes.data?.data ?? [])
    setFreeRules(rulesRes.data?.data?.data ?? rulesRes.data?.data ?? [])
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/shipping-settings'),
      api.get('/admin/shipping-rate-types'),
      api.get('/admin/shipping-rates'),
      api.get('/admin/free-shipping-rules'),
    ])
      .then(([setRes, typesRes, ratesRes, rulesRes]) => {
        if (!active) return
        setShippingSetting(setRes.data?.data ?? null)
        setRateTypes(typesRes.data?.data ?? [])
        setRates(ratesRes.data?.data ?? [])
        setFreeRules(rulesRes.data?.data?.data ?? rulesRes.data?.data ?? [])
      })
      .catch((error) => {
        if (active) setNotice(extractApiError(error, 'Data ongkos kirim gagal dimuat.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filteredRates = useMemo(
    () =>
      selectedTypeId === 'all'
        ? rates
        : rates.filter((rate) => String(rate.shipping_rate_type_id) === selectedTypeId),
    [rates, selectedTypeId],
  )

  const activeRates = rates.filter((rate) => rate.is_active)
  const maxKm = shippingSetting?.maximum_delivery_distance_meters
    ? (shippingSetting.maximum_delivery_distance_meters / 1000).toFixed(1)
    : '—'
  const nearestRate = [...activeRates].sort(
    (a, b) => a.minimum_distance_meters - b.minimum_distance_meters,
  )[0]
  const activeFreeRules = freeRules.filter((rule) => rule.is_active)

  function openAddForm() {
    setDraft({
      ...emptyDraft,
      rateTypeId: rateTypes[0] ? String(rateTypes[0].id) : '',
    })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(rate) {
    setDraft({
      id: rate.id,
      rateTypeId: String(rate.shipping_rate_type_id),
      minKm: String(rate.minimum_distance_meters / 1000),
      maxKm: String(rate.maximum_distance_meters / 1000),
      fee: String(rate.fee),
      priority: String(rate.priority ?? 0),
      active: Boolean(rate.is_active),
    })
    setEditing(true)
    setNotice('')
  }

  async function saveRate(event) {
    event.preventDefault()
    if (!draft) return false

    const payload = {
      shipping_rate_type_id: Number(draft.rateTypeId),
      minimum_distance_meters: Math.round(Number(draft.minKm) * 1000),
      maximum_distance_meters: Math.round(Number(draft.maxKm) * 1000),
      fee: Number(draft.fee),
      priority: Number(draft.priority || 0),
      is_active: Boolean(draft.active),
    }

    try {
      setSaving(true)
      setNotice('')
      if (editing) {
        await api.patch(`/admin/shipping-rates/${draft.id}`, payload)
        setNotice('Tarif jarak berhasil diperbarui.')
      } else {
        await api.post('/admin/shipping-rates', payload)
        setNotice('Tarif jarak berhasil ditambahkan.')
      }
      await reloadShipping()
      setDraft(null)
      return true
    } catch (error) {
      const msg = extractApiError(
        error,
        'Gagal menyimpan tarif jarak. Pastikan rentang jarak tidak overlap atau bercelah.',
      )
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
      await api.delete(`/admin/shipping-rates/${deleteTarget.id}`)
      setDeleteTarget(null)
      await reloadShipping()
      setNotice('Tarif jarak berhasil dihapus.')
    } catch (error) {
      setNotice(
        extractApiError(
          error,
          'Gagal menghapus tarif (pastikan rentang jarak layanan aktif tetap utuh tanpa celah).',
        ),
      )
      setDeleteTarget(null)
    }
  }

  async function addFreeShippingRule(event) {
    event.preventDefault()
    if (!ruleName.trim() || ruleMinPurchase === '') return
    try {
      setNotice('')
      await api.post('/admin/free-shipping-rules', {
        name: ruleName.trim(),
        minimum_purchase: Number(ruleMinPurchase),
        maximum_subsidy: ruleMaxSubsidy !== '' ? Number(ruleMaxSubsidy) : null,
        is_active: true,
      })
      setRuleName('')
      setRuleMinPurchase('')
      setRuleMaxSubsidy('')
      await reloadShipping()
      setNotice('Aturan gratis ongkir berhasil ditambahkan.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal membuat aturan gratis ongkir.'))
    }
  }

  async function deleteFreeRule(ruleId) {
    try {
      setNotice('')
      await api.delete(`/admin/free-shipping-rules/${ruleId}`)
      await reloadShipping()
      setNotice('Aturan gratis ongkir dihapus/dinonaktifkan.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menghapus aturan gratis ongkir.'))
    }
  }

  const columns = [
    {
      key: 'type',
      label: 'Jenis Layanan',
      render: (rate) => (
        <span className="shipping-zones__name">
          <strong>{rate.type?.name?.toUpperCase() || `Layanan #${rate.shipping_rate_type_id}`}</strong>
          <small>{rate.type?.description || 'Tarif berdasarkan rute'}</small>
        </span>
      ),
    },
    {
      key: 'range',
      label: 'Rentang Jarak',
      render: (rate) =>
        `${(rate.minimum_distance_meters / 1000).toFixed(1)} – ${(rate.maximum_distance_meters / 1000).toFixed(1)} km (${rate.minimum_distance_meters}–${rate.maximum_distance_meters} m)`,
    },
    {
      key: 'fee',
      label: 'Tarif Ongkir',
      render: (rate) => (
        <strong className="shipping-zones__fee">{formatRupiah(rate.fee)}</strong>
      ),
    },
    {
      key: 'priority',
      label: 'Prioritas',
      render: (rate) => `Prioritas ${rate.priority ?? 0}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (rate) => (
        <StatusBadge tone={rate.is_active ? 'green' : 'neutral'}>
          {rate.is_active ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (rate) => (
        <div className="shipping-zones__actions">
          <button
            aria-label={`Edit tarif ${rate.id}`}
            className="shipping-zones__action"
            onClick={() => openEditForm(rate)}
            type="button"
          >
            <Pencil aria-hidden="true" size={12} />
            Edit
          </button>
          <button
            aria-label={`Hapus tarif ${rate.id}`}
            className="shipping-zones__action shipping-zones__action--delete"
            onClick={() => setDeleteTarget(rate)}
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
        title="Kelola Ongkos Kirim & Aturan Gratis Ongkir"
        description="Tarif bertingkat berdasarkan jarak rute (meter/km) divalidasi kontigu oleh server."
      />

      <section className="shipping-zones__stats" aria-label="Ringkasan distribusi">
        <article className="shipping-zones__stat">
          <span className="shipping-zones__stat-icon shipping-zones__stat-icon--green">
            <MapPinned aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Radius Maksimal Pengantaran</p>
            <strong>{maxKm === '—' ? '—' : `${maxKm} KM`}</strong>
            <small>Provider: {shippingSetting?.routing_provider || '—'}</small>
          </div>
        </article>
        <article className="shipping-zones__stat">
          <span className="shipping-zones__stat-icon shipping-zones__stat-icon--blue">
            <CircleDollarSign aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Tarif Dasar Terdekat</p>
            <strong>{nearestRate ? formatRupiah(nearestRate.fee) : '—'}</strong>
            <small>Tier terdekat aktif</small>
          </div>
        </article>
        <article className="shipping-zones__stat">
          <span className="shipping-zones__stat-icon shipping-zones__stat-icon--orange">
            <Gift aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Aturan Gratis Ongkir Aktif</p>
            <strong>{activeFreeRules.length} Program</strong>
            <small>{activeFreeRules[0]?.name || 'Belum ada program aktif'}</small>
          </div>
        </article>
        <article className="shipping-zones__stat">
          <span className="shipping-zones__stat-icon shipping-zones__stat-icon--purple">
            <Map aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Jenis Layanan &amp; Tier</p>
            <strong>{rateTypes.length} Layanan / {rates.length} Tier</strong>
            <small>{activeRates.length} tier aktif</small>
          </div>
        </article>
      </section>

      <section className="shipping-zones__table-card">
        <header className="shipping-zones__table-header">
          <div>
            <h2>Daftar Tarif Ongkir Berdasarkan Jarak</h2>
            <p>
              Rentang jarak tiap layanan aktif harus tersambung penuh dari 0 m sampai{' '}
              {shippingSetting?.maximum_delivery_distance_meters ?? 12000} m tanpa celah.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              aria-label="Filter jenis layanan"
              onChange={(event) => setSelectedTypeId(event.target.value)}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
              value={selectedTypeId}
            >
              <option value="all">Semua Layanan</option>
              {rateTypes.map((type) => (
                <option key={type.id} value={String(type.id)}>
                  {type.name}
                </option>
              ))}
            </select>
            <button
              className="shipping-zones__add"
              onClick={openAddForm}
              type="button"
            >
              <Plus aria-hidden="true" size={14} />
              Tambah Tier Ongkir
            </button>
          </div>
        </header>

        {notice && (
          <p className="shipping-zones__notice" role="status">
            {notice}
          </p>
        )}

        {loading ? (
          <p className="shipping-zones__empty">Memuat skema ongkos kirim...</p>
        ) : filteredRates.length ? (
          <DataTable
            columns={columns}
            label="Daftar tarif jarak ongkos kirim"
            rows={filteredRates}
          />
        ) : (
          <p className="shipping-zones__empty">Belum ada tier tarif ongkir terdaftar.</p>
        )}
      </section>

      <section className="shipping-zones__table-card" style={{ marginTop: 16 }}>
        <header className="shipping-zones__table-header">
          <div>
            <h2>Program Aturan Gratis Ongkir ({freeRules.length})</h2>
            <p>Subsidi otomatis ongkir saat subtotal belanja pelanggan memenuhi batas minimal.</p>
          </div>
        </header>

        <form
          onSubmit={addFreeShippingRule}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px 12px' }}
        >
          <input
            onChange={(event) => setRuleName(event.target.value)}
            placeholder="Nama promo gratis ongkir"
            required
            style={{ flex: '1 1 200px', padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
            value={ruleName}
          />
          <input
            min="0"
            onChange={(event) => setRuleMinPurchase(event.target.value)}
            placeholder="Min. Belanja (Rp)"
            required
            style={{ width: 140, padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
            type="number"
            value={ruleMinPurchase}
          />
          <input
            min="0"
            onChange={(event) => setRuleMaxSubsidy(event.target.value)}
            placeholder="Maks. Subsidi (Rp)"
            style={{ width: 150, padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
            type="number"
            value={ruleMaxSubsidy}
          />
          <button className="shipping-zones__add" type="submit">
            <Plus size={14} /> Tambah Program
          </button>
        </form>

        <div style={{ padding: '0 16px 16px', display: 'grid', gap: 8 }}>
          {freeRules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                border: '1px solid #e4eadc',
                borderRadius: 8,
                fontSize: 11,
              }}
            >
              <div>
                <strong>{rule.name}</strong>
                <div style={{ color: '#6b7765', marginTop: 2 }}>
                  Min. belanja {formatRupiah(rule.minimum_purchase)} • Maks. subsidi:{' '}
                  {rule.maximum_subsidy != null ? formatRupiah(rule.maximum_subsidy) : 'Penuh'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge tone={rule.is_active ? 'green' : 'neutral'}>
                  {rule.is_active ? 'Aktif' : 'Nonaktif'}
                </StatusBadge>
                <button
                  className="shipping-zones__action shipping-zones__action--delete"
                  onClick={() => deleteFreeRule(rule.id)}
                  type="button"
                >
                  <Trash2 size={12} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {draft && (
        <ShippingZoneFormModal
          draft={draft}
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveRate}
          rateTypes={rateTypes}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Tier"
          message={`Hapus tier ${(deleteTarget.minimum_distance_meters / 1000).toFixed(1)}-${(deleteTarget.maximum_distance_meters / 1000).toFixed(1)} km? Pastikan sisa tier masih kontigu.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Tier Tarif Ongkir?"
        />
      )}
    </div>
  )
}

export default ShippingZones
