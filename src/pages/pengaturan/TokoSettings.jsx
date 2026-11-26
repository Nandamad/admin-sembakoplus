import { useState } from 'react'
import {
  Banknote,
  Clock3,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Save,
  Truck,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import './TokoSettings.css'

const initialSettings = {
  storeName: '',
  warehouseAddress: '',
  whatsapp: '',
  email: '',
  isOpen: null,
  openTime: '',
  closeTime: '',
  minSpend: '',
  shippingFee: '',
  deliveryRadius: '',
}

function getJakartaTime() {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
}

function TokoSettings() {
  const [settings, setSettings] = useState(initialSettings)
  const [notice, setNotice] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setSettings((current) => ({ ...current, [name]: value }))
    setNotice('')
  }

  function toggleStoreStatus() {
    setSettings((current) => ({
      ...current,
      isOpen: current.isOpen === null ? true : !current.isOpen,
    }))
    setNotice('')
  }

  function saveSettings(event) {
    event.preventDefault()

    if (settings.closeTime <= settings.openTime) {
      setNotice('Jam tutup harus setelah jam buka.')
      return
    }

    setLastUpdated(getJakartaTime())
    setNotice(
      'Pengaturan diperbarui pada tampilan ini saja. Belum disimpan ke server.',
    )
  }

  return (
    <div className="store-settings">
      <PageHeader
        title="Pengaturan Operasional Toko"
        description="Kelola profil cabang, jam buka, batasan kurir toko, dan metode pembayaran."
      />

      <form className="store-settings__grid" onSubmit={saveSettings}>
        <section className="store-settings__card">
          <header className="store-settings__card-header">
            <h2>Profil Toko &amp; Lokasi Gudang</h2>
            <p>Identitas cabang resmi dan titik distribusi sembako</p>
          </header>

          <div className="store-settings__fields">
            <label className="store-settings__field">
              <span>Nama Toko / Cabang Resmi</span>
              <span className="store-settings__input-wrap">
                <input
                  maxLength={80}
                  name="storeName"
                  onChange={updateField}
                  required
                  value={settings.storeName}
                />
                <StatusBadge tone="neutral">Belum diverifikasi</StatusBadge>
              </span>
            </label>

            <label className="store-settings__field">
              <span>Alamat Lengkap Gudang Distribusi</span>
              <span className="store-settings__input-wrap">
                <MapPin aria-hidden="true" size={13} />
                <input
                  maxLength={160}
                  name="warehouseAddress"
                  onChange={updateField}
                  required
                  value={settings.warehouseAddress}
                />
              </span>
            </label>

            <label className="store-settings__field">
              <span>WhatsApp &amp; Customer Service</span>
              <span className="store-settings__input-wrap">
                <Phone aria-hidden="true" size={13} />
                <input
                  maxLength={24}
                  name="whatsapp"
                  onChange={updateField}
                  required
                  value={settings.whatsapp}
                />
              </span>
            </label>

            <label className="store-settings__field">
              <span>Email Operasional Resmi</span>
              <span className="store-settings__input-wrap">
                <Mail aria-hidden="true" size={13} />
                <input
                  maxLength={100}
                  name="email"
                  onChange={updateField}
                  required
                  type="email"
                  value={settings.email}
                />
              </span>
            </label>
          </div>
        </section>

        <section className="store-settings__card">
          <header className="store-settings__card-header">
            <h2>Jam Operasional &amp; Kurir Toko</h2>
            <p>Konfigurasi waktu buka toko dan batasan armada pengantaran</p>
          </header>

          <div className="store-settings__fields">
            <div className="store-settings__field">
              <span>Status Operasional Toko</span>
              <button
                aria-pressed={settings.isOpen === true}
                className="store-settings__status-control"
                onClick={toggleStoreStatus}
                type="button"
              >
                <span>
                  {settings.isOpen === null
                    ? 'Status toko belum diatur'
                    : settings.isOpen
                      ? 'Toko Buka (Menerima Pesanan & Dispatch)'
                      : 'Toko Tutup (Tidak Menerima Pesanan)'}
                </span>
                <StatusBadge
                  tone={settings.isOpen === true ? 'green' : 'neutral'}
                >
                  {settings.isOpen === null
                    ? 'Belum diatur'
                    : settings.isOpen
                      ? 'Aktif'
                      : 'Tutup'}
                </StatusBadge>
              </button>
            </div>

            <fieldset className="store-settings__field store-settings__field--plain">
              <legend>Jam Buka &amp; Penutupan Pesanan</legend>
              <div className="store-settings__time-row">
                <Clock3 aria-hidden="true" size={13} />
                <input
                  aria-label="Jam buka toko"
                  name="openTime"
                  onChange={updateField}
                  required
                  type="time"
                  value={settings.openTime}
                />
                <span>sampai</span>
                <input
                  aria-label="Jam tutup toko"
                  name="closeTime"
                  onChange={updateField}
                  required
                  type="time"
                  value={settings.closeTime}
                />
                <small>Hari operasional belum diatur</small>
              </div>
            </fieldset>

            <div className="store-settings__field">
              <span>Minimal Belanja &amp; Ongkos Kirim</span>
              <div className="store-settings__amount-row">
                <label>
                  <small>Min. Belanja</small>
                  <span className="store-settings__amount-input">
                    <span>Rp</span>
                    <input
                      min="0"
                      name="minSpend"
                      onChange={updateField}
                      required
                      type="number"
                      value={settings.minSpend}
                    />
                  </span>
                </label>
                <label>
                  <small>Ongkir Flat</small>
                  <span className="store-settings__amount-input">
                    <span>Rp</span>
                    <input
                      min="0"
                      name="shippingFee"
                      onChange={updateField}
                      required
                      type="number"
                      value={settings.shippingFee}
                    />
                  </span>
                </label>
              </div>
            </div>

            <label className="store-settings__field">
              <span>Radius Pengantaran Maksimal</span>
              <span className="store-settings__input-wrap">
                <Truck aria-hidden="true" size={13} />
                <input
                  min="1"
                  name="deliveryRadius"
                  onChange={updateField}
                  required
                  type="number"
                  value={settings.deliveryRadius}
                />
                <span className="store-settings__suffix">km dari gudang</span>
                <StatusBadge tone="neutral">Belum diatur</StatusBadge>
              </span>
            </label>
          </div>
        </section>

        <section className="store-settings__card">
          <header className="store-settings__card-header">
            <h2>Metode Pembayaran Toko</h2>
            <p>Dukungan transaksi buyer di tempat dan pembayaran digital</p>
          </header>

          <div className="store-settings__payments">
            <article className="store-settings__payment">
              <span className="store-settings__payment-icon">
                <Banknote aria-hidden="true" size={16} />
              </span>
              <div>
                <strong>Bayar di Tempat / COD (Tunai)</strong>
                <p>
                Status metode pembayaran akan dimuat dari backend.
                </p>
              </div>
              <StatusBadge tone="neutral">Belum diatur</StatusBadge>
            </article>

            <article className="store-settings__payment">
              <span className="store-settings__payment-icon">
                <QrCode aria-hidden="true" size={16} />
              </span>
              <div>
                <strong>QRIS Instan</strong>
                <p>
                  Informasi konfigurasi QRIS akan dimuat dari backend.
                </p>
              </div>
              <StatusBadge tone="neutral">Belum diatur</StatusBadge>
            </article>
          </div>

          <p className="store-settings__policy">
            Status dan konfigurasi metode pembayaran belum tersedia.
          </p>
        </section>

        <section className="store-settings__card store-settings__sync-card">
          <header className="store-settings__card-header">
            <h2>Sinkronisasi &amp; Simpan Perubahan</h2>
            <p>Pengaturan toko akan terhubung ke aplikasi mobile setelah backend tersedia.</p>
          </header>

          <div className="store-settings__sync-info">
            <strong>
              <Clock3 aria-hidden="true" size={13} />
              Sinkronisasi menunggu backend
            </strong>
            <p>
              Setelah integrasi backend, perubahan jam buka, ongkos kirim, dan
              status operasional akan diperbarui di aplikasi mobile pelanggan.
            </p>
          </div>

          <button className="store-settings__save" type="submit">
            <Save aria-hidden="true" size={14} />
            Simpan Perubahan Pengaturan Toko
          </button>

          {notice && (
            <p
              className={`store-settings__notice${
                notice.startsWith('Jam tutup')
                  ? ' store-settings__notice--error'
                  : ''
              }`}
              role="status"
            >
              {notice}
            </p>
          )}

          <p className="store-settings__last-updated">
            {lastUpdated
              ? `Perubahan lokal diperbarui hari ini, ${lastUpdated} WIB. Belum tersimpan ke server.`
              : 'Belum ada pengaturan tersimpan dari backend.'}
          </p>
        </section>
      </form>
    </div>
  )
}

export default TokoSettings
