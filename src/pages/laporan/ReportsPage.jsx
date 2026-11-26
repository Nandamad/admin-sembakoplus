import { useState } from 'react'
import {
  ArrowDownToLine,
  CalendarDays,
  FileCheck2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import DataTable from '../../components/DataTable.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import WithdrawModal from './WithdrawModal.jsx'
import {
  deadStockProducts,
  formatRupiah,
  initialWithdrawals,
  salesStats,
  topProducts,
} from './reportData.js'
import './ReportsPage.css'

function ReportsPage() {
  const balance = null
  const withdrawals = initialWithdrawals
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const withdrawalColumns = [
    {
      key: 'id',
      label: 'ID Penarikan',
      render: (withdrawal) => (
        <strong className="reports__withdrawal-id">{withdrawal.id}</strong>
      ),
    },
    { key: 'date', label: 'Tanggal & Waktu' },
    { key: 'account', label: 'Rekening Tujuan' },
    {
      key: 'amount',
      label: 'Nominal Penarikan',
      render: (withdrawal) => (
        <strong className="reports__withdrawal-amount">
          {formatRupiah(withdrawal.amount)}
        </strong>
      ),
    },
    {
      key: 'status',
      label: 'Status Transfer',
      render: (withdrawal) => (
        <StatusBadge
          tone={withdrawal.status === 'Berhasil Masuk' ? 'green' : 'neutral'}
        >
          {withdrawal.status}
        </StatusBadge>
      ),
    },
    {
      key: 'evidence',
      label: 'Bukti Transfer',
      render: (withdrawal) => (
        <span
          className={`reports__evidence${
            withdrawal.status === 'Berhasil Masuk'
              ? ''
              : ' reports__evidence--pending'
          }`}
        >
          <FileCheck2 aria-hidden="true" size={13} />
          {withdrawal.evidence}
        </span>
      ),
    },
  ]

  return (
    <div className="reports">
      <header className="reports__page-header">
        <div>
          <h1>Laporan Keuangan &amp; Tracking Penjualan</h1>
          <p>
            Pantau arus kas, laba bersih, estimasi rugi komoditas, produk terlaris
            &amp; dead stock.
          </p>
        </div>
        <div className="reports__header-actions">
          <span className="reports__date">
            <CalendarDays aria-hidden="true" size={13} />
            Hari Ini •{' '}
            {new Intl.DateTimeFormat('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              timeZone: 'Asia/Jakarta',
            }).format(new Date())}
          </span>
          <button
            className="reports__withdraw"
            onClick={() => setShowWithdrawModal(true)}
            type="button"
          >
            <ArrowDownToLine aria-hidden="true" size={14} />
            Tarik Saldo (Withdraw)
          </button>
        </div>
      </header>

      <p className="reports__sample-notice" role="note">
        Data laporan, saldo, dan riwayat penarikan akan tersedia setelah backend
        terhubung.
      </p>

      <section className="reports__stats" aria-label="Ringkasan keuangan hari ini">
        {salesStats.map((stat, index) => {
          const Icon =
            index === 3 ? TrendingDown : index === 2 ? TrendingUp : Wallet
          return (
            <article
              className={`reports__stat reports__stat--${stat.tone}`}
              key={stat.label}
            >
              <div className="reports__stat-top">
                <h2>{stat.label}</h2>
                <span className="reports__stat-tag">{stat.tag}</span>
              </div>
              <div className="reports__stat-value-row">
                <strong>
                  {stat.value == null ? '—' : formatRupiah(stat.value)}
                </strong>
                <Icon aria-hidden="true" size={14} />
              </div>
              <p>{stat.detail}</p>
            </article>
          )
        })}
      </section>

      <section className="reports__product-panels">
        <article className="reports__panel reports__panel--top">
          <header className="reports__panel-header">
            <div>
              <h2>Produk Terlaris (Fast-Moving)</h2>
              <p>Produk dengan penjualan tertinggi pada periode ini</p>
            </div>
            <StatusBadge tone={topProducts.length ? 'green' : 'neutral'}>
              {topProducts.length ? `${topProducts.length} Produk` : 'Belum tersedia'}
            </StatusBadge>
          </header>
          {topProducts.length ? (
            <ol className="reports__product-list">
              {topProducts.map((product, index) => (
                <li className="reports__product-row" key={product.id}>
                  <span className="reports__rank">{index + 1}.</span>
                  <div className="reports__product-copy">
                    <strong>{product.name}</strong>
                    <small>
                      Omset: {formatRupiah(product.revenue)} • {product.note}
                    </small>
                  </div>
                  <strong className="reports__product-sold">
                    {product.sold} Terjual
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="reports__empty">Data produk belum tersedia.</p>
          )}
        </article>

        <article className="reports__panel reports__panel--dead-stock">
          <header className="reports__panel-header">
            <div>
              <h2>Produk Kurang Laku (Dead Stock Alert)</h2>
              <p>Stok yang perlu perhatian dan tindakan segera</p>
            </div>
            <StatusBadge tone="neutral">
              {deadStockProducts.length ? 'Perlu Tindakan' : 'Belum tersedia'}
            </StatusBadge>
          </header>
          {deadStockProducts.length ? (
            <ol className="reports__product-list">
              {deadStockProducts.map((product, index) => (
                <li className="reports__product-row" key={product.id}>
                  <span className="reports__rank">{index + 1}.</span>
                  <div className="reports__product-copy">
                    <strong>{product.name}</strong>
                    <small>
                      Stok Gudang: {product.stock} pcs • {product.days} Hari
                      Terakhir
                    </small>
                  </div>
                  <span className="reports__dead-stock-summary">
                    <strong>{product.sold} Terjual</strong>
                    <small>{product.suggestion}</small>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="reports__empty">Data stok belum tersedia.</p>
          )}
        </article>
      </section>

      <section className="reports__withdrawals">
        <header className="reports__withdrawals-header">
          <div>
            <h2>
              Arus Kas Masuk &amp; Riwayat Penarikan Dana (Withdrawal Log)
            </h2>
            <p>Informasi arus kas dan rekening akan dimuat dari backend.</p>
          </div>
        </header>
        {withdrawals.length ? (
          <DataTable
            columns={withdrawalColumns}
            label="Arus kas dan riwayat penarikan dana"
            rows={withdrawals}
          />
        ) : (
          <p className="reports__empty">Belum ada riwayat penarikan.</p>
        )}
      </section>

      {showWithdrawModal && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  )
}

export default ReportsPage
