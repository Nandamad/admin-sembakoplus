# IMPLEMENTATION PROGRESS — ADMIN SEMBAKOPLUS

Dokumen ini mencatat hasil analisis repository Admin Dashboard (`d:\tempat magang\sembakopelus\admin-sembakoplus`) terhadap spesifikasi `d:\tempat magang\sembakopelus\sembakoplus\Rancangan_Lengkap_Sistem_SembakoPlus_v2.md` (MD v2.4 Bagian 9 & Bagian 10) serta status penyambungan ke backend Laravel `sembakoplus`.

Terakhir diperbarui: **26 November 2026**.

---

## 1. Ringkasan Arsitektur & Konfigurasi

- **Stack**: React 19, Vite 8 (`vite.config.js` berjalan pada port `5174` agar terpisah dari port `5173` Customer/Driver PWA), Lucide React, Recharts, Axios.
- **HTTP Client (`src/services/api.js`)**:
  - `baseURL`: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'` dengan header `Accept: application/json`.
  - Penyimpanan token Sanctum pada `localStorage` (`sembakoplus.admin.token` & `sembakoplus.admin.user`).
  - Auto-handle respons `401 Unauthorized`: menghapus sesi lokal dan mengarahkan ke `/login`.
  - Helper `isAdminUser(user)` membaca array `roles` Spatie (`user.roles.includes('admin')`) maupun fallback `user.role === 'admin'`, serta helper `extractApiError` untuk mengekstrak pesan validasi `422` Laravel.
- **Sinkronisasi Backend Laravel (`sembakoplus`)**:
  - `config/cors.php` menambahkan default origin `http://localhost:5174,http://127.0.0.1:5174`.
  - `StoreCategoryRequest`, `UpdateCategoryRequest`, `CategoryResource` mendukung field `description`, serta `AdminCategoryController::uniqueSlug` memakai `Category::withTrashed()` untuk menghindari duplikasi `slug` saat membuat ulang kategori yang pernah dihapus lunak.
  - `AdminOrderController::index` memuat relasi `courierAssignments.courier` dan mendukung `per_page` (`1..100`), diekspos sebagai `courier_assignment` pada `OrderResource`.

---

## 2. Status Integrasi Per Modul Admin

| Rute & File UI | Cakupan MD v2.4 | Endpoint Laravel Terhubung | Status |
|---|---|---|---|
| `/login` (`src/pages/auth/AdminLogin.jsx`, `src/App.jsx`, `src/components/SidebarProfile.jsx`) | Auth admin & guard role `admin` | `POST /auth/login`, `GET /profile`, `POST /auth/logout` | ✅ Terhubung & terverifikasi (array `roles` Spatie) |
| `/` (`src/pages/dashboard/Dashboard.jsx`, `SalesChart.jsx`, `RecentOrders.jsx`, `ContentStatus.jsx`) | Ringkasan dashboard operasional & tren 7 hari | `GET /admin/dashboard`, `GET /admin/reports/sales`, `GET /admin/orders?per_page=5`, `GET /admin/banners`, `GET /admin/vouchers`, `GET /admin/products?per_page=1` | ✅ Terhubung & terverifikasi |
| `/banner` (`src/pages/banner/BannerList.jsx`, `BannerForm.jsx`) | Banner beranda & unggah gambar | `GET/POST/DELETE /admin/banners`, `POST /admin/banners/{id}` (`_method=PATCH` multipart) | ✅ Terhubung |
| `/kategori` (`src/pages/kategori/CategoryManagement.jsx`, `CategoryFormModal.jsx`) | Kategori produk (`name`, `description`, `sort_order`, `is_active`) | `GET/POST/PATCH/DELETE /admin/categories` | ✅ Terhubung & CRUD MySQL diverifikasi |
| `/produk` (`src/pages/produk/ProdukList.jsx`, `ProductFormModal.jsx`) | Katalog produk, harga coret/diskon, stok varian | `GET/POST/DELETE /admin/products`, `POST /admin/products/{id}` (`_method=PATCH` multipart), `GET /admin/categories`, `GET/POST/DELETE /admin/discounts`, `POST /admin/product-variants/{id}/stock` | ✅ Terhubung |
| `/promo` (`src/pages/promo/PromoList.jsx`, `PromoForm.jsx`, `FlashSalePanel.jsx`) | Promo voucher, aturan distribusi, assign customer & diskon produk | `GET/POST/PATCH/DELETE /admin/vouchers`, `POST/DELETE /admin/vouchers/{id}/distribution-rules`, `POST /admin/vouchers/{id}/assign-customers`, `GET /admin/users?role=customer`, `GET /admin/voucher-usages`, `GET/POST/DELETE /admin/discounts` | ✅ Terhubung |
| `/pesanan` (`src/pages/orders/OrdersList.jsx`, `OrderDetailModal.jsx`, `ordersData.js`) | Daftar pesanan, detail, assign kurir, ubah status, konfirmasi bayar, verifikasi struk, foto bukti & cetak struk gudang | `GET /admin/orders`, `GET /admin/orders/{id}`, `GET /admin/couriers`, `POST /admin/orders/{id}/assign-courier`, `PATCH /admin/orders/{id}/status`, `POST /admin/orders/{id}/payment/confirm`, `GET /admin/receipts/{invoiceNumber}/verify` | ✅ Terhubung |
| `/ongkir` (`src/pages/ongkir/ShippingZones.jsx`, `ShippingZoneFormModal.jsx`) | Tarif bertingkat KM/meter & aturan gratis ongkir | `GET /admin/shipping-settings`, `GET /admin/shipping-rate-types`, `GET/POST/PATCH/DELETE /admin/shipping-rates`, `GET/POST/DELETE /admin/free-shipping-rules` | ✅ Terhubung |
| `/jam-kurir` (`src/pages/jam-kurir/CourierSchedule.jsx`, `CourierSlotFormModal.jsx`) | Slot jadwal antar bertanggal (`after:today`), kuota & manajemen akun kurir | `GET/POST/PATCH/DELETE /admin/delivery-schedules`, `GET /admin/settings`, `GET /admin/couriers`, `POST /admin/users`, `PATCH /admin/users/{id}` | ✅ Terhubung |
| `/poin` (`src/pages/poin/PointsRewards.jsx`, `RewardFormModal.jsx`) | Katalog reward, pengaturan koin, riwayat & grant koin customer | `GET/POST/PATCH/DELETE /admin/rewards`, `GET/PUT /admin/coin-settings`, `GET /admin/coin-transactions`, `POST /admin/customers/{id}/coins/grant` | ✅ Terhubung |
| `/laporan` (`src/pages/laporan/ReportsPage.jsx`, `WithdrawModal.jsx`, `reportData.js`) | Laporan penjualan, produk terlaris, pemakaian promo/koin, stok & audit log | `GET /admin/reports`, `GET /admin/inventory`, `GET /admin/audit-logs` | ✅ Terhubung (`WithdrawModal` bersifat informasional — settlement di luar API v2.4) |
| `/pengaturan` (`src/pages/pengaturan/TokoSettings.jsx`) | Pengaturan toko, pengiriman, support WhatsApp, struk, FAQ & dokumen legal | `GET/PUT /admin/store-settings`, `/admin/shipping-settings`, `/admin/support-settings`, `/admin/receipt-settings`, `/admin/settings`, `GET/POST/DELETE /admin/help/faqs`, `GET/POST /admin/legal-documents` | ✅ Terhubung |

