import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import ErrorState from './ui/ErrorState'
import Icon from './ui/Icon'
import RatingBadge from './ui/RatingBadge'
import VoteStack from './ui/VoteStack'
import { usePageTitle } from '../hooks/usePageTitle'
import '../styles/Ratings.css'

const REPLY_MAX = 2000

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

async function fetchReviewWithReplies(reviewId) {
  const { data: review, error } = await supabase
    .from('reviews')
    .select('*, user_profiles(full_name)')
    .eq('id', reviewId)
    .maybeSingle()
  if (error) throw error
  if (!review) return null

  const { data: replies, error: repliesError } = await supabase
    .from('review_replies')
    .select('*, user_profiles(full_name)')
    .eq('review_id', reviewId)
    .is('parent_reply_id', null)
    .order('created_at', { ascending: true })
  if (repliesError) throw repliesError

  return { review, replies: replies ?? [] }
}

const Replies = () => {
  const { entityId, reviewId } = useParams()
  // page.key tracks which review the data belongs to — loading is derived.
  const [page, setPage] = useState({ key: null, data: null, status: 'idle' })
  const [userVote, setUserVote] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyError, setReplyError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { session, isVisitor, canWrite, openAuth } = UserAuth()

  usePageTitle('Replies')

  const loading = page.key !== reviewId
  const review = loading ? null : page.data?.review ?? null
  const replies = useMemo(
    () => (loading ? [] : page.data?.replies ?? []),
    [loading, page.data]
  )
  const notFound = !loading && page.status === 'notfound'
  const fetchFailed = !loading && page.status === 'error'

  // Public data — load for everyone, signed in or not.
  useEffect(() => {
    if (!reviewId) return
    let cancelled = false
    fetchReviewWithReplies(reviewId)
      .then((data) => {
        if (cancelled) return
        setPage({ key: reviewId, data, status: data ? 'ready' : 'notfound' })
      })
      .catch((err) => {
        console.error('Error fetching review:', err)
        if (!cancelled) setPage({ key: reviewId, data: null, status: 'error' })
      })
    return () => { cancelled = true }
  }, [reviewId])

  const retry = () => {
    setPage({ key: null, data: null, status: 'idle' })
    fetchReviewWithReplies(reviewId)
      .then((data) => setPage({ key: reviewId, data, status: data ? 'ready' : 'notfound' }))
      .catch((err) => {
        console.error('Error fetching review:', err)
        setPage({ key: reviewId, data: null, status: 'error' })
      })
  }

  // In-place refresh (after posting a reply) — no skeleton flash.
  const refresh = async () => {
    try {
      const data = await fetchReviewWithReplies(reviewId)
      setPage({ key: reviewId, data, status: data ? 'ready' : 'notfound' })
    } catch (err) {
      console.error('Error refreshing review:', err)
    }
  }

  // The signed-in user's existing vote on this review.
  useEffect(() => {
    if (!session || !reviewId) return
    let cancelled = false
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('user_id', session.user.id)
          .eq('target_type', 'review')
          .eq('target_id', reviewId)
          .maybeSingle()
        if (error) throw error
        if (!cancelled) setUserVote(data?.vote_type || null)
      } catch (err) {
        console.error('Error loading vote:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [session, reviewId])

  // Optimistic vote — mirrors the Rating page: update UI instantly, write in
  // the background, roll back on failure. No full refetch.
  async function handleVote(voteType) {
    if (!canWrite || !review) return

    let newVote
    let upDelta = 0
    let downDelta = 0
    if (userVote === voteType) {
      newVote = null
      if (voteType === 'upvote') upDelta = -1
      else downDelta = -1
    } else {
      newVote = voteType
      if (userVote === 'upvote') upDelta -= 1
      else if (userVote === 'downvote') downDelta -= 1
      if (voteType === 'upvote') upDelta += 1
      else downDelta += 1
    }

    const prevVote = userVote
    const prevPage = page

    setUserVote(newVote)
    setPage((prev) =>
      prev.data
        ? {
            ...prev,
            data: {
              ...prev.data,
              review: {
                ...prev.data.review,
                upvote_count: (prev.data.review.upvote_count || 0) + upDelta,
                downvote_count: (prev.data.review.downvote_count || 0) + downDelta,
              },
            },
          }
        : prev
    )

    try {
      if (prevVote === voteType) {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('target_id', reviewId)
          .eq('user_id', session.user.id)
          .eq('target_type', 'review')
        if (error) throw error
      } else {
        if (prevVote) {
          const { error: delError } = await supabase
            .from('votes')
            .delete()
            .eq('target_id', reviewId)
            .eq('user_id', session.user.id)
            .eq('target_type', 'review')
          if (delError) throw delError
        }
        const { error } = await supabase.from('votes').insert([
          {
            user_id: session.user.id,
            target_id: reviewId,
            target_type: 'review',
            vote_type: voteType,
          },
        ])
        if (error) throw error
      }
    } catch (err) {
      console.error('Error handling vote:', err)
      setUserVote(prevVote)
      setPage(prevPage)
    }
  }

  async function submitReply(e) {
    e.preventDefault()
    const cleanText = replyText.trim()
    if (!cleanText) {
      setReplyError("Your reply can't be just spaces.")
      return
    }
    setReplyError(null)
    try {
      setBusy(true)
      const { error } = await supabase.from('review_replies').insert([
        {
          review_id: reviewId,
          user_id: session.user.id,
          parent_reply_id: null,
          reply_text: cleanText,
        },
      ])
      if (error) throw error
      setReplyText('')
      await refresh()
    } catch (err) {
      console.error('Error submitting reply:', err)
      setReplyError('Failed to submit reply. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="rupv-container rupv-detail" aria-busy="true">
        <div className="rupv-skeleton rupv-detail-skel-back" aria-hidden="true" />

        <div className="rupv-review-list" aria-hidden="true">
          <article className="rupv-review rupv-review--skeleton">
            <header className="rupv-review-head">
              <div className="rupv-skeleton rupv-review-skel-avatar" />
              <div className="rupv-review-skel-author">
                <div className="rupv-skeleton rupv-review-skel-name" />
                <div className="rupv-skeleton rupv-review-skel-date" />
              </div>
              <div className="rupv-skeleton rupv-review-skel-badge" />
            </header>
            <div className="rupv-skeleton rupv-detail-skel-line" />
            <div className="rupv-skeleton rupv-detail-skel-line rupv-detail-skel-line--sm" />
          </article>
        </div>

        <section className="rupv-detail-reviews" style={{ marginTop: 'var(--rupv-s-7)' }} aria-hidden="true">
          <div className="rupv-skeleton rupv-detail-skel-h2" />
          <div className="rupv-review-list rupv-stagger">
            {Array.from({ length: 3 }).map((_, i) => (
              <article key={i} className="rupv-review rupv-review--skeleton" style={{ '--i': i }}>
                <header className="rupv-review-head">
                  <div className="rupv-skeleton rupv-review-skel-avatar" />
                  <div className="rupv-review-skel-author">
                    <div className="rupv-skeleton rupv-review-skel-name" />
                    <div className="rupv-skeleton rupv-review-skel-date" />
                  </div>
                </header>
                <div className="rupv-skeleton rupv-detail-skel-line" />
                <div className="rupv-skeleton rupv-detail-skel-line rupv-detail-skel-line--sm" />
              </article>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (fetchFailed) {
    return (
      <div className="rupv-container rupv-detail">
        <Link className="rupv-detail-back" to={`/rating/${entityId}`}>
          <Icon name="arrowLeft" size={18} /> Back to ratings
        </Link>
        <ErrorState
          title="Couldn't load this discussion"
          message="The replies didn't come through. Check your connection and try again."
          onRetry={retry}
        />
      </div>
    )
  }

  if (notFound || !review) {
    return (
      <div className="rupv-container rupv-detail">
        <div className="rupv-detail-gone">
          <Icon name="message" size={44} stroke="var(--rupv-fg-3)" />
          <p className="rupv-h4">That review could not be found</p>
          <p className="rupv-body-sm">It may have been deleted, or the link may be wrong.</p>
          <Button variant="ghost" size="md" to={`/rating/${entityId}`}>
            <Icon name="arrowLeft" size={18} /> Back to ratings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rupv-container rupv-detail">
      <Link className="rupv-detail-back" to={`/rating/${entityId}`}>
        <Icon name="arrowLeft" size={18} /> Back to ratings
      </Link>

      <div className="rupv-review-list">
        <article className="rupv-review">
          <header className="rupv-review-head">
            <Avatar name={review.user_profiles?.full_name} size={44} />
            <div className="rupv-review-author">
              <span className="rupv-review-name">
                {review.user_profiles?.full_name || 'Student'}
              </span>
              <span className="rupv-review-date">
                Posted {formatDate(review.created_at)}
              </span>
            </div>
            <RatingBadge value={review.rating} count={1} size="sm" tone="ghost" />
          </header>

          {review.title && <h1 className="rupv-review-title">{review.title}</h1>}
          {review.review_text && <p className="rupv-review-text">{review.review_text}</p>}

          <footer className="rupv-review-foot">
            <VoteStack
              up={review.upvote_count || 0}
              down={review.downvote_count || 0}
              active={userVote}
              onUp={() => handleVote('upvote')}
              onDown={() => handleVote('downvote')}
              disabled={!canWrite}
            />
          </footer>
        </article>
      </div>

      <section className="rupv-detail-reviews" style={{ marginTop: 'var(--rupv-s-7)' }}>
        <div className="rupv-detail-reviews-head">
          <h2 className="rupv-h3">Replies</h2>
          {replies.length > 0 && (
            <span className="rupv-detail-reviews-count">{replies.length} total</span>
          )}
        </div>

        {replies.length === 0 ? (
          <div className="rupv-detail-empty">
            <Icon name="message" size={36} stroke="var(--rupv-fg-3)" />
            <p className="rupv-h4">No replies yet</p>
            <p className="rupv-body-sm">Be the first to reply.</p>
          </div>
        ) : (
          <div className="rupv-review-list rupv-stagger">
            {replies.map((reply, i) => (
              <article key={reply.id} className="rupv-review" style={{ '--i': i }}>
                <header className="rupv-review-head">
                  <Avatar name={reply.user_profiles?.full_name} size={40} />
                  <div className="rupv-review-author">
                    <span className="rupv-review-name">
                      {reply.user_profiles?.full_name || 'Student'}
                    </span>
                    <span className="rupv-review-date">{formatDate(reply.created_at)}</span>
                  </div>
                </header>
                <p className="rupv-review-text">{reply.reply_text}</p>
              </article>
            ))}
          </div>
        )}

        <div className="rupv-rform-slot">
          {isVisitor ? (
            <div className="rupv-rform rupv-rform-guest">
              <p className="rupv-h4">Join the conversation</p>
              <p className="rupv-body-sm">Log in with your UP account to leave a reply.</p>
              <Button variant="primary" size="md" onClick={() => openAuth('signin')}>Log in</Button>
            </div>
          ) : canWrite ? (
            <form className="rupv-rform" onSubmit={submitReply}>
              <h3 className="rupv-h4">Leave a reply</h3>
              <label className="rupv-field">
                <span className="rupv-field-label">Your reply</span>
                <textarea
                  rows="4"
                  required
                  maxLength={REPLY_MAX}
                  placeholder="Add to the conversation…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  aria-invalid={replyError && !replyText.trim() ? 'true' : undefined}
                />
              </label>
              {replyError && <p className="rupv-alert rupv-alert--error" role="alert">{replyError}</p>}
              <div className="rupv-rform-actions">
                <Button type="submit" variant="primary" size="md" loading={busy} disabled={busy}>
                  Submit reply
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default Replies
