import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
import '../styles/Auth.css'

const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { session, signUpNewUser } = UserAuth()
  const navigate = useNavigate()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const result = await signUpNewUser(email, password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error?.message || 'Unable to register')
      }
    } catch (err) {
      setError(err.message || 'an error occured during sign-up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img
          src="/rate-upv-logo.svg"
          alt="Rate UPV logo"
          className="auth-logo"
        />

        <h2 className="auth-title">
          Sign up for
          <span className="brand">Rate UPV</span>
        </h2>

        <form className="auth-form" onSubmit={handleSignUp}>
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-btn auth-btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing up…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-helper">
          Already have an account? <Link to="/signin">Log in</Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
