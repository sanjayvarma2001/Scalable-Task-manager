import { useState, useEffect, useCallback } from 'react'
import { getUsers, updateRole, toggleActive, deleteUser } from '../api/admin'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Admin() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getUsers({ page, page_size: pageSize })
      setUsers(data.users)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleChange = async (id, role) => {
    try {
      await updateRole(id, role)
      toast.success('Role updated')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update role')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await toggleActive(id)
      toast.success('User status updated')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  const handleDelete = async (id, email) => {
    if (!confirm(`Delete user ${email}? This will also delete all their tasks.`)) return
    try {
      await deleteUser(id)
      toast.success('User deleted')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600' }}>User Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>{total} registered user{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Total Users" value={total} />
        <StatCard label="Admins" value={users.filter(u => u.role === 'admin').length} accent />
        <StatCard label="Active" value={users.filter(u => u.is_active).length} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <span className="spinner" style={{ width: '28px', height: '28px' }} />
        </div>
      ) : users.length === 0 ? (
        <div className="empty"><div className="empty-icon">👥</div><p>No users found.</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px',
                    fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u.id === me?.id
                return (
                  <tr key={u.id} style={{
                    borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isSelf ? 'rgba(79,142,247,0.04)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => !isSelf && (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => e.currentTarget.style.background = isSelf ? 'rgba(79,142,247,0.04)' : 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {u.full_name || '—'}
                        {isSelf && <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--accent)' }}>(you)</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isSelf ? (
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)',
                            borderRadius: '6px', padding: '4px 8px', color: 'var(--text)',
                            fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '12px', fontWeight: '500',
                        color: u.is_active ? 'var(--success)' : 'var(--danger)',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%',
                          background: u.is_active ? 'var(--success)' : 'var(--danger)' }} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'DM Mono' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isSelf ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(u.id)}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.email)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
      <div style={{ fontSize: '26px', fontWeight: '700', color: accent ? 'var(--accent)' : 'var(--text)', fontFamily: 'DM Mono' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
    </div>
  )
}