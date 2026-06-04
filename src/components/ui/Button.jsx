// Button.jsx — the one button. Variants: primary | slate | ghost | onDark | chip | danger.
import { Link } from 'react-router-dom'

export default function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  to,
  href,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const cls = [
    'rupv-btn',
    `rupv-btn--${variant}`,
    `rupv-btn--${size}`,
    block && 'rupv-btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = loading ? (
    <>
      <span className="rupv-spinner" aria-hidden="true" />
      {children}
    </>
  ) : (
    children
  )

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <button type={type} className={cls} {...rest} disabled={loading || rest.disabled}>
      {content}
    </button>
  )
}
