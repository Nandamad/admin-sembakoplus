import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api, {
  ADMIN_PROFILE_EVENT,
  clearAdminSession,
  getStoredAdminUser,
} from '../services/api.js'

function getInitials(name) {
  if (!name) return 'AD'
  const parts = String(name).trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function SidebarProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredAdminUser)

  useEffect(() => {
    const sync = () => setUser(getStoredAdminUser())
    window.addEventListener(ADMIN_PROFILE_EVENT, sync)
    return () => window.removeEventListener(ADMIN_PROFILE_EVENT, sync)
  }, [])

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore logout network error when clearing session
    } finally {
      clearAdminSession()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="sidebar-profile">
      <span className="sidebar-profile__avatar">{getInitials(user?.name)}</span>
      <span className="sidebar-profile__details">
        <strong>{user?.name || 'Administrator'}</strong>
        <small>{user?.email || 'Sesi aktif'}</small>
      </span>
      <button
        aria-label="Keluar dari sesi admin"
        className="sidebar-profile__logout"
        onClick={handleLogout}
        title="Keluar"
        type="button"
      >
        <LogOut aria-hidden="true" size={16} />
      </button>
    </div>
  )
}

export default SidebarProfile
