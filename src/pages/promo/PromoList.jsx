import { useEffect, useState } from 'react'
import { Pencil, Plus, Send, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api, { extractApiError } from '../../services/api.js'
import FlashSalePanel from './FlashSalePanel.jsx'
import PromoForm from './PromoForm.jsx'
import './PromoList.css'

const emptyVoucher = {
  code: '',
  name: '',
  type: 'fixed',
  discountValue: '',
  discountMax: '',
  minSpend: 0,
  quota: '',
  perCustomerLimit: 1,
  startsAt: '',
  endsAt: '',
  canCombineCoin: true,
  isActive: true,
}

function toInputDateTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function mapApiVoucher(voucher) {
  return {
    id: voucher.id,
    code: voucher.code || '',
    name: voucher.name || '',
    type: voucher.voucher_type || 'fixed',
    discountValue: Number(voucher.discount_value ?? 0),
    discountMax: voucher.maximum_discount ?? '',
    minSpend: Number(voucher.minimum_purchase ?? 0),
    quota: voucher.global_quota ?? '',
    perCustomerLimit: voucher.per_customer_limit ?? '',
    startsAt: toInputDateTime(voucher.start_at),
    endsAt: toInputDateTime(voucher.end_at),
    canCombineCoin: Boolean(voucher.can_combine_coin),
    isActive: voucher.status === 'active',
    status: voucher.status,
    rules: voucher.distribution_rules ?? [],
  }
}

function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value || 0))}`
}

function getDiscountLabel(voucher) {
  if (voucher.type === 'free_shipping') {
    return `Subsidi Ongkir ${formatRupiah(voucher.discountValue)}`
  }
  if (voucher.type === 'percentage') {
    return `Diskon ${voucher.discountValue}%${voucher.discountMax ? ` (Maks. ${formatRupiah(voucher.discountMax)})` : ''}`
  }
  return `Potongan ${formatRupiah(voucher.discountValue)}`
}

function PromoList() {
  const [vouchers, setVouchers] = useState([])
  const [customers, setCustomers] = useState([])
  const [usages, setUsages] = useState([])
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [assignTarget, setAssignTarget] = useState(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [distributionType, setDistributionType] = useState('manual')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function reloadVouchers() {
    const [voucherRes, usageRes] = await Promise.all([
      api.get('/admin/vouchers'),
      api.get('/admin/voucher-usages').catch(() => ({ data: { data: [] } })),
    ])
    setVouchers((voucherRes.data?.data ?? []).map(mapApiVoucher))
    setUsages(usageRes.data?.data ?? [])
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/vouchers'),
      api.get('/admin/users', { params: { role: 'customer' } }),
      api.get('/admin/voucher-usages').catch(() => ({ data: { data: [] } })),
    ])
      .then(([voucherRes, userRes, usageRes]) => {
        if (!active) return
        setVouchers((voucherRes.data?.data ?? []).map(mapApiVoucher))
        const customerList = userRes.data?.data ?? []
        setCustomers(customerList)
        if (customerList[0]) setSelectedCustomerId(String(customerList[0].id))
        setUsages(usageRes.data?.data ?? [])
      })
      .catch((error) => {
        if (active) setNotice(extractApiError(error, 'Data voucher gagal dimuat.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  function openAddForm() {
    setDraft({ ...emptyVoucher })
    setEditing(false)
    setNotice('')
  }

  function openEditForm(voucher) {
    setDraft({ ...voucher })
    setEditing(true)
    setNotice('')
  }

  async function saveVoucher(event) {
    event.preventDefault()
    if (!draft) return false

    const payload = {
      name: draft.name.trim(),
      code: draft.code.trim().toUpperCase(),
      voucher_type: draft.type,
      discount_value: Number(draft.discountValue) || 0,
      maximum_discount: draft.discountMax !== '' && draft.discountMax !== null ? Number(draft.discountMax) : null,
      minimum_purchase: Number(draft.minSpend) || 0,
      global_quota: draft.quota !== '' && draft.quota !== null ? Number(draft.quota) : null,
      per_customer_limit: draft.perCustomerLimit !== '' && draft.perCustomerLimit !== null ? Number(draft.perCustomerLimit) : null,
      start_at: draft.startsAt || null,
      end_at: draft.endsAt || null,
      can_combine_coin: Boolean(draft.canCombineCoin),
      status: draft.isActive ? 'active' : 'inactive',
    }

    try {
      setSaving(true)
      setNotice('')
      if (editing) {
        await api.patch(`/admin/vouchers/${draft.id}`, payload)
        setNotice(`Voucher ${payload.code} berhasil diperbarui.`)
      } else {
        const { data } = await api.post('/admin/vouchers', payload)
        const createdId = data?.data?.id
        if (createdId) {
          await api.post(`/admin/vouchers/${createdId}/distribution-rules`, {
            distribution_type: 'code',
            is_active: true,
          }).catch(() => {})
        }
        setNotice(`Voucher ${payload.code} berhasil diterbitkan ke database.`)
      }
      await reloadVouchers()
      setDraft(null)
      return true
    } catch (error) {
      setNotice(extractApiError(error, 'Voucher gagal disimpan.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignCustomer(event) {
    event.preventDefault()
    if (!assignTarget || !selectedCustomerId) return
    try {
      setNotice('')
      await api.post(`/admin/vouchers/${assignTarget.id}/distribution-rules`, {
        distribution_type: distributionType,
        is_active: true,
      }).catch(() => {})

      await api.post(`/admin/vouchers/${assignTarget.id}/assign-customers`, {
        user_ids: [Number(selectedCustomerId)],
      })
      const customerName =
        customers.find((user) => String(user.id) === selectedCustomerId)?.name || 'Pelanggan'
      setNotice(`Voucher ${assignTarget.code} berhasil diberikan kepada ${customerName}.`)
      setAssignTarget(null)
      await reloadVouchers()
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal memberikan voucher ke pelanggan.'))
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      setNotice('')
      await api.delete(`/admin/vouchers/${deleteTarget.id}`)
      setDeleteTarget(null)
      await reloadVouchers()
      setNotice(`Voucher "${deleteTarget.code}" berhasil dihapus.`)
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menghapus voucher.'))
      setDeleteTarget(null)
    }
  }

  const columns = [
    {
      key: 'code',
      label: 'Kode Voucher',
      render: (voucher) => (
        <strong className="promos__code">{voucher.code || `#${voucher.id}`}</strong>
      ),
    },
    {
      key: 'name',
      label: 'Nama Promo',
      render: (voucher) => (
        <span className="promos__name">{voucher.name}</span>
      ),
    },
    {
      key: 'discount',
      label: 'Potongan',
      render: (voucher) => getDiscountLabel(voucher),
    },
    {
      key: 'minSpend',
      label: 'Min. Belanja',
      render: (voucher) => formatRupiah(voucher.minSpend),
    },
    {
      key: 'quota',
      label: 'Kuota Global',
      render: (voucher) => (
        <span className="promos__quota">
          {voucher.quota ? `${voucher.quota} Klaim` : 'Tanpa Batas'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (voucher) => (
        <StatusBadge tone={voucher.isActive ? 'green' : 'neutral'}>
          {voucher.isActive ? 'Aktif' : voucher.status || 'Nonaktif'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (voucher) => (
        <div className="promos__actions">
          <button
            aria-label={`Bagikan voucher ${voucher.code}`}
            className="promos__action"
            onClick={() => setAssignTarget(voucher)}
            title="Berikan ke pelanggan"
            type="button"
          >
            <Send aria-hidden="true" size={13} />
            Kirim
          </button>
          <button
            aria-label={`Edit voucher ${voucher.code}`}
            className="promos__action"
            onClick={() => openEditForm(voucher)}
            title="Edit voucher"
            type="button"
          >
            <Pencil aria-hidden="true" size={13} />
            Edit
          </button>
          <button
            aria-label={`Hapus voucher ${voucher.code}`}
            className="promos__action promos__action--delete"
            onClick={() => setDeleteTarget(voucher)}
            title="Hapus voucher"
            type="button"
          >
            <Trash2 aria-hidden="true" size={13} />
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="promos">
      <PageHeader
        title="Kelola Promo, Diskon Produk & Voucher"
        description="Atur diskon per produk, terbitkan voucher, dan bagikan kupon langsung ke pelanggan."
      />

      <FlashSalePanel />

      <section className="promos__table-card">
        <header className="promos__table-header">
          <div>
            <h2>Daftar Kupon &amp; Voucher Promo Pengguna</h2>
            <p>
              Total pemakaian tercatat di server: {usages.length} transaksi.
            </p>
          </div>
          <button
            className="promos__add"
            onClick={openAddForm}
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
            Buat Voucher Baru
          </button>
        </header>

        {notice && (
          <p className="promos__notice" role="status">
            {notice}
          </p>
        )}

        {loading ? (
          <p className="promos__empty">Memuat data voucher...</p>
        ) : vouchers.length ? (
          <DataTable
            columns={columns}
            label="Daftar kupon dan voucher promo"
            rows={vouchers}
          />
        ) : (
          <p className="promos__empty">
            Belum ada voucher. Buat voucher baru untuk ditampilkan di daftar.
          </p>
        )}
      </section>

      {assignTarget && (
        <div
          className="promo-form__backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setAssignTarget(null)
          }}
        >
          <section className="promo-form" role="dialog" aria-modal="true">
            <header className="promo-form__header">
              <div>
                <h2>Bagikan Voucher {assignTarget.code} ke Pelanggan</h2>
                <p>Atur aturan distribusi dan pilih pelanggan penerima hak voucher.</p>
              </div>
            </header>
            <form className="promo-form__body" onSubmit={handleAssignCustomer}>
              <label className="promo-form__field promo-form__field--wide">
                <span>Aturan Distribusi</span>
                <select
                  onChange={(event) => setDistributionType(event.target.value)}
                  value={distributionType}
                >
                  <option value="manual">Pemberian Manual Admin</option>
                  <option value="code">Klaim Kode Publik</option>
                  <option value="new_customer">Pelanggan Baru</option>
                  <option value="completed_order">Pasca Pesanan Selesai</option>
                  <option value="minimum_transaction">Minimum Transaksi</option>
                </select>
              </label>
              <label className="promo-form__field promo-form__field--wide">
                <span>Pelanggan Penerima</span>
                <select
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  value={selectedCustomerId}
                >
                  {customers.map((user) => (
                    <option key={user.id} value={String(user.id)}>
                      {user.name} ({user.email || user.phone})
                    </option>
                  ))}
                </select>
              </label>
              <footer className="promo-form__footer">
                <button
                  className="promo-form__cancel"
                  onClick={() => setAssignTarget(null)}
                  type="button"
                >
                  Batal
                </button>
                <button className="promo-form__submit" disabled={!selectedCustomerId} type="submit">
                  Berikan Voucher
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {draft && (
        <PromoForm
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveVoucher}
          saving={saving}
          voucher={draft}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Voucher"
          message={`Apakah Anda yakin ingin menghapus voucher "${deleteTarget.code}" dari server?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Kupon Voucher?"
        />
      )}
    </div>
  )
}

export default PromoList
