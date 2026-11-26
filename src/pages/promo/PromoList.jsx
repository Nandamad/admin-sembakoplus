import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import FlashSalePanel from './FlashSalePanel.jsx'
import PromoForm from './PromoForm.jsx'
import './PromoList.css'

const initialVouchers = []

const emptyVoucher = {
  code: '',
  name: '',
  type: 'fixed',
  discountValue: '',
  discountMax: '',
  minSpend: '',
  quota: '',
  claimed: 0,
  startsAt: '',
  endsAt: '',
  isActive: false,
}

function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

function getDiscountLabel(voucher) {
  if (voucher.type === 'free_shipping') {
    return `Potongan Ongkir ${formatRupiah(voucher.discountValue)}`
  }
  if (voucher.type === 'percentage') {
    return `Diskon ${voucher.discountValue}% (Maks. ${formatRupiah(voucher.discountMax || 0)})`
  }
  return `Potongan Langsung ${formatRupiah(voucher.discountValue)}`
}

function PromoList() {
  const [vouchers, setVouchers] = useState(initialVouchers)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')

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

  function saveVoucher(event) {
    event.preventDefault()
    const savedVoucher = {
      ...draft,
      id: draft.id || `voucher-${Date.now()}`,
      code: draft.code.trim().toUpperCase(),
      name: draft.name.trim(),
      discountValue: Number(draft.discountValue) || 0,
      discountMax: Number(draft.discountMax) || 0,
      minSpend: Number(draft.minSpend) || 0,
      quota: Number(draft.quota),
      claimed: Number(draft.claimed) || 0,
    }

    const duplicateCode = vouchers.some(
      (voucher) =>
        voucher.code.toLowerCase() === savedVoucher.code.toLowerCase() &&
        voucher.id !== savedVoucher.id,
    )
    if (duplicateCode) return false

    if (editing) {
      setVouchers((current) =>
        current.map((voucher) =>
          voucher.id === savedVoucher.id ? savedVoucher : voucher,
        ),
      )
      setNotice('Voucher diperbarui pada tampilan ini. Belum disimpan ke server.')
    } else {
      setVouchers((current) => [savedVoucher, ...current])
      setNotice('Voucher ditambahkan pada tampilan ini. Belum disimpan ke server.')
    }

    setDraft(null)
    return true
  }

  function confirmDelete() {
    setVouchers((current) =>
      current.filter((voucher) => voucher.id !== deleteTarget.id),
    )
    setNotice('Voucher dihapus dari tampilan ini. Belum dihapus dari server.')
    setDeleteTarget(null)
  }

  const columns = [
    {
      key: 'code',
      label: 'Kode Voucher',
      render: (voucher) => (
        <strong className="promos__code">{voucher.code}</strong>
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
      label: 'Potongan / Cashback',
      render: (voucher) => getDiscountLabel(voucher),
    },
    {
      key: 'minSpend',
      label: 'Min. Belanja',
      render: (voucher) => formatRupiah(voucher.minSpend),
    },
    {
      key: 'quota',
      label: 'Kuota Klaim',
      render: (voucher) => (
        <span className="promos__quota">
          {voucher.claimed} / {voucher.quota} Terpakai
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (voucher) => (
        <StatusBadge tone={voucher.isActive ? 'green' : 'neutral'}>
          {voucher.isActive ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (voucher) => (
        <div className="promos__actions">
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
        title="Kelola Promo & Flash Sale"
        description="Atur durasi countdown timer flash sale dan kuota voucher diskon pengguna."
      />

      <FlashSalePanel />

      <section className="promos__table-card">
        <header className="promos__table-header">
          <div>
            <h2>Daftar Kupon &amp; Voucher Promo Pengguna</h2>
            <p>Kelola voucher yang tersedia untuk pelanggan aplikasi SembakoPlus.</p>
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

        {vouchers.length ? (
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

      {draft && (
        <PromoForm
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveVoucher}
          voucher={draft}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Voucher"
          message={`Apakah Anda yakin ingin menghapus voucher "${deleteTarget.code}"? Kupon ini tidak akan dapat diklaim atau digunakan lagi oleh pelanggan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Kupon Voucher?"
        />
      )}
    </div>
  )
}

export default PromoList
