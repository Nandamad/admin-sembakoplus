export const couriers = []

export const initialOrders = []

export const orderTabs = [
  { key: 'all', label: 'Semua' },
  { key: 'Perlu Diproses', label: 'Perlu Diproses' },
  { key: 'Sedang Dipacking', label: 'Sedang Dipacking' },
  { key: 'Sedang Dikirim', label: 'Sedang Dikirim' },
  { key: 'Pesanan Selesai', label: 'Selesai' },
]

export function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

export function getCourierName(courierId) {
  return couriers.find((courier) => courier.id === courierId)?.name || ''
}
