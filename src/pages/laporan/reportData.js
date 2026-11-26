export function formatRupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(value || 0))}`
}

export function getDefaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 29)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}
