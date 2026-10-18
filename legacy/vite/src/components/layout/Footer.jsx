import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="rupv-footer">
      <div className="rupv-footer-inner">
        <div className="rupv-footer-brand">
          <img src="/rate-upv-logo.svg" alt="" className="rupv-footer-logo" width="44" height="44" />
          <div>
            <div className="rupv-footer-name">Rate UPV</div>
            <div className="rupv-footer-copy">
              © {new Date().getFullYear()} Rate UPV · Student reviews of campus services
            </div>
          </div>
        </div>
        <nav className="rupv-footer-links" aria-label="Footer">
          <Link className="rupv-footer-link" to="/">Browse</Link>
          <Link className="rupv-footer-link" to="/mappreview">Campus map</Link>
        </nav>
      </div>
    </footer>
  )
}
