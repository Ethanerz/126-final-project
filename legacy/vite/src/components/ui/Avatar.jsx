// Avatar.jsx — ink circle with initials (falls back to a user glyph).
import Icon from './Icon'

export default function Avatar({ name, size = 56 }) {
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''
  return (
    <div className="rupv-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials || <Icon name="user" size={size * 0.5} stroke="var(--rupv-cream)" />}
    </div>
  )
}
