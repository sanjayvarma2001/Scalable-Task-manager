import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        detail.forEach(d => toast.error(d.message || d.msg))
      } else {
        toast.error(detail || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={authLayout}>
      <div style={authCard} className="fade-in">
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'DM Mono', marginBottom: '6px' }}>TaskAPI</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Create your account</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="field">
            <label>Full Name</label>
            <input className="input" placeholder="John Doe"
              value={form.full_name} onChange={e => set('full_name', e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 digit"
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: '6px' }}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const authLayout = {
  minHeight: '100vh', display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '20px',
  background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.08) 0%, var(--bg) 60%)',
}
const authCard = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '400px',
  boxShadow: 'var(--shadow)',
}