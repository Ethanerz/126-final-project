// ErrorState.jsx — the one error panel. Shown whenever a fetch fails so the
// UI never silently presents an empty/"not found" state for a network error.
import Button from './Button'
import Icon from './Icon'

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. Check your connection and try again.",
  onRetry,
  compact = false,
}) {
  return (
    <div className={`rupv-error-state${compact ? ' rupv-error-state--compact' : ''}`} role="alert">
      <Icon name="alert" size={compact ? 28 : 40} stroke="var(--rupv-error)" />
      <p className="rupv-h4">{title}</p>
      <p className="rupv-body-sm">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
