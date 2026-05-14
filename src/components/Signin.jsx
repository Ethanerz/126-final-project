import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
import '../styles/Auth.css'

const Signin = () => {
  const [view, setView] = useState('options') // 'options' | 'user'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { session, signInUser } = UserAuth()
  const navigate = useNavigate()
  console.log(session)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signInUser(email, password)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error?.message || 'Unable to sign in')
      }
    } catch (err) {
      setError(err.message || 'an error occured during sign-in')
    } finally {
      setLoading(false)
    }
  }

  // Placeholder routes for buttons we haven't wired yet
  const handleAdmin = () => navigate('/dashboard')
  const handleGuest = () => navigate('/dashboard')
  const handleResetPassword = () => navigate('/')

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img
          src="/rmc-logo-red.png"
          alt="Rate UPV logo"
          className="auth-logo"
        />

        {view === 'options' && (
          <>
            <h2 className="auth-title">
              Log in to
              <span className="brand">Rate UPV</span>
            </h2>

            <div className="auth-options">
              <button
                type="button"
                className="auth-btn auth-btn-outline"
                onClick={handleAdmin}
              >
                Login as Admin
              </button>
              <button
                type="button"
                className="auth-btn auth-btn-primary"
                onClick={() => setView('user')}
              >
                Login as User
              </button>
              <button
                type="button"
                className="auth-btn auth-btn-ghost"
                onClick={handleGuest}
              >
                Continue as Guest
              </button>
            </div>

            <div className="auth-divider" />

            <p className="auth-helper">
              Don't have an account yet?
            </p>
            <Link to="/signup" style={{ width: '100%', textDecoration: 'none' }}>
              <button type="button" className="auth-btn auth-btn-outline" style={{ width: '100%' }}>
                Register
              </button>
            </Link>
          </>
        )}

        {view === 'user' && (
          <>
            <button
              type="button"
              className="auth-back"
              onClick={() => { setView('options'); setError('') }}
            >
              {'Back'}
            </button>

            <h2 className="auth-title">
              Log in to
              <span className="brand">Rate UPV</span>
            </h2>

            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="auth-field">
                <label htmlFor="signin-email">Email</label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signin-password">Password</label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="submit"
                className="auth-btn auth-btn-primary"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Login'}
              </button>
            </form>

            <p className="auth-helper">
              Forgot your password?
            </p>
            <button
              type="button"
              className="auth-btn auth-btn-outline"
              style={{ width: '100%' }}
              onClick={handleResetPassword}
            >
              Reset Password
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Signin
