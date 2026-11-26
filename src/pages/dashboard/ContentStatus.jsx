import StatusBadge from '../../components/StatusBadge.jsx'
import './ContentStatus.css'

function ContentStatus({ summary, loading = false }) {
  const items = summary
    ? [
        {
          title: 'Hero Banner Beranda Mobile',
          desc: `${summary.activeBanners} aktif dari ${summary.totalBanners} banner terdaftar`,
          tone: summary.activeBanners > 0 ? 'green' : 'neutral',
          badge: summary.activeBanners > 0 ? 'Aktif' : 'Kosong',
        },
        {
          title: 'Katalog Produk & Varian',
          desc: `${summary.totalProducts} produk aktif tersedia di katalog`,
          tone: summary.totalProducts > 0 ? 'green' : 'neutral',
          badge: `${summary.totalProducts} SKU`,
        },
        {
          title: 'Voucher Promo Pelanggan',
          desc: `${summary.activeVouchers} voucher aktif dapat diklaim`,
          tone: summary.activeVouchers > 0 ? 'blue' : 'neutral',
          badge: `${summary.activeVouchers} Aktif`,
        },
        {
          title: 'Antrean Pengolahan & Kurir',
          desc: `${summary.pendingOrders} perlu diproses • ${summary.deliveringOrders} diantar`,
          tone: summary.pendingOrders > 0 ? 'orange' : 'green',
          badge: summary.pendingOrders > 0 ? 'Perlu Aksi' : 'Terkendali',
        },
      ]
    : []

  return (
    <section className="dashboard__panel content-status">
      <div className="dashboard__panel-header">
        <h2 className="dashboard__panel-title">Status Konten &amp; Operasional</h2>
      </div>
      <div className="content-status__list">
        {loading ? (
          <p className="content-status__empty">Memuat status konten...</p>
        ) : items.length ? (
          items.map((item) => (
            <article className="content-status__item" key={item.title}>
              <div className="content-status__copy">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
              <StatusBadge tone={item.tone}>{item.badge}</StatusBadge>
            </article>
          ))
        ) : (
          <p className="content-status__empty">Status konten belum tersedia.</p>
        )}
      </div>
    </section>
  )
}

export default ContentStatus
