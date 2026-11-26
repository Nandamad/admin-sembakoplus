export const orderTabs = [
  { key: 'all', label: 'Semua' },
  { key: 'created', label: 'Perlu Diproses' },
  { key: 'processing', label: 'Diproses' },
  { key: 'delivering', label: 'Dikirim' },
  { key: 'arrived', label: 'Tiba' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
]

export const ORDER_STATUS_META = {
  created: { label: 'Menunggu Proses', tone: 'orange' },
  processing: { label: 'Diproses / Siap Antar', tone: 'blue' },
  scheduled_tomorrow: { label: 'Jadwal Besok', tone: 'blue' },
  delivering: { label: 'Sedang Diantar', tone: 'green' },
  arrived: { label: 'Tiba di Tujuan', tone: 'green' },
  completed: { label: 'Selesai', tone: 'green' },
  cancelled: { label: 'Dibatalkan', tone: 'red' },
  failed_delivery: { label: 'Pengantaran Gagal', tone: 'red' },
}

export function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value || 0))}`
}

export function formatOrderDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
