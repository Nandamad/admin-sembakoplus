import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import api, { extractApiError } from '../../services/api.js'
import './FlashSalePanel.css'

function FlashSalePanel() {
  const [discounts, setDiscounts] = useState([])
  const [variants, setVariants] = useState([])
  const [variantId, setVariantId] = useState('')
  const [discountType, setDiscountType] = useState('percent')
  const [value, setValue] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  async function reloadDiscounts() {
    const { data } = await api.get('/admin/discounts')
    setDiscounts(data?.data ?? [])
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/discounts'),
      api.get('/admin/products', { params: { per_page: 50 } }),
    ])
      .then(([discRes, prodRes]) => {
        if (!active) return
        setDiscounts(discRes.data?.data ?? [])
        const flatVariants = (prodRes.data?.data ?? []).flatMap((product) =>
          (product.variants ?? []).map((variant) => ({
            id: variant.id,
            label: `${product.name} (${variant.name}) — Rp ${Number(variant.price).toLocaleString('id-ID')}`,
          })),
        )
        setVariants(flatVariants)
        if (flatVariants[0]) setVariantId(String(flatVariants[0].id))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  async function addDiscount(event) {
    event.preventDefault()
    if (!variantId || !value) return
    try {
      setSaving(true)
      setNotice('')
      await api.post('/admin/discounts', {
        product_variant_id: Number(variantId),
        type: discountType,
        value: Number(value),
        starts_at: new Date(Date.now() - 60000).toISOString(),
        ends_at: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
        is_active: true,
      })
      setValue('')
      await reloadDiscounts()
      setNotice('Diskon produk berhasil ditambahkan.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menambahkan diskon produk.'))
    } finally {
      setSaving(false)
    }
  }

  async function removeDiscount(id) {
    try {
      setNotice('')
      await api.delete(`/admin/discounts/${id}`)
      await reloadDiscounts()
      setNotice('Diskon produk dihapus.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menghapus diskon produk.'))
    }
  }

  return (
    <section className="flash-sale">
      <header className="flash-sale__header">
        <div>
          <h2>Daftar Diskon Produk Aktif (Halaman Promo Mobile)</h2>
          <p>
            Kelola potongan harga per varian produk yang otomatis tampil di tab Promo aplikasi pelanggan.
          </p>
        </div>
      </header>

      <form
        onSubmit={addDiscount}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px',
          alignItems: 'center',
        }}
      >
        <select
          aria-label="Pilih varian produk"
          onChange={(event) => setVariantId(event.target.value)}
          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11, flex: '1 1 240px' }}
          value={variantId}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={String(variant.id)}>
              {variant.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Tipe diskon"
          onChange={(event) => setDiscountType(event.target.value)}
          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11 }}
          value={discountType}
        >
          <option value="percent">Persen (%)</option>
          <option value="fixed">Potongan (Rp)</option>
        </select>
        <input
          min="1"
          onChange={(event) => setValue(event.target.value)}
          placeholder={discountType === 'percent' ? 'Nilai %' : 'Potongan Rp'}
          required
          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d7ded0', fontSize: 11, width: 110 }}
          type="number"
          value={value}
        />
        <button className="promos__add" disabled={saving || !variants.length} type="submit">
          <Plus aria-hidden="true" size={14} />
          {saving ? 'Menyimpan...' : 'Tambah Diskon'}
        </button>
      </form>

      {notice && (
        <p className="promos__notice" role="status">
          {notice}
        </p>
      )}

      <div className="flash-sale__grid">
        {discounts.length ? (
          discounts.map((item) => (
            <article className="flash-sale__item" key={item.id}>
              <div className="flash-sale__details" style={{ width: '100%' }}>
                <div className="flash-sale__price-row">
                  <span className="flash-sale__discount">
                    {item.type === 'percent'
                      ? `Diskon ${item.value}%`
                      : `Hemat Rp ${Number(item.value).toLocaleString('id-ID')}`}
                  </span>
                  <button
                    aria-label={`Hapus diskon ${item.product_name}`}
                    onClick={() => removeDiscount(item.id)}
                    style={{ background: 'none', border: 0, cursor: 'pointer', color: '#c2410c' }}
                    title="Hapus diskon"
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3>{item.product_name || `Varian #${item.product_variant_id}`}</h3>
                <p>
                  {new Date(item.starts_at).toLocaleDateString('id-ID')} –{' '}
                  {new Date(item.ends_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="flash-sale__empty">Belum ada diskon produk aktif.</p>
        )}
      </div>
    </section>
  )
}

export default FlashSalePanel
