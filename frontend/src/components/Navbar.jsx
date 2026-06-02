import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logoutUser()
    toast.success('Logged out')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', height: '56px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'DM Mono' }}>TaskAPI</span>
        </Link>
        <div style={{ display: 'flex', gap: '4px' }}>
          <NavLink to="/dashboard" active={isActive('/dashboard')}>Tasks</NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" active={isActive('/admin')}>Admin</NavLink>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {user?.email}
        </span>
        <span className={`badge badge-${user?.role}`}>{user?.role}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      padding: '5px 12px', borderRadius: '6px', textDecoration: 'none',
      fontSize: '14px', fontWeight: '500', transition: 'all 0.15s',
      background: active ? 'var(--accent-dim)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-dim)',
    }}>{children}</Link>
  )
}