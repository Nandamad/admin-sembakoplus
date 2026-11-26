export const salesStats = [
  {
    label: 'Total Uang Masuk (Omset)',
    value: null,
    tag: 'Belum tersedia',
    detail: 'Menunggu data backend',
    tone: 'green',
  },
  {
    label: 'HPP / Modal Keluaran',
    value: null,
    tag: 'Belum tersedia',
    detail: 'Menunggu data backend',
    tone: 'blue',
  },
  {
    label: 'Laba Bersih Toko (Nett)',
    value: null,
    tag: 'Belum tersedia',
    detail: 'Menunggu data backend',
    tone: 'green',
  },
  {
    label: 'Potensi Rugi / Waste',
    value: null,
    tag: 'Belum tersedia',
    detail: 'Menunggu data backend',
    tone: 'red',
  },
]

export const topProducts = []
export const deadStockProducts = []
export const initialWithdrawals = []

export function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}
