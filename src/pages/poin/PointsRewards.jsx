import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  Coins,
  Gift,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
} from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api, { extractApiError } from '../../services/api.js'
import RewardFormModal from './RewardFormModal.jsx'
import './PointsRewards.css'

const emptyDraft = {
  name: '',
  description: '',
  type: 'discount',
  pointsRequired: '',
  discountAmount: '',
  quota: '',
  active: true,
}

function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value || 0))}`
}

function mapApiReward(reward) {
  return {
    id: reward.id,
    name: reward.name,
    description: reward.description || '',
    type: reward.type || 'discount',
    pointsRequired: Number(reward.coin_cost ?? 0),
    discountAmount: Number(reward.value ?? 0),
    quota: reward.stock ?? '',
    active: Boolean(reward.is_active),
  }
}

function PointsRewards() {
  const [rewards, setRewards] = useState([])
  const [coinSetting, setCoinSetting] = useState(null)
  const [customers, setCustomers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [grantUserId, setGrantUserId] = useState('')
  const [grantAmount, setGrantAmount] = useState('50')
  const [grantReason, setGrantReason] = useState('Bonus apresiasi pelanggan')
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function reloadPoints() {
    const [rewRes, setRes, txRes, usersRes] = await Promise.all([
      api.get('/admin/rewards'),
      api.get('/admin/coin-settings'),
      api.get('/admin/coin-transactions'),
      api.get('/admin/users', { params: { role: 'customer' } }),
    ])
    setRewards((rewRes.data?.data ?? []).map(mapApiReward))
    setCoinSetting(setRes.data?.data ?? null)
    setTransactions(txRes.data?.data ?? [])
    const custs = usersRes.data?.data ?? []
    setCustomers(custs)
    if (custs[0] && !grantUserId) setGrantUserId(String(custs[0].id))
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/rewards'),
      api.get('/admin/coin-settings'),
      api.get('/admin/coin-transactions'),
      api.get('/admin/users', { params: { role: 'customer' } }),
    ])
      .then(([rewRes, setRes, txRes, usersRes]) => {
        if (!active) return
        setRewards((rewRes.data?.data ?? []).map(mapApiReward))
        setCoinSetting(setRes.data?.data ?? null)
        setTransactions(txRes.data?.data ?? [])
        const custs = usersRes.data?.data ?? []
        setCustomers(custs)
        if (custs[0]) setGrantUserId(String(custs[0].id))
      })
      .catch((error) => {
        if (active) setNotice(extractApiError(error, 'Data koin & reward gagal dimuat.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const activeRewards = rewards.filter((reward) => reward.active)
  const lowestPointReward = useMemo(
    () =>
      [...activeRewards].sort(
        (left, right) => left.pointsRequired - right.pointsRequired,
      )[0],
    [activeRewards],
  )

  function openAddForm() {
    setDraft({ ...emptyDraft })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(reward) {
    setDraft({ ...reward })
    setEditing(true)
    setNotice('')
  }

  async function saveReward(event) {
    event.preventDefault()
    if (!draft) return false

    const payload = {
      name: draft.name.trim(),
      description: draft.description?.trim() || null,
      type: draft.type || 'discount',
      coin_cost: Number(draft.pointsRequired),
      value: draft.discountAmount !== '' ? Number(draft.discountAmount) : null,
      stock: draft.quota !== '' && draft.quota !== null ? Number(draft.quota) : null,
      is_active: Boolean(draft.active),
    }

    try {
      setSaving(true)
      setNotice('')
      if (editing) {
        await api.patch(`/admin/rewards/${draft.id}`, payload)
        setNotice(`Reward "${payload.name}" berhasil diperbarui.`)
      } else {
        await api.post('/admin/rewards', payload)
        setNotice(`Reward "${payload.name}" berhasil diterbitkan.`)
      }
      await reloadPoints()
      setDraft(null)
      return true
    } catch (error) {
      const msg = extractApiError(error, 'Reward gagal disimpan.')
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
      await api.delete(`/admin/rewards/${deleteTarget.id}`)
      setDeleteTarget(null)
      await reloadPoints()
      setNotice(`Reward "${deleteTarget.name}" berhasil dihapus.`)
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menghapus reward.'))
      setDeleteTarget(null)
    }
  }

  async function saveCoinSettings(event) {
    event.preventDefault()
    if (!coinSetting) return
    try {
      setSaving(true)
      setNotice('')
      await api.put('/admin/coin-settings', {
        is_enabled: Boolean(coinSetting.is_enabled),
        earning_spend_amount: Number(coinSetting.earning_spend_amount),
        earning_coin_amount: Number(coinSetting.earning_coin_amount),
        minimum_eligible_subtotal: Number(coinSetting.minimum_eligible_subtotal || 0),
        coin_value: Number(coinSetting.coin_value),
        minimum_redemption_coins: Number(coinSetting.minimum_redemption_coins),
        maximum_redemption_type: coinSetting.maximum_redemption_type || 'percentage',
        maximum_redemption_value: Number(coinSetting.maximum_redemption_value),
        allow_with_voucher: Boolean(coinSetting.allow_with_voucher),
        expiry_months: coinSetting.expiry_months ? Number(coinSetting.expiry_months) : null,
      })
      await reloadPoints()
      setNotice('Pengaturan aturan koin berhasil diperbarui.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menyimpan aturan koin.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleGrantCoins(event) {
    event.preventDefault()
    if (!grantUserId || !grantAmount) return
    try {
      setSaving(true)
      setNotice('')
      const { data } = await api.post(`/admin/customers/${grantUserId}/coins/grant`, {
        amount: Number(grantAmount),
        reason: grantReason.trim(),
      })
      await reloadPoints()
      setNotice(data?.data?.message || 'Koin berhasil diberikan ke pelanggan.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal memberikan koin ke pelanggan.'))
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama Reward',
      render: (reward) => (
        <span className="points__reward-name">
          <strong>{reward.name}</strong>
          <small>{reward.type === 'gift' ? 'Hadiah Barang' : 'Potongan Diskon'}</small>
        </span>
      ),
    },
    {
      key: 'pointsRequired',
      label: 'Biaya Koin',
      render: (reward) => (
        <strong className="points__point-value">
          {new Intl.NumberFormat('id-ID').format(reward.pointsRequired)} Koin
        </strong>
      ),
    },
    {
      key: 'discountAmount',
      label: 'Nilai Reward',
      render: (reward) =>
        reward.discountAmount ? formatRupiah(reward.discountAmount) : '—',
    },
    {
      key: 'quota',
      label: 'Stok Reward',
      render: (reward) =>
        reward.quota !== '' && reward.quota !== null
          ? `${reward.quota} Tersedia`
          : 'Tanpa Batas',
    },
    {
      key: 'status',
      label: 'Status',
      render: (reward) => {
        const soldOut = reward.quota !== '' && reward.quota !== null && Number(reward.quota) <= 0
        const label = !reward.active ? 'Nonaktif' : soldOut ? 'Stok Habis' : 'Aktif'
        const tone = reward.active && !soldOut ? 'green' : 'neutral'
        return <StatusBadge tone={tone}>{label}</StatusBadge>
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (reward) => (
        <div className="points__actions">
          <button
            aria-label={`Edit ${reward.name}`}
            className="points__action"
            onClick={() => openEditForm(reward)}
            type="button"
          >
            <Pencil aria-hidden="true" size={12} />
            Edit
          </button>
          <button
            aria-label={`Hapus ${reward.name}`}
            className="points__action points__action--delete"
            onClick={() => setDeleteTarget(reward)}
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
    <div className="points">
      <PageHeader
        title="Kelola Koin & Reward Loyalitas"
        description="Atur nilai konversi koin, pemberian koin pelanggan, dan katalog reward penukaran koin."
      />

      <section className="points__stats" aria-label="Ringkasan reward poin">
        <article className="points__stat">
          <span className="points__stat-icon points__stat-icon--green">
            <Gift aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Reward Aktif</p>
            <strong>{activeRewards.length} Reward</strong>
            <small>Dari total {rewards.length} katalog reward</small>
          </div>
        </article>
        <article className="points__stat">
          <span className="points__stat-icon points__stat-icon--orange">
            <Coins aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Nilai 1 Koin Saat Ini</p>
            <strong>{coinSetting ? formatRupiah(coinSetting.coin_value) : '—'}</strong>
            <small>
              {coinSetting
                ? `${coinSetting.earning_coin_amount} koin per ${formatRupiah(coinSetting.earning_spend_amount)}`
                : 'Menunggu data'}
            </small>
          </div>
        </article>
        <article className="points__stat">
          <span className="points__stat-icon points__stat-icon--blue">
            <Award aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Transaksi Koin Tercatat</p>
            <strong>{transactions.length} Log</strong>
            <small>Riwayat earn/grant/redeem terbaru</small>
          </div>
        </article>
        <article className="points__stat">
          <span className="points__stat-icon points__stat-icon--purple">
            <Star aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Penukaran Koin Terendah</p>
            <strong>
              {lowestPointReward
                ? `${new Intl.NumberFormat('id-ID').format(lowestPointReward.pointsRequired)} Koin`
                : '—'}
            </strong>
            <small>{lowestPointReward?.name || 'Belum ada reward aktif'}</small>
          </div>
        </article>
      </section>

      {notice && (
        <p className="points__notice" role="status">
          {notice}
        </p>
      )}

      <section className="points__table-card">
        <header className="points__table-header">
          <div>
            <h2>Daftar Reward Penukaran Koin</h2>
            <p>Hadiah atau voucher potongan belanja yang dapat ditukar pelanggan.</p>
          </div>
          <button className="points__add" onClick={openAddForm} type="button">
            <Plus aria-hidden="true" size={14} />
            Buat Reward Baru
          </button>
        </header>

        {loading ? (
          <p className="points__empty">Memuat katalog reward...</p>
        ) : rewards.length ? (
          <DataTable
            columns={columns}
            label="Daftar reward penukaran koin"
            rows={rewards}
          />
        ) : (
          <p className="points__empty">Belum ada reward koin terdaftar.</p>
        )}
      </section>

      {coinSetting && (
        <section className="points__table-card" style={{ marginTop: 16 }}>
          <header className="points__table-header">
            <div>
              <h2>Pengaturan Program Koin &amp; Pemberian Manual</h2>
              <p>Atur perolehan/penukaran koin saat checkout serta berikan koin langsung ke pelanggan.</p>
            </div>
          </header>

          <form
            onSubmit={saveCoinSettings}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, padding: '0 16px 16px', fontSize: 11 }}
          >
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Belanja Perolehan (Rp)</span>
              <input
                min="1"
                onChange={(event) => setCoinSetting({ ...coinSetting, earning_spend_amount: Number(event.target.value) })}
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0' }}
                type="number"
                value={coinSetting.earning_spend_amount}
              />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Koin Didapat</span>
              <input
                min="0"
                onChange={(event) => setCoinSetting({ ...coinSetting, earning_coin_amount: Number(event.target.value) })}
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0' }}
                type="number"
                value={coinSetting.earning_coin_amount}
              />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Nilai 1 Koin (Rp)</span>
              <input
                min="1"
                onChange={(event) => setCoinSetting({ ...coinSetting, coin_value: Number(event.target.value) })}
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0' }}
                type="number"
                value={coinSetting.coin_value}
              />
            </label>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Batas Maks Penukaran ({coinSetting.maximum_redemption_type === 'percentage' ? '%' : 'Rp'})</span>
              <input
                min="0"
                onChange={(event) => setCoinSetting({ ...coinSetting, maximum_redemption_value: Number(event.target.value) })}
                style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0' }}
                type="number"
                value={coinSetting.maximum_redemption_value}
              />
            </label>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="points__add" disabled={saving} type="submit">
                <Save size={14} /> Simpan Aturan Koin
              </button>
            </div>
          </form>

          <form
            onSubmit={handleGrantCoins}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px 16px', borderTop: '1px solid #eef2e7' }}
          >
            <select
              onChange={(event) => setGrantUserId(event.target.value)}
              style={{ flex: '1 1 200px', padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
              value={grantUserId}
            >
              {customers.map((customer) => (
                <option key={customer.id} value={String(customer.id)}>
                  {customer.name} (Saldo: {customer.coin_balance} koin)
                </option>
              ))}
            </select>
            <input
              min="1"
              onChange={(event) => setGrantAmount(event.target.value)}
              placeholder="Jumlah koin"
              required
              style={{ width: 110, padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
              type="number"
              value={grantAmount}
            />
            <input
              onChange={(event) => setGrantReason(event.target.value)}
              placeholder="Alasan pemberian koin"
              required
              style={{ flex: '1 1 200px', padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
              value={grantReason}
            />
            <button className="points__add" disabled={saving || !grantUserId} type="submit">
              <Plus size={14} /> Beri Koin Pelanggan
            </button>
          </form>
        </section>
      )}

      {draft && (
        <RewardFormModal
          draft={draft}
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveReward}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Reward"
          message={`Reward "${deleteTarget.name}" akan dihapus dari database.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Reward Poin?"
        />
      )}
    </div>
  )
}

export default PointsRewards
