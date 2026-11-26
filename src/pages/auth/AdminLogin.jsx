import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import api, {
  clearAdminSession,
  extractApiError,
  getAdminToken,
  isAdminUser,
  saveAdminSession,
} from '../../services/api.js'
import './AdminLogin.css'

function GroceryIllustration() {
  return (
    <svg
      className="admin-login__illustration"
      viewBox="0 0 240 240"
      role="img"
      aria-label="Ilustrasi tas belanja berisi sayuran"
    >
      <circle cx="120" cy="120" r="112" fill="#dcebd2" />
      <path d="M66 107h108v73a12 12 0 0 1-12 12H78a12 12 0 0 1-12-12z" fill="#d9b477" />
      <path d="M66 107h108v21H66z" fill="#c69b5d" />
      <path d="M84 109V87a27 27 0 0 1 54 0v22h-10V87a17 17 0 0 0-34 0v22z" fill="#8b663a" />
      <path d="M84 107V88a27 27 0 0 1 54 0v19h-9V88a18 18 0 0 0-36 0v19z" fill="#f3d9a5" />
      <path d="M95 105V89a18 18 0 0 1 36 0v16h-5V89a13 13 0 0 0-26 0v16z" fill="#5c8d38" />
      <path d="M70 105c-8-15-17-31-16-47 1-8 7-11 13-5 7 9 10 29 18 52z" fill="#f07835" />
      <path d="M61 53c-2-8-2-13 0-18m7 20c4-7 7-11 12-14" fill="none" stroke="#5d9c3d" strokeLinecap="round" strokeWidth="3" />
      <path d="M129 107c-8-20 1-40 20-40 14 0 23 11 22 25-1 8-7 14-13 15z" fill="#448c34" />
      <path d="M143 106c-2-17 8-29 22-27 12 2 17 12 15 24-1 6-5 10-10 11z" fill="#75a83e" />
      <path d="M169 105c8-12 20-11 23-3 3 8-3 18-13 22h-10z" fill="#e84b37" />
      <path d="M105 150a15 15 0 0 1 30 0v9h-30z" fill="#699b35" />
      <circle cx="120" cy="170" r="10" fill="#699b35" />
    </svg>
  )
}

function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  if (getAdminToken()) {
    return <Navigate replace to="/" />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatusMessage('')
    setSubmitting(true)

    try {
      const response = await api.post('/auth/login', {
        identifier: email.trim(),
        password,
      })
      const token = response.data?.data?.token
      const user = response.data?.data?.user

      if (!token || !isAdminUser(user)) {
        if (token) {
          await api
            .post(
              '/auth/logout',
              {},
              { headers: { Authorization: `Bearer ${token}` } },
            )
            .catch(() => {})
        }
        clearAdminSession()
        setStatusMessage('Akun ini tidak memiliki hak akses Administrator.')
        return
      }

      saveAdminSession(token, user)
      navigate('/', { replace: true })
    } catch (error) {
      setStatusMessage(
        extractApiError(error, 'Email atau kata sandi administrator salah.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login">
      <aside className="admin-login__brand-panel">
        <a className="admin-login__brand" href="/" aria-label="SembakoPlus Admin">
          <img
            className="admin-login__brand-logo"
            src="/Mobile_Logo_Image.svg"
            alt=""
          />
          <span className="admin-login__brand-copy">
            <strong>SembakoPlus</strong>
            <small>Portal Operasional Admin</small>
          </span>
        </a>

        <div className="admin-login__art">
          <GroceryIllustration />
        </div>

        <p className="admin-login__copyright">
          © {new Date().getFullYear()} SembakoPlus.
        </p>
      </aside>

      <section className="admin-login__form-panel">
        <div className="admin-login__card">
          <header className="admin-login__header">
            <h1>Masuk ke Akun Admin</h1>
            <p>Gunakan email dan kata sandi operasional Toko Anda.</p>
          </header>

          <form className="admin-login__form" onSubmit={handleSubmit}>
            <label className="admin-login__field-label" htmlFor="admin-email">
              Email Administrator
            </label>
            <div className="admin-login__input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input
                autoComplete="username"
                id="admin-email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@sembakogo.id"
                required
                type="email"
                value={email}
              />
            </div>

            <label className="admin-login__field-label" htmlFor="admin-password">
              Kata Sandi
            </label>
            <div className="admin-login__input-wrap">
              <LockKeyhole size={16} aria-hidden="true" />
              <input
                autoComplete="current-password"
                id="admin-password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan kata sandi"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="admin-login__visibility"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              className="admin-login__submit"
              disabled={submitting}
              type="submit"
            >
              <span>{submitting ? 'Memproses...' : 'Masuk ke Dashboard Admin'}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <p className="admin-login__status" aria-live="polite" role="alert">
              {statusMessage}
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default AdminLogin
