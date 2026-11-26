import {
  BarChart3,
  Clock,
  Image,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Truck,
} from 'lucide-react'

export const MENU = [
  { label: 'Dashboard Overview', to: '/', icon: LayoutDashboard },
  { label: 'Kelola Banner Beranda', to: '/banner', icon: Image },
  { label: 'Katalog & Stok Produk', to: '/produk', icon: Package },
  { label: 'Kelola Kategori', to: '/kategori', icon: LayoutGrid },
  { label: 'Promo & Flash Sale', to: '/promo', icon: Tag },
  { label: 'Pesanan & Kurir', to: '/pesanan', icon: ShoppingBag },
  { label: 'Kelola Ongkir', to: '/ongkir', icon: Truck },
  { label: 'Kelola Jam Kurir', to: '/jam-kurir', icon: Clock },
  { label: 'Kelola Poin', to: '/poin', icon: Star },
  { label: 'Laporan & Keuangan', to: '/laporan', icon: BarChart3 },
  { label: 'Pengaturan Toko', to: '/pengaturan', icon: Settings },
]
