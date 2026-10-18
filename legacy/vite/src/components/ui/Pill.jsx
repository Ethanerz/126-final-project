// Pill.jsx — blush italic tag pill.
export default function Pill({ children, italic = true }) {
  return (
    <span className={`rupv-pill${italic ? ' rupv-pill--italic' : ''}`}>{children}</span>
  )
}
