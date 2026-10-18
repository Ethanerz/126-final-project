import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('shows two initials for a full name', () => {
    render(<Avatar name="Juan Dela Cruz" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows one initial for a single name', () => {
    render(<Avatar name="Juan" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('uppercases initials', () => {
    render(<Avatar name="ana reyes" />)
    expect(screen.getByText('AR')).toBeInTheDocument()
  })

  it('collapses extra whitespace between names', () => {
    render(<Avatar name="  Ana   Reyes  " />)
    expect(screen.getByText('AR')).toBeInTheDocument()
  })

  it('handles unicode names', () => {
    render(<Avatar name="Émile Zola" />)
    expect(screen.getByText('ÉZ')).toBeInTheDocument()
  })

  it('falls back to the user icon when name is missing', () => {
    const { container } = render(<Avatar name={null} />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.textContent).toBe('')
  })

  it('falls back to the user icon for an empty string', () => {
    const { container } = render(<Avatar name="" />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
