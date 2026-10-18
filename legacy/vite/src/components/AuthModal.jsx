import { useEffect, useRef, useState } from 'react'
import { UserAuth } from '../context/AuthContext'
import Button from './ui/Button'
import Icon from './ui/Icon'
import { useModalA11y } from '../hooks/useModalA11y'
import { isUpEmail } from '../utils/validation'
import '../styles/Auth.css'

const PASSWORD_MIN = 6

// ── Inner card — mounted only while the modal is open, so all form state
// starts fresh on every open (no reset-state effects needed). ──────────────
function AuthCard({ initialMode, onRequestClose, closing }) {
  const { signInUser, signUpNewUser } = UserAuth()
  const cardRef = useRef(null)

  const [mode, setMode] = useState(initialMode || 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  // Focus trap + focus restore.
  useModalA11y(cardRef)

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setAwaitingConfirmation(false)
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signInUser(email.trim(), password)
      if (result.success) onRequestClose()
      else setError(result.error?.message || result.error || 'Unable to sign in')
    } catch (err) {
      setError(err.message || 'An error occurred during sign-in')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    const cleanEmail = email.trim()
    if (!isUpEmail(cleanEmail)) {
      setError('Please use your UP email address (must end in @up.edu.ph).')
      return
    }
    if (password.length < PASSWORD_MIN) {
      setError(`Your password needs at least ${PASSWORD_MIN} characters.`)
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
      // Email-confirmation on → user but no session; off → logged in immediately.
      if (result.data?.session) onRequestClose()
      else setAwaitingConfirmation(true)
    } catch (err) {
      setError(err.message || 'An error occurred during sign-up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={cardRef}
      className={`rupv-modal auth-card${closing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <button className="rupv-modal-close" onClick={onRequestClose} aria-label="Close">
        <Icon name="close" size={18} />
      </button>

      <img src="/rate-upv-logo.svg" alt="Rate UPV logo" className="auth-logo" />

      <div className="auth-view" key={awaitingConfirmation ? 'confirm' : mode}>
        {awaitingConfirmation ? (
          <>
            <h2 className="auth-title" id="auth-modal-title">Check your email</h2>
            <p className="auth-helper">
              We sent a confirmation link to <strong>{email.trim()}</strong>. Open it to
              finish creating your Rate UPV account — you can't log in until you confirm.
            </p>
            <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
              Back to log in
            </button>
          </>
        ) : mode === 'signin' ? (
          <>
            <h2 className="auth-title" id="auth-modal-title">
              Log in to<span className="brand">Rate UPV</span>
            </h2>
            <form className="auth-form" onSubmit={handleSignIn}>
              <div className="auth-field">
                <label htmlFor="m-signin-email">Email</label>
                <input
                  id="m-signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="m-signin-password">Password</label>
                <input
                  id="m-signin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
              {error && <div className="rupv-alert rupv-alert--error" role="alert">{error}</div>}
              <Button type="submit" variant="primary" size="md" block loading={loading}>
                {loading ? 'Signing in…' : 'Log in'}
              </Button>
            </form>
            <p className="auth-helper">
              Don't have an account yet?{' '}
              <button type="button" className="auth-link" onClick={() => switchMode('signup')}>
                Sign up
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className="auth-title" id="auth-modal-title">
              Sign up for<span className="brand">Rate UPV</span>
            </h2>
            <form className="auth-form" onSubmit={handleSignUp}>
              <div className="auth-field">
                <label htmlFor="m-signup-email">Email</label>
                <input
                  id="m-signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="juan.delacruz@up.edu.ph"
                  disabled={loading}
                />
                <small className="auth-hint">Use your UP email (@up.edu.ph).</small>
              </div>
              <div className="auth-field">
                <label htmlFor="m-signup-password">Password</label>
                <input
                  id="m-signup-password"
                  type="password"
                  required
                  minLength={PASSWORD_MIN}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <small className="auth-hint">At least {PASSWORD_MIN} characters.</small>
              </div>
              <div className="auth-field">
                <label htmlFor="m-signup-confirm">Confirm Password</label>
                <input
                  id="m-signup-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              {error && <div className="rupv-alert rupv-alert--error" role="alert">{error}</div>}
              <Button type="submit" variant="primary" size="md" block loading={loading}>
                {loading ? 'Signing up…' : 'Sign up'}
              </Button>
            </form>
            <p className="auth-helper">
              Already have an account?{' '}
              <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Outer shell — scrim, closing animation, Escape, body scroll lock. ──────
export default function AuthModal() {
  const { authModal, closeAuth } = UserAuth()
  const open = authModal?.open
  const [closing, setClosing] = useState(false)

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setClosing(true) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open) return null

  // Play the exit animation first, then actually close once it finishes.
  const requestClose = () => setClosing(true)
  const handleScrimAnimEnd = (e) => {
    // Only react to the scrim's own fade-out — ignore the card's bubbled
    // animation and the entrance animations (closing is false then).
    if (e.target === e.currentTarget && closing) {
      setClosing(false)
      closeAuth()
    }
  }

  return (
    <div
      className={`rupv-modal-scrim${closing ? ' is-closing' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose() }}
      onAnimationEnd={handleScrimAnimEnd}
    >
      <AuthCard
        initialMode={authModal.mode}
        onRequestClose={requestClose}
        closing={closing}
      />
    </div>
  )
}
