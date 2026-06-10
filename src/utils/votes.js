// Pure vote-transition math, shared by the detail and replies pages.
//
// Given the user's existing vote on a target ('upvote' | 'downvote' | null/undefined)
// and the vote button they just pressed, returns:
//   newVote  — the vote that should exist afterwards (null = no vote)
//   upDelta / downDelta — how the displayed counts shift, applied optimistically.
export function computeVoteTransition(existingVote, voteType) {
  let newVote
  let upDelta = 0
  let downDelta = 0

  if (existingVote === voteType) {
    // Pressing the same button toggles the vote off.
    newVote = null
    if (voteType === 'upvote') upDelta = -1
    else downDelta = -1
  } else {
    newVote = voteType
    if (existingVote === 'upvote') upDelta -= 1
    else if (existingVote === 'downvote') downDelta -= 1
    if (voteType === 'upvote') upDelta += 1
    else downDelta += 1
  }

  return { newVote, upDelta, downDelta }
}
