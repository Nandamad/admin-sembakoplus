import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  CalendarDays,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import DataTable from '../../components/DataTable.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api, { extractApiError } from '../../services/api.js'
import WithdrawModal from './WithdrawModal.jsx'
import { formatRupiah, getDefaultDateRange } from './reportData.js'
import './ReportsPage.css'

function ReportsPage() {
  const defaultRange = getDefaultDateRange()
  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [group, setGroup] = useState('day')
  const [report, setReport] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/reports', { params: { from, to, group } }),
      api.get('/admin/inventory', { params: { per_page: 25 } }),
      api.get('/admin/audit-logs').catch(() => ({ data: { data: [] } })),
    ])
      .then(([reportRes, invRes, auditRes]) => {
        if (!active) return
        setReport(reportRes.data?.data ?? null)
        const variants = invRes.data?.data ?? []
        setLowStock(variants.filter((variant) => Number(variant.stock) <= 25))
        setAuditLogs(auditRes.data?.data ?? [])
        setError('')
      })
      .catch((err) => {
        if (active) setError(extractApiError(err, 'Laporan gagal dimuat dari server.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [from, to, group])

  const summary = report?.sales?.summary ?? null
  const topProducts = report?.top_products?.top_products ?? []
  const voucherUsage = report?.promo_coin_usage?.voucher_usage ?? []
  const coinStats = report?.promo_coin_usage?.coin_stats ?? null

  const salesStats = [
    {
      label: 'Total Penjualan (Selesai)',
      value: summary?.total_sales,
      tag: `${summary?.total_orders ?? 0} Order`,
      detail: `Ongkos kirim: ${formatRupiah(summary?.total_shipping ?? 0)}`,
      tone: 'green',
    },
    {
      label: 'Rata-Rata Nilai Pesanan',
      value: summary?.average_order_value,
      tag: 'AOV',
      detail: `Periode ${from} s/d ${to}`,
      tone: 'blue',
    },
    {
      label: 'Total Subsidi Voucher',
      value: summary?.total_voucher_discount,
      tag: `${voucherUsage.length} Kode`,
      detail: 'Potongan voucher terpakai',
      tone: 'green',
    },
    {
      label: 'Total Potongan Koin',
      value: summary?.total_coin_discount,
      tag: `${coinStats?.coins_redeemed_discount ?? 0} Koin`,
      detail: `Koin beredar: ${coinStats?.net_coins_circulation ?? 0}`,
      tone: 'red',
    },
  ]

  const auditColumns = [
    {
      key: 'created_at',
      label: 'Waktu',
      render: (log) => (
        <span className="reports__withdrawal-id">
          {log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '—'}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Aktor',
      render: (log) => log.user?.name || `User #${log.user_id ?? '-'}`,
    },
    { key: 'module', label: 'Modul' },
    { key: 'action', label: 'Aksi' },
    {
      key: 'record_id',
      label: 'ID Record',
      render: (log) => (log.record_id ? `#${log.record_id}` : '—'),
    },
  ]

  return (
    <div className="reports">
      <header className="reports__page-header">
        <div>
          <h1>Laporan Keuangan, Penjualan &amp; Audit</h1>
          <p>
            Pantau omzet pesanan selesai, produk terlaris, pemakaian promo/koin, dan audit log admin.
          </p>
        </div>
        <div className="reports__header-actions">
          <input
            aria-label="Tanggal mulai"
            onChange={(event) => setFrom(event.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 11 }}
            type="date"
            value={from}
          />
          <input
            aria-label="Tanggal akhir"
            onChange={(event) => setTo(event.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 11 }}
            type="date"
            value={to}
          />
          <select
            aria-label="Pengelompokan periode"
            onChange={(event) => setGroup(event.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 11 }}
            value={group}
          >
            <option value="day">Harian</option>
            <option value="week">Mingguan</option>
            <option value="month">Bulanan</option>
          </select>
          <span className="reports__date">
            <CalendarDays aria-hidden="true" size={13} />
            WIB
          </span>
          <button
            className="reports__withdraw"
            onClick={() => setShowWithdrawModal(true)}
            type="button"
          >
            <ArrowDownToLine aria-hidden="true" size={14} />
            Info Settlement
          </button>
        </div>
      </header>

      {error && (
        <p className="reports__sample-notice" role="alert">
          {error}
        </p>
      )}

      <section className="reports__stats" aria-label="Ringkasan keuangan">
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
              <p>Produk dengan penjualan tertinggi pada periode terpilih</p>
            </div>
            <StatusBadge tone={topProducts.length ? 'green' : 'neutral'}>
              {topProducts.length ? `${topProducts.length} Produk` : 'Kosong'}
            </StatusBadge>
          </header>
          {loading ? (
            <p className="reports__empty">Memuat laporan produk...</p>
          ) : topProducts.length ? (
            <ol className="reports__product-list">
              {topProducts.map((product, index) => (
                <li className="reports__product-row" key={`${product.product_id}-${index}`}>
                  <span className="reports__rank">{index + 1}.</span>
                  <div className="reports__product-copy">
                    <strong>{product.product_name}</strong>
                    <small>
                      Omzet: {formatRupiah(product.total_revenue)} • Satuan:{' '}
                      {product.quantity_unit}
                    </small>
                  </div>
                  <strong className="reports__product-sold">
                    {product.total_quantity} Terjual
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="reports__empty">Belum ada produk terjual pada rentang tanggal ini.</p>
          )}
        </article>

        <article className="reports__panel reports__panel--dead-stock">
          <header className="reports__panel-header">
            <div>
              <h2>Stok Varian Terbatas (&lt;= 25 Unit)</h2>
              <p>Pantauan stok gudang dari modul inventori backend</p>
            </div>
            <StatusBadge tone={lowStock.length ? 'orange' : 'green'}>
              {lowStock.length ? `${lowStock.length} Varian` : 'Aman'}
            </StatusBadge>
          </header>
          {loading ? (
            <p className="reports__empty">Memuat inventori stok...</p>
          ) : lowStock.length ? (
            <ol className="reports__product-list">
              {lowStock.slice(0, 8).map((variant, index) => (
                <li className="reports__product-row" key={variant.id}>
                  <span className="reports__rank">{index + 1}.</span>
                  <div className="reports__product-copy">
                    <strong>{variant.product?.name || variant.name}</strong>
                    <small>
                      Varian: {variant.name} • SKU: {variant.sku || '—'}
                    </small>
                  </div>
                  <span className="reports__dead-stock-summary">
                    <strong>{variant.stock} Tersedia</strong>
                    <small>{formatRupiah(variant.price)}</small>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="reports__empty">Seluruh stok varian mencukupi.</p>
          )}
        </article>
      </section>

      <section className="reports__withdrawals">
        <header className="reports__withdrawals-header">
          <div>
            <h2>Audit Log Aktivitas Admin ({auditLogs.length})</h2>
            <p>Rekaman perubahan konfigurasi, voucher, koin, dan pengiriman terbaru.</p>
          </div>
        </header>
        {auditLogs.length ? (
          <DataTable
            columns={auditColumns}
            label="Audit log aktivitas admin"
            rows={auditLogs}
          />
        ) : (
          <p className="reports__empty">Belum ada entri audit log.</p>
        )}
      </section>

      {showWithdrawModal && (
        <WithdrawModal
          balance={summary?.total_sales ?? 0}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  )
}

export default ReportsPage
