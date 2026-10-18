import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RatingBadge from './RatingBadge'

describe('RatingBadge', () => {
  it('shows an em dash when there is no value', () => {
    render(<RatingBadge value={null} count={0} size="sm" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows an em dash when count is zero even if a value sneaks in', () => {
    render(<RatingBadge value={0} count={0} size="sm" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('formats the value to one decimal place', () => {
    render(<RatingBadge value={4} count={3} size="sm" />)
    expect(screen.getByText('4.0')).toBeInTheDocument()
  })

  it('does not round away precision (4.25 -> 4.3)', () => {
    render(<RatingBadge value={4.25} count={3} size="sm" />)
    expect(screen.getByText('4.3')).toBeInTheDocument()
  })

  it('classifies scores: >=4 good, >=2.5 ok, else bad', () => {
    const { container: good } = render(<RatingBadge value={4} count={1} size="sm" />)
    expect(good.querySelector('.rupv-badge--score-good')).not.toBeNull()

    const { container: ok } = render(<RatingBadge value={2.5} count={1} size="sm" />)
    expect(ok.querySelector('.rupv-badge--score-ok')).not.toBeNull()

    const { container: bad } = render(<RatingBadge value={2.4} count={1} size="sm" />)
    expect(bad.querySelector('.rupv-badge--score-bad')).not.toBeNull()
  })

  it('renders the large block variant with its label', () => {
    render(<RatingBadge value={3.7} count={12} size="lg" />)
    expect(screen.getByText('3.7')).toBeInTheDocument()
    expect(screen.getByText(/overall user ratings/i)).toBeInTheDocument()
  })

  it('handles a string value from the API without crashing', () => {
    render(<RatingBadge value="4.5" count={2} size="sm" />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })
})
