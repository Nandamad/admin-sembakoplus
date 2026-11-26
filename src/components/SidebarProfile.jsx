import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

function SidebarProfile() {
  return (
    <div className="sidebar-profile">
      <span className="sidebar-profile__avatar">AD</span>
      <span className="sidebar-profile__details">
        <strong>Admin</strong>
        <small>Profil belum tersedia</small>
      </span>
      <Link
        aria-label="Kembali ke halaman login"
        className="sidebar-profile__logout"
        title="Halaman login"
        to="/login"
      >
        <LogOut aria-hidden="true" size={16} />
      </Link>
    </div>
  )
}

export default SidebarProfile
