import { NavLink, useNavigate } from 'react-router-dom'
import { UserAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import Icon from '../ui/Icon'

function displayName(session) {
  const email = session?.user?.email
  return email ? email.split('@')[0] : ''
}

export default function Header() {
  const { session, userRole, signOut, openAuth } = UserAuth()
  const navigate = useNavigate()

  const name = displayName(session)
  const loggedIn = !!session

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="rupv-header">
      <button className="rupv-header-brand" onClick={() => navigate('/')}>
        <img src="/rate-upv-logo.svg" alt="" className="rupv-header-logo" width="46" height="46" />
        <span className="rupv-header-wordmark">
          <span className="rupv-header-name">Rate UPV</span>
          <span className="rupv-header-tagline">student reviews · campus services</span>
        </span>
      </button>

      <nav className="rupv-header-links" aria-label="Primary">
        <NavLink to="/" end className="rupv-header-link" aria-label="Browse">
          <Icon name="building" size={16} /> <span>Browse</span>
        </NavLink>
        <NavLink to="/mappreview" className="rupv-header-link" aria-label="Campus map">
          <Icon name="map" size={16} /> <span>Map</span>
        </NavLink>
      </nav>

      <div className="rupv-header-nav">
        {loggedIn ? (
          <>
            {userRole === 'admin' && <span className="rupv-header-role">Admin</span>}
            <button
              className="rupv-header-account"
              onClick={() => navigate('/profile')}
              aria-label="View my profile"
              title="View my profile"
            >
              <span className="rupv-header-greeting">Hello, {name}</span>
              <Avatar name={name} size={40} />
            </button>
            <Button variant="onDark" size="sm" onClick={handleSignOut}>
              <Icon name="logout" size={16} /> Log out
            </Button>
          </>
        ) : (
          <>
            <Button variant="onDark" size="sm" onClick={() => openAuth('signin')}>Log in</Button>
            <Button variant="primary" size="sm" onClick={() => openAuth('signup')}>Sign up</Button>
          </>
        )}
      </div>
    </header>
  )
}
