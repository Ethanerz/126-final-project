import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorState from './ErrorState'

describe('ErrorState', () => {
  it('renders as an alert with title and message', () => {
    render(<ErrorState title="Boom" message="It broke." />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Boom')
    expect(alert).toHaveTextContent('It broke.')
  })

  it('fires onRetry when the button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('omits the retry button when no handler is given', () => {
    render(<ErrorState />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
