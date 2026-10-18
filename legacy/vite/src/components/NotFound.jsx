import { Link } from 'react-router-dom'
import Button from './ui/Button'
import Icon from './ui/Icon'
import { usePageTitle } from '../hooks/usePageTitle'

// Catch-all 404 — friendly dead-end with a way back.
export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <div className="rupv-container rupv-notfound">
      <Icon name="compass" size={56} stroke="var(--rupv-wine)" />
      <p className="rupv-notfound-code" aria-hidden="true">404</p>
      <h1 className="rupv-h3">This page doesn't exist</h1>
      <p className="rupv-body-sm">
        The link may be broken, or the page may have been moved or deleted.
      </p>
      <div className="rupv-notfound-actions">
        <Button variant="primary" size="md" to="/">
          <Icon name="arrowLeft" size={18} /> Back to browse
        </Button>
        <Link className="rupv-notfound-maplink" to="/mappreview">
          <Icon name="map" size={16} /> Open the campus map
        </Link>
      </div>
    </div>
  )
}