---

## 3. Hasil Verifikasi (26 November 2026)

1. **ESLint (`admin-sembakoplus`)**: `npm run lint` (`eslint .`) — **PASS** (`0 errors, 0 warnings`).
2. **Production Build (`admin-sembakoplus`)**: `npm run build` (`vite build`) — **PASS** (`2889 modules transformed`, selesai dalam `411ms`).
3. **Backend Code Style & Test (`sembakoplus`)**:
   - `.\vendor\bin\pint --dirty --format agent` — **PASS**.
   - `php artisan test` — **111 passed, 719 assertions, 0 failed** (`8933 ms`).
4. **Live HTTP E2E Smoke Test (`http://127.0.0.1:8000/api/v1` -> MySQL `sembakoplus_v2`)**:
   - CORS Preflight (`Origin: http://localhost:5174`): `204` (`Access-Control-Allow-Origin: http://localhost:5174`).
   - Auth login admin (`admin@sembakogo.id`): `roles: ["admin"]`; login non-admin (`budi@sembakogo.id`): `roles: ["customer"]` (`has_admin=False`).
   - CRUD `POST/PATCH/DELETE /admin/categories` termasuk field `description` & slug reuse guard pasca soft-delete: **OK**.
   - `GET /admin/orders?per_page=10`: mengembalikan `5` pesanan dengan field `courier_assignment` aktif pada pesanan terkait, serta `GET /admin/orders/{id}` memuat detail item.
   - Seluruh 28 endpoint `GET` (`/profile`, `/admin/dashboard`, `/admin/banners`, `/admin/categories`, `/admin/products`, `/admin/discounts`, `/admin/vouchers`, `/admin/voucher-usages`, `/admin/couriers`, `/admin/users?role=customer`, `/admin/shipping-settings`, `/admin/shipping-rate-types`, `/admin/shipping-rates`, `/admin/free-shipping-rules`, `/admin/delivery-schedules`, `/admin/settings`, `/admin/rewards`, `/admin/coin-settings`, `/admin/coin-transactions`, `/admin/reports`, `/admin/reports/sales`, `/admin/inventory`, `/admin/store-settings`, `/admin/support-settings`, `/admin/receipt-settings`, `/admin/help/faqs`, `/admin/legal-documents`, `/admin/audit-logs`) merespons **200 OK**.

---

## 4. Batasan & Prasyarat Lingkungan

- **Pencairan Dana (`WithdrawModal.jsx`)**: MD v2.4 tidak menyediakan endpoint settlement/withdraw dana di API backend (settlement dilakukan lewat dashboard payment gateway Midtrans / rekening bank operasional). Modal menampilkan catatan batas cakupan tersebut secara eksplisit tanpa simulasi transaksi palsu.
- **Layanan Eksternal Produksi**: Sebelum go-live, pastikan konfigurasi backend produksi mengisi `ROUTING_PROVIDER=osrm` + `OSRM_BASE_URL`, kunci `MIDTRANS_*`, dan `VITE_API_BASE_URL` di build frontend admin mengarah ke host API HTTPS produksi.
