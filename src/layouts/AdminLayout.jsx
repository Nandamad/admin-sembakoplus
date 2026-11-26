import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import './AdminLayout.css'

function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
