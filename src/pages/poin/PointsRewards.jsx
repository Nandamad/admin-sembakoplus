import { useMemo, useState } from 'react'
import {
  Award,
  Gift,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import RewardFormModal from './RewardFormModal.jsx'
import './PointsRewards.css'

const initialRewards = []

const emptyDraft = {
  name: '',
  pointsRequired: '',
  discountAmount: '',
  minSpend: '',
  quota: '',
  claimed: 0,
  active: false,
}

function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

function PointsRewards() {
  const [rewards, setRewards] = useState(initialRewards)
  const [draft, setDraft] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')

  const activeRewards = rewards.filter((reward) => reward.active)
  const totalClaims = useMemo(
    () => rewards.reduce((total, reward) => total + reward.claimed, 0),
    [rewards],
  )
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

  function saveReward(event) {
    event.preventDefault()
    const savedReward = {
      ...draft,
      id: draft.id || `reward-${Date.now()}`,
      name: draft.name.trim(),
      pointsRequired: Number(draft.pointsRequired),
      discountAmount: Number(draft.discountAmount),
      minSpend: Number(draft.minSpend),
      quota: Number(draft.quota),
      claimed: Number(draft.claimed) || 0,
    }

    const duplicateName = rewards.some(
      (reward) =>
        reward.name.toLowerCase() === savedReward.name.toLowerCase() &&
        reward.id !== savedReward.id,
    )
    if (duplicateName) return false

    if (editing) {
      setRewards((current) =>
        current.map((reward) =>
          reward.id === savedReward.id ? savedReward : reward,
        ),
      )
      setNotice('Reward diperbarui pada tampilan ini. Belum disimpan ke server.')
    } else {
      setRewards((current) => [...current, savedReward])
      setNotice('Reward ditambahkan pada tampilan ini. Belum disimpan ke server.')
    }

    setDraft(null)
    return true
  }

  function confirmDelete() {
    setRewards((current) =>
      current.filter((reward) => reward.id !== deleteTarget.id),
    )
    setNotice('Reward dihapus dari tampilan ini. Belum dihapus dari server.')
    setDeleteTarget(null)
  }

  const columns = [
    {
      key: 'name',
      label: 'Nama Reward / Kupon',
      render: (reward) => (
        <span className="points__reward-name">
          <strong>{reward.name}</strong>
          <small>Reward penukaran poin loyalitas</small>
        </span>
      ),
    },
    {
      key: 'pointsRequired',
      label: 'Poin Ditukar',
      render: (reward) => (
        <strong className="points__point-value">
          {new Intl.NumberFormat('id-ID').format(reward.pointsRequired)} Poin
        </strong>
      ),
    },
    {
      key: 'discountAmount',
      label: 'Nilai Potongan',
      render: (reward) => formatRupiah(reward.discountAmount),
    },
    {
      key: 'minSpend',
      label: 'Min. Belanja',
      render: (reward) =>
        reward.minSpend > 0 ? formatRupiah(reward.minSpend) : 'Tanpa minimum',
    },
    {
      key: 'quota',
      label: 'Kuota Klaim',
      render: (reward) => `${reward.claimed} / ${reward.quota} Terpakai`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (reward) => {
        const soldOut = reward.claimed >= reward.quota
        const label = !reward.active ? 'Nonaktif' : soldOut ? 'Kuota Habis' : 'Aktif'
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
        title="Kelola Poin & Reward Loyalitas"
        description="Atur reward penukaran poin dan pantau kuota klaim pelanggan SembakoPlus."
      />

      <p className="points__sample-notice" role="note">
        Data poin dan reward akan ditampilkan setelah tersedia dari backend.
      </p>

      <section className="points__stats" aria-label="Ringkasan reward poin">
        <article className="points__stat">
          <span className="points__stat-icon points__stat-icon--green">
            <Gift aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Reward Aktif</p>
            <strong>{rewards.length ? `${activeRewards.length} Reward` : '—'}</strong>
            <small>{rewards.length ? 'Tersedia untuk ditukar' : 'Menunggu data backend'}</small>
          </div>
        </article>
        <article className="points__stat">
          <span className="points__stat-icon points__stat-icon--orange">
            <Star aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Total Klaim Reward</p>
            <strong>
              {rewards.length
                ? `${new Intl.NumberFormat('id-ID').format(totalClaims)} Klaim`
                : '—'}
            </strong>
            <small>Akumulasi klaim reward</small>
          </div>
        </article>
        <article className="points__stat">
          <span className="points__stat-icon points__stat-icon--blue">
            <Award aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Katalog Reward</p>
            <strong>{rewards.length ? `${rewards.length} Jenis Reward` : '—'}</strong>
            <small>Kupon dan potongan poin</small>
          </div>
        </article>
        <article className="points__stat">
          <span className="points__stat-icon points__stat-icon--purple">
            <Star aria-hidden="true" size={16} />
          </span>
          <div>
            <p>Penukaran Poin Terendah</p>
            <strong>
              {lowestPointReward
                ? `${new Intl.NumberFormat('id-ID').format(
                    lowestPointReward.pointsRequired,
                  )} Poin`
                : '—'}
            </strong>
            <small>{lowestPointReward?.name || 'Belum ada reward aktif'}</small>
          </div>
        </article>
      </section>

      <section className="points__table-card">
        <header className="points__table-header">
          <div>
            <h2>Daftar Reward &amp; Kupon Poin Loyalitas</h2>
            <p>
              Kelola hadiah diskon sembako yang bisa ditukar pelanggan dengan
              poin
            </p>
          </div>
          <button className="points__add" onClick={openAddForm} type="button">
            <Plus aria-hidden="true" size={14} />
            Buat Reward Baru
          </button>
        </header>

        {notice && (
          <p className="points__notice" role="status">
            {notice}
          </p>
        )}

        {rewards.length ? (
          <DataTable
            columns={columns}
            label="Daftar reward dan kupon penukaran poin"
            rows={rewards}
          />
        ) : (
          <p className="points__empty">
            Belum ada reward poin. Buat reward baru untuk ditampilkan kepada
            pelanggan.
          </p>
        )}
      </section>

      {draft && (
        <RewardFormModal
          draft={draft}
          editing={editing}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={saveReward}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          confirmLabel="Ya, Hapus Reward"
          message={`Reward "${deleteTarget.name}" akan dihapus dari daftar pada tampilan ini.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Hapus Reward Poin?"
        />
      )}
    </div>
  )
}

export default PointsRewards
