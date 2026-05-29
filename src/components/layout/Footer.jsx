export default function Footer() {
  return (
    <footer className="rupv-footer">
      <div className="rupv-footer-inner">
        <div className="rupv-footer-brand">
          <img src="/rate-upv-logo.svg" alt="" className="rupv-footer-logo" />
          <div>
            <div className="rupv-footer-name">Rate UPV</div>
            <div className="rupv-footer-copy">
              © {new Date().getFullYear()} Rate UPV · Student reviews of campus services
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
