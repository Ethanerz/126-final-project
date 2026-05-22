import { Link } from 'react-router-dom'
import './styles/Auth.css'

function App() {
  return (
    <div className="auth-page">
      <div className="auth-card welcome-card">
        <img
          src="/rate-upv-logo.svg"
          alt="Rate UPV logo"
          className="auth-logo welcome-logo"
        />

        <h1 className="welcome-title">Rate UPV</h1>
        <p className="welcome-tagline">
          Rate, review, and rediscover the campus together.
        </p>

        <div className="auth-options">
          <Link to="/signin" style={{ width: '100%', textDecoration: 'none' }}>
            <button type="button" className="auth-btn auth-btn-primary" style={{ width: '100%' }}>
              Sign In
            </button>
          </Link>
          <Link to="/signup" style={{ width: '100%', textDecoration: 'none' }}>
            <button type="button" className="auth-btn auth-btn-outline" style={{ width: '100%' }}>
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default App
