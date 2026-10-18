// RatingBadge.jsx — slate numeral pill. The canonical rating affordance (no stars).
const SIZES = {
  sm: { w: 52, h: 46, font: 22, radius: 12 },
  md: { w: 86, h: 76, font: 46, radius: 20 },
  lg: { w: 160, h: 140, font: 110, radius: 0, block: true },
}

export default function RatingBadge({ value, count, size = 'md', tone = 'filled' }) {
  const s = SIZES[size]
  const hasValue = value != null && count !== 0
  const shown = hasValue ? Number(value).toFixed(1) : '—'
  const score = !hasValue ? 'none' : value >= 4 ? 'good' : value >= 2.5 ? 'ok' : 'bad'

  if (s.block) {
    return (
      <div className={`rupv-badge-block rupv-badge-block--${score}`}>
        <div className="rupv-badge-block-num">{shown}</div>
        <div className="rupv-badge-block-label">overall user ratings</div>
      </div>
    )
  }

  return (
    <div
      className={`rupv-badge rupv-badge--${tone} rupv-badge--score-${score}`}
      style={{ width: s.w, height: s.h, borderRadius: s.radius, fontSize: s.font }}
    >
      {shown}
    </div>
  )
}
