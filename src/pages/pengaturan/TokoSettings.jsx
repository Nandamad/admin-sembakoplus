import { useEffect, useState } from 'react'
import {
  Clock3,
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Save,
  Trash2,
  Truck,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import api, { extractApiError } from '../../services/api.js'
import './TokoSettings.css'

function getJakartaTime() {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
}

function TokoSettings() {
  const [store, setStore] = useState({
    store_name: '',
    store_address: '',
    latitude: '',
    longitude: '',
    timezone: 'Asia/Jakarta',
  })
  const [shippingSetting, setShippingSetting] = useState({
    is_enabled: false,
    maximum_delivery_distance_meters: '',
    routing_provider: '',
  })
  const [support, setSupport] = useState({
    whatsapp_number: '',
    display_name: '',
    opening_hours: '',
    is_active: true,
  })
  const [receipt, setReceipt] = useState({
    invoice_prefix: 'INV',
    paper_width_mm: 58,
    seller_name: 'SembakoPlus',
    seller_address: '',
  })
  const [sysSettings, setSysSettings] = useState({
    'cutoff.time': '11:00',
    'cod.max_amount': 500000,
    'order.auto_complete_hours': 24,
  })

  const [faqs, setFaqs] = useState([])
  const [faqTitle, setFaqTitle] = useState('')
  const [faqContent, setFaqContent] = useState('')
  const [legalDocs, setLegalDocs] = useState([])
  const [legalVersion, setLegalVersion] = useState('')
  const [legalContent, setLegalContent] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  async function reloadContentDocs() {
    const [faqRes, legalRes] = await Promise.all([
      api.get('/admin/help/faqs'),
      api.get('/admin/legal-documents'),
    ])
    setFaqs(faqRes.data?.data ?? [])
    setLegalDocs(legalRes.data?.data ?? [])
  }

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/admin/store-settings'),
      api.get('/admin/shipping-settings'),
      api.get('/admin/support-settings'),
      api.get('/admin/receipt-settings'),
      api.get('/admin/settings'),
      api.get('/admin/help/faqs'),
      api.get('/admin/legal-documents'),
    ])
      .then(([storeRes, shipRes, supRes, recRes, sysRes, faqRes, legalRes]) => {
        if (!active) return
        if (storeRes.data?.data) setStore((prev) => ({ ...prev, ...storeRes.data.data }))
        if (shipRes.data?.data) setShippingSetting((prev) => ({ ...prev, ...shipRes.data.data }))
        if (supRes.data?.data) setSupport((prev) => ({ ...prev, ...supRes.data.data }))
        if (recRes.data?.data) setReceipt((prev) => ({ ...prev, ...recRes.data.data }))
        if (sysRes.data?.data) {
          setSysSettings((prev) => ({
            ...prev,
            'cutoff.time': String(sysRes.data.data['cutoff.time'] ?? prev['cutoff.time']),
            'cod.max_amount': Number(sysRes.data.data['cod.max_amount'] ?? prev['cod.max_amount']),
            'order.auto_complete_hours': Number(sysRes.data.data['order.auto_complete_hours'] ?? prev['order.auto_complete_hours']),
          }))
        }
        setFaqs(faqRes.data?.data ?? [])
        setLegalDocs(legalRes.data?.data ?? [])
      })
      .catch((error) => {
        if (active) setNotice(extractApiError(error, 'Pengaturan toko gagal dimuat.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function saveAllSettings(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setNotice('')
      await Promise.all([
        api.put('/admin/store-settings', {
          store_name: store.store_name,
          store_address: store.store_address || null,
          latitude: Number(store.latitude),
          longitude: Number(store.longitude),
          timezone: store.timezone || 'Asia/Jakarta',
        }),
        api.put('/admin/shipping-settings', {
          is_enabled: Boolean(shippingSetting.is_enabled),
          maximum_delivery_distance_meters: Number(shippingSetting.maximum_delivery_distance_meters),
          routing_provider: shippingSetting.routing_provider,
        }),
        api.put('/admin/support-settings', {
          whatsapp_number: support.whatsapp_number,
          display_name: support.display_name,
          opening_hours: support.opening_hours || null,
          is_active: Boolean(support.is_active),
        }),
        api.put('/admin/receipt-settings', {
          invoice_prefix: receipt.invoice_prefix,
          paper_width_mm: Number(receipt.paper_width_mm),
          seller_name: receipt.seller_name,
          seller_address: receipt.seller_address || null,
        }),
        api.put('/admin/settings', {
          settings: {
            'cutoff.time': sysSettings['cutoff.time'],
            'cod.max_amount': Number(sysSettings['cod.max_amount']),
            'order.auto_complete_hours': Number(sysSettings['order.auto_complete_hours']),
            'store.latitude': Number(store.latitude),
            'store.longitude': Number(store.longitude),
          },
        }),
      ])
      setLastUpdated(getJakartaTime())
      setNotice('Seluruh pengaturan toko, pengiriman, dukungan CS, dan struk tersimpan ke server.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menyimpan pengaturan.'))
    } finally {
      setSaving(false)
    }
  }

  async function addFaq(event) {
    event.preventDefault()
    if (!faqTitle.trim() || !faqContent.trim()) return
    try {
      setNotice('')
      await api.post('/admin/help/faqs', {
        title: faqTitle.trim(),
        content: faqContent.trim(),
        sort_order: faqs.length + 1,
        is_published: true,
      })
      setFaqTitle('')
      setFaqContent('')
      await reloadContentDocs()
      setNotice('Artikel FAQ bantuan berhasil ditambahkan.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menambah artikel FAQ.'))
    }
  }

  async function deleteFaq(id) {
    try {
      setNotice('')
      await api.delete(`/admin/help/faqs/${id}`)
      await reloadContentDocs()
      setNotice('Artikel FAQ berhasil dihapus.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menghapus artikel FAQ.'))
    }
  }

  async function addLegalDocument(event) {
    event.preventDefault()
    if (!legalVersion.trim() || !legalContent.trim()) return
    try {
      setNotice('')
      await api.post('/admin/legal-documents', {
        document_type: 'privacy_policy',
        version: legalVersion.trim(),
        content: `<p>${legalContent.trim()}</p>`,
        is_published: true,
      })
      setLegalVersion('')
      setLegalContent('')
      await reloadContentDocs()
      setNotice('Versi Kebijakan Privasi baru berhasil diterbitkan.')
    } catch (error) {
      setNotice(extractApiError(error, 'Gagal menerbitkan Kebijakan Privasi.'))
    }
  }

  return (
    <div className="store-settings">
      <PageHeader
        title="Pengaturan Operasional Toko, Struk & Konten Bantuan"
        description="Kelola profil toko, koordinat gudang, batas pengiriman, kontak WhatsApp CS, struk thermal, FAQ, dan kebijakan privasi."
      />

      {loading ? (
        <p className="store-settings__notice">Memuat pengaturan toko dari server...</p>
      ) : (
        <>
          <form className="store-settings__grid" onSubmit={saveAllSettings}>
            <section className="store-settings__card">
              <header className="store-settings__card-header">
                <h2>Profil Toko, Lokasi &amp; Dukungan WhatsApp CS</h2>
                <p>Identitas cabang, koordinat asal ongkir, dan kontak resmi CS</p>
              </header>

              <div className="store-settings__fields">
                <label className="store-settings__field">
                  <span>Nama Toko / Cabang Resmi</span>
                  <span className="store-settings__input-wrap">
                    <input
                      maxLength={150}
                      onChange={(event) => setStore({ ...store, store_name: event.target.value })}
                      required
                      value={store.store_name}
                    />
                  </span>
                </label>

                <label className="store-settings__field">
                  <span>Alamat Lengkap Gudang Distribusi</span>
                  <span className="store-settings__input-wrap">
                    <MapPin aria-hidden="true" size={13} />
                    <input
                      maxLength={500}
                      onChange={(event) => setStore({ ...store, store_address: event.target.value })}
                      value={store.store_address || ''}
                    />
                  </span>
                </label>

                <div className="store-settings__amount-row">
                  <label className="store-settings__field">
                    <small>Latitude Gudang</small>
                    <input
                      onChange={(event) => setStore({ ...store, latitude: event.target.value })}
                      required
                      step="0.000001"
                      type="number"
                      value={store.latitude}
                    />
                  </label>
                  <label className="store-settings__field">
                    <small>Longitude Gudang</small>
                    <input
                      onChange={(event) => setStore({ ...store, longitude: event.target.value })}
                      required
                      step="0.000001"
                      type="number"
                      value={store.longitude}
                    />
                  </label>
                </div>

                <label className="store-settings__field">
                  <span>Nomor WhatsApp CS Resmi</span>
                  <span className="store-settings__input-wrap">
                    <Phone aria-hidden="true" size={13} />
                    <input
                      maxLength={30}
                      onChange={(event) => setSupport({ ...support, whatsapp_number: event.target.value })}
                      placeholder="6281234567890"
                      required
                      value={support.whatsapp_number}
                    />
                  </span>
                </label>

                <label className="store-settings__field">
                  <span>Nama Layanan &amp; Jam Layanan CS</span>
                  <div className="store-settings__amount-row">
                    <input
                      onChange={(event) => setSupport({ ...support, display_name: event.target.value })}
                      placeholder="CS SembakoPlus"
                      required
                      value={support.display_name}
                    />
                    <input
                      onChange={(event) => setSupport({ ...support, opening_hours: event.target.value })}
                      placeholder="08:00 - 21:00 WIB"
                      value={support.opening_hours || ''}
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className="store-settings__card">
              <header className="store-settings__card-header">
                <h2>Pengaturan Pengiriman, Cut-Off &amp; COD</h2>
                <p>Konfigurasi jarak maksimum pengiriman, cut-off harian, dan batas COD</p>
              </header>

              <div className="store-settings__fields">
                <label className="store-settings__field">
                  <span>Radius Pengantaran Maksimal (meter)</span>
                  <span className="store-settings__input-wrap">
                    <Truck aria-hidden="true" size={13} />
                    <input
                      min="100"
                      onChange={(event) =>
                        setShippingSetting({
                          ...shippingSetting,
                          maximum_delivery_distance_meters: Number(event.target.value),
                        })
                      }
                      required
                      type="number"
                      value={shippingSetting.maximum_delivery_distance_meters}
                    />
                    <StatusBadge tone={shippingSetting.is_enabled ? 'green' : 'neutral'}>
                      {(shippingSetting.maximum_delivery_distance_meters / 1000).toFixed(1)} KM
                    </StatusBadge>
                  </span>
                </label>

                <label className="store-settings__field">
                  <span>Provider Routing Jarak</span>
                  <select
                    onChange={(event) =>
                      setShippingSetting({ ...shippingSetting, routing_provider: event.target.value })
                    }
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 12 }}
                    value={shippingSetting.routing_provider}
                  >
                    <option value="haversine">Haversine (Lokal/Pengembangan)</option>
                    <option value="osrm">OSRM Self-Hosted (Produksi)</option>
                  </select>
                </label>

                <label className="store-settings__field">
                  <span>Jam Cut-Off Harian (HH:MM)</span>
                  <span className="store-settings__input-wrap">
                    <Clock3 aria-hidden="true" size={13} />
                    <input
                      onChange={(event) =>
                        setSysSettings({ ...sysSettings, 'cutoff.time': event.target.value })
                      }
                      required
                      type="time"
                      value={sysSettings['cutoff.time']}
                    />
                  </span>
                </label>

                <div className="store-settings__amount-row">
                  <label className="store-settings__field">
                    <small>Maksimum COD (Rp)</small>
                    <input
                      min="0"
                      onChange={(event) =>
                        setSysSettings({ ...sysSettings, 'cod.max_amount': Number(event.target.value) })
                      }
                      required
                      type="number"
                      value={sysSettings['cod.max_amount']}
                    />
                  </label>
                  <label className="store-settings__field">
                    <small>Auto-Selesai (Jam)</small>
                    <input
                      min="1"
                      onChange={(event) =>
                        setSysSettings({
                          ...sysSettings,
                          'order.auto_complete_hours': Number(event.target.value),
                        })
                      }
                      required
                      type="number"
                      value={sysSettings['order.auto_complete_hours']}
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="store-settings__card">
              <header className="store-settings__card-header">
                <h2>Pengaturan Struk &amp; Invoice Thermal</h2>
                <p>Header penjual dan ukuran kertas PDF struk thermal 58mm / 80mm</p>
              </header>

              <div className="store-settings__fields">
                <label className="store-settings__field">
                  <span>Prefix Nomor Invoice</span>
                  <span className="store-settings__input-wrap">
                    <Receipt aria-hidden="true" size={13} />
                    <input
                      maxLength={20}
                      onChange={(event) => setReceipt({ ...receipt, invoice_prefix: event.target.value })}
                      required
                      value={receipt.invoice_prefix}
                    />
                  </span>
                </label>

                <label className="store-settings__field">
                  <span>Lebar Kertas Thermal</span>
                  <select
                    onChange={(event) =>
                      setReceipt({ ...receipt, paper_width_mm: Number(event.target.value) })
                    }
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 12 }}
                    value={receipt.paper_width_mm}
                  >
                    <option value={58}>58 mm (Struk Thermal Standar)</option>
                    <option value={80}>80 mm (Struk Thermal Lebar)</option>
                  </select>
                </label>

                <label className="store-settings__field">
                  <span>Nama Penjual pada Struk</span>
                  <span className="store-settings__input-wrap">
                    <Mail aria-hidden="true" size={13} />
                    <input
                      maxLength={150}
                      onChange={(event) => setReceipt({ ...receipt, seller_name: event.target.value })}
                      required
                      value={receipt.seller_name}
                    />
                  </span>
                </label>

                <label className="store-settings__field">
                  <span>Alamat Penjual pada Struk</span>
                  <input
                    maxLength={500}
                    onChange={(event) => setReceipt({ ...receipt, seller_address: event.target.value })}
                    value={receipt.seller_address || ''}
                  />
                </label>
              </div>
            </section>

            <section className="store-settings__card store-settings__sync-card">
              <header className="store-settings__card-header">
                <h2>Simpan &amp; Sinkronkan Konfigurasi</h2>
                <p>Perubahan langsung berlaku pada kalkulasi checkout, ongkir, CS, dan struk PDF.</p>
              </header>

              <button className="store-settings__save" disabled={saving} type="submit">
                <Save aria-hidden="true" size={14} />
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan ke Server'}
              </button>

              {notice && (
                <p className="store-settings__notice" role="status">
                  {notice}
                </p>
              )}

              <p className="store-settings__last-updated">
                {lastUpdated
                  ? `Tersimpan di server pada ${lastUpdated} WIB.`
                  : 'Terhubung langsung ke API admin Laravel.'}
              </p>
            </section>
          </form>

          <section className="store-settings__grid" style={{ marginTop: 18 }}>
            <div className="store-settings__card">
              <header className="store-settings__card-header">
                <h2><HelpCircle size={15} /> Pusat Bantuan FAQ ({faqs.length})</h2>
                <p>Pertanyaan umum yang ditampilkan di aplikasi pelanggan.</p>
              </header>
              <form onSubmit={addFaq} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                <input
                  onChange={(event) => setFaqTitle(event.target.value)}
                  placeholder="Judul pertanyaan FAQ"
                  required
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 11 }}
                  value={faqTitle}
                />
                <input
                  onChange={(event) => setFaqContent(event.target.value)}
                  placeholder="Jawaban lengkap FAQ"
                  required
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 11 }}
                  value={faqContent}
                />
                <button className="store-settings__save" type="submit">
                  <Plus size={14} /> Tambah FAQ
                </button>
              </form>
              <div style={{ display: 'grid', gap: 8 }}>
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: 10,
                      border: '1px solid #e6ebdf',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  >
                    <div>
                      <strong>{faq.title}</strong>
                      <p style={{ margin: '4px 0 0', color: '#6b7765' }}>{faq.content}</p>
                    </div>
                    <button
                      aria-label={`Hapus FAQ ${faq.title}`}
                      onClick={() => deleteFaq(faq.id)}
                      style={{ background: 'none', border: 0, cursor: 'pointer', color: '#c2410c' }}
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="store-settings__card">
              <header className="store-settings__card-header">
                <h2><FileText size={15} /> Dokumen Kebijakan Privasi ({legalDocs.length})</h2>
                <p>Versi kebijakan privasi yang dapat dibaca pelanggan di aplikasi.</p>
              </header>
              <form onSubmit={addLegalDocument} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                <input
                  onChange={(event) => setLegalVersion(event.target.value)}
                  placeholder="Versi baru (contoh: v2.5.0)"
                  required
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 11 }}
                  value={legalVersion}
                />
                <input
                  onChange={(event) => setLegalContent(event.target.value)}
                  placeholder="Ringkasan isi kebijakan privasi..."
                  required
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #d5ddd0', fontSize: 11 }}
                  value={legalContent}
                />
                <button className="store-settings__save" type="submit">
                  <Plus size={14} /> Terbitkan Versi Kebijakan
                </button>
              </form>
              <div style={{ display: 'grid', gap: 8 }}>
                {legalDocs.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 10,
                      border: '1px solid #e6ebdf',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  >
                    <div>
                      <strong>{doc.document_type} • {doc.version}</strong>
                      <div style={{ color: '#6b7765', marginTop: 2 }}>
                        Efektif: {doc.effective_at ? new Date(doc.effective_at).toLocaleDateString('id-ID') : '—'}
                      </div>
                    </div>
                    <StatusBadge tone={doc.is_published ? 'green' : 'neutral'}>
                      {doc.is_published ? 'Terbit' : 'Draft'}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default TokoSettings
