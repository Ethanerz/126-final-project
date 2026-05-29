import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
import '../styles/Auth.css'

const Signin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signInUser, signInAsGuest } = UserAuth()
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signInUser(email, password)
      if (result.success) {
        navigate('/')
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
    await signInAsGuest()
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/rate-upv-logo.svg" alt="Rate UPV logo" className="auth-logo" />

        <h2 className="auth-title">
          Log in to
          <span className="brand">Rate UPV</span>
        </h2>

        {/* Admins and students share this form — the role in user_profiles
            determines what they see after signing in. */}
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

          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <button type="button" className="auth-btn auth-btn-ghost" onClick={handleGuest}>
          Continue as guest
        </button>

        <div className="auth-divider" />

        <p className="auth-helper">
          Don't have an account yet? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

export default Signin
