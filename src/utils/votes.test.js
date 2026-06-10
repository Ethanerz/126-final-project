import { describe, it, expect } from 'vitest'
import { computeVoteTransition } from './votes'

describe('computeVoteTransition', () => {
  it('adds an upvote from no vote', () => {
    expect(computeVoteTransition(undefined, 'upvote')).toEqual({
      newVote: 'upvote', upDelta: 1, downDelta: 0,
    })
  })

  it('adds a downvote from no vote', () => {
    expect(computeVoteTransition(null, 'downvote')).toEqual({
      newVote: 'downvote', upDelta: 0, downDelta: 1,
    })
  })

  it('toggles an upvote off', () => {
    expect(computeVoteTransition('upvote', 'upvote')).toEqual({
      newVote: null, upDelta: -1, downDelta: 0,
    })
  })

  it('toggles a downvote off', () => {
    expect(computeVoteTransition('downvote', 'downvote')).toEqual({
      newVote: null, upDelta: 0, downDelta: -1,
    })
  })

  it('switches up -> down (both counts move)', () => {
    expect(computeVoteTransition('upvote', 'downvote')).toEqual({
      newVote: 'downvote', upDelta: -1, downDelta: 1,
    })
  })

  it('switches down -> up (both counts move)', () => {
    expect(computeVoteTransition('downvote', 'upvote')).toEqual({
      newVote: 'upvote', upDelta: 1, downDelta: -1,
    })
  })

  it('never moves a count by more than 1 in either direction', () => {
    const states = [undefined, null, 'upvote', 'downvote']
    const presses = ['upvote', 'downvote']
    for (const existing of states) {
      for (const press of presses) {
        const { upDelta, downDelta } = computeVoteTransition(existing, press)
        expect(Math.abs(upDelta)).toBeLessThanOrEqual(1)
        expect(Math.abs(downDelta)).toBeLessThanOrEqual(1)
      }
    }
  })
})
