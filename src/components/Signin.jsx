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

  const { signInUser } = UserAuth()
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signInUser(email, password)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error?.message || result.error || 'Unable to sign in')
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sign-in')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    await signInUser('guest@up.edu.ph', 'guest12345')
    navigate('/dashboard')
  }
  const handleResetPassword = () => navigate('/')

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img
          src="/rate-upv-logo.svg"
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
              {/* Admin and User both use the same email/password form.
                  The role assigned in user_profiles determines what they see. */}
              <button
                type="button"
                className="auth-btn auth-btn-primary"
                onClick={() => setView('user')}
              >
                Login
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