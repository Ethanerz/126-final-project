// VoteStack.jsx — up/down vote control. Arrow icons + counts, no emoji.
import Icon from './Icon'

export default function VoteStack({ up = 0, down = 0, active, onUp, onDown, disabled = false }) {
  return (
    <div className="rupv-votes">
      <button
        type="button"
        className={`rupv-vote ${active === 'upvote' ? 'is-active' : ''}`}
        onClick={onUp}
        disabled={disabled}
        aria-pressed={active === 'upvote'}
        aria-label="Upvote"
      >
        <Icon name="arrowUp" size={16} />
        <span>{up}</span>
      </button>
      <button
        type="button"
        className={`rupv-vote rupv-vote--down ${active === 'downvote' ? 'is-active' : ''}`}
        onClick={onDown}
        disabled={disabled}
        aria-pressed={active === 'downvote'}
        aria-label="Downvote"
      >
        <Icon name="arrowDown" size={16} />
        <span>{down}</span>
      </button>
    </div>
  )
}
