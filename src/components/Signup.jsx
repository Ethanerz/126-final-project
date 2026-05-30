import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
import '../styles/Auth.css'

// Only University of the Philippines addresses may register. This mirrors the
// database trigger (restrict_up_email_signups) so users get a clean message
// before the request is ever sent.
const UP_EMAIL_PATTERN = /@up\.edu\.ph$/i

const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const { signUpNewUser } = UserAuth()
  const navigate = useNavigate()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim()

    if (!UP_EMAIL_PATTERN.test(cleanEmail)) {
      setError('Please use your UP email address (must end in @up.edu.ph).')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const result = await signUpNewUser(cleanEmail, password)
      if (!result.success) {
        setError(result.error?.message || 'Unable to register')
        return
      }

      // With "Confirm email" enabled, Supabase returns a user but no session —
      // the account is unusable until the emailed link is clicked. With it
      // disabled, a session comes back and the user is logged in immediately.
      if (result.data?.session) {
        navigate('/')
      } else {
        setAwaitingConfirmation(true)
      }
    } catch (err) {
      setError(err.message || 'an error occured during sign-up')
    } finally {
      setLoading(false)
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img src="/rate-upv-logo.svg" alt="Rate UPV logo" className="auth-logo" />

          <h2 className="auth-title">Check your email</h2>

          <p className="auth-helper">
            We sent a confirmation link to <strong>{email.trim()}</strong>. Open it to
            finish creating your Rate UPV account — you can't log in until you confirm.
          </p>

          <p className="auth-helper">
            Already confirmed? <Link to="/signin">Log in</Link>
          </p>
        </div>
      </div>
    )
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
              placeholder="juan.delacruz@up.edu.ph"
            />
            <small className="auth-hint">Use your UP email (@up.edu.ph).</small>
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
