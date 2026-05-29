import { useNavigate } from 'react-router-dom'
import { UserAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import Icon from '../ui/Icon'

function displayName(session, isGuest) {
  if (isGuest) return 'Guest'
  const email = session?.user?.email
  return email ? email.split('@')[0] : ''
}

export default function Header() {
  const { session, userRole, signOut, isGuest } = UserAuth()
  const navigate = useNavigate()

  const name = displayName(session, isGuest)
  const loggedIn = !!session && !isGuest

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="rupv-header">
      <button className="rupv-header-brand" onClick={() => navigate('/')}>
        <img src="/rate-upv-logo.svg" alt="" className="rupv-header-logo" />
        <span className="rupv-header-wordmark">
          <span className="rupv-header-name">Rate UPV</span>
          <span className="rupv-header-tagline">student reviews · campus services</span>
        </span>
      </button>

      <nav className="rupv-header-nav">
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
        ) : isGuest ? (
          <>
            <span className="rupv-header-greeting">Browsing as guest</span>
            <Button variant="onDark" size="sm" onClick={() => navigate('/signin')}>Log in</Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>Sign up</Button>
          </>
        ) : (
          <>
            <Button variant="onDark" size="sm" onClick={() => navigate('/signin')}>Log in</Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>Sign up</Button>
          </>
        )}
      </nav>
    </header>
  )
}
