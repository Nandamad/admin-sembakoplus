import { NavLink } from 'react-router-dom'
import { MENU } from '../layouts/menu.js'
import SidebarProfile from './SidebarProfile.jsx'
import './Sidebar.css'

function Sidebar() {
  return (
    <aside className="sidebar">
      <a
        className="sidebar__brand"
        href="/"
        aria-label="SembakoPlus Admin"
      >
        <img src="/Mobile_Logo_Image.svg" alt="" />
        <span>
          <strong>SembakoPlus</strong>
          <small>Admin Operations</small>
        </span>
      </a>

      <nav className="sidebar__nav" aria-label="Menu admin">
        {MENU.map(({ icon: Icon, label, to }) => (
          <NavLink
            className={({ isActive }) =>
              `sidebar__item${isActive ? ' sidebar__item--active' : ''}`
            }
            end={to === '/'}
            key={to}
            to={to}
          >
            <Icon aria-hidden="true" size={16} strokeWidth={1.9} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <SidebarProfile />
        <p className="sidebar__version">SembakoPlus Admin v1.0 · Stabil</p>
      </div>
    </aside>
  )
}

export default Sidebar
