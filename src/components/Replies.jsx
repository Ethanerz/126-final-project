import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import Icon from './ui/Icon'
import RatingBadge from './ui/RatingBadge'
import VoteStack from './ui/VoteStack'
import '../styles/Ratings.css'

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const Replies = () => {
  const [review, setReview] = useState(null)
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [userVote, setUserVote] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyError, setReplyError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { session, isGuest } = UserAuth()
  const { entityId, reviewId } = useParams()

  useEffect(() => {
    if (session && reviewId) fetchReview()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, reviewId])

  useEffect(() => {
    if (session && review) loadUserVote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review, session])

  async function fetchReview() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('reviews')
        .select('*, user_profiles(full_name)')
        .eq('id', reviewId)
        .single()
      if (error) throw error
      setReview(data)

      const { data: repliesData, error: repliesError } = await supabase
        .from('review_replies')
        .select('*, user_profiles(full_name)')
        .eq('review_id', reviewId)
        .is('parent_reply_id', null)
        .order('created_at', { ascending: true })
      if (repliesError) throw repliesError
      setReplies(repliesData || [])
    } catch (error) {
      console.error('Error fetching review:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserVote() {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', session.user.id)
        .eq('target_type', 'review')
        .eq('target_id', reviewId)
        .maybeSingle()
      if (error) throw error
      setUserVote(data?.vote_type || null)
    } catch (error) {
      console.error('Error loading vote:', error)
    }
  }

  async function handleVote(voteType) {
    try {
      if (userVote === voteType) {
        await supabase
          .from('votes')
          .delete()
          .eq('target_id', reviewId)
          .eq('user_id', session.user.id)
          .eq('target_type', 'review')
      } else {
        if (userVote) {
          await supabase
            .from('votes')
            .delete()
            .eq('target_id', reviewId)
            .eq('user_id', session.user.id)
            .eq('target_type', 'review')
        }
        await supabase.from('votes').insert([
          {
            user_id: session.user.id,
            target_id: reviewId,
            target_type: 'review',
            vote_type: voteType,
            created_at: new Date(),
          },
        ])
      }
      await fetchReview()
    } catch (error) {
      console.error('Error handling vote:', error)
    }
  }

  async function submitReply(e) {
    e.preventDefault()
    setReplyError(null)
    try {
      setBusy(true)
      const { error } = await supabase.from('review_replies').insert([
        {
          review_id: reviewId,
          user_id: session.user.id,
          parent_reply_id: null,
          reply_text: replyText,
          upvote_count: 0,
          downvote_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      if (error) throw error
      setReplyText('')
      await fetchReview()
    } catch (error) {
      console.error('Error submitting reply:', error)
      setReplyError('Failed to submit reply. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="rupv-container rupv-detail">
        <p className="rupv-detail-status">Loading…</p>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="rupv-container rupv-detail">
        <p className="rupv-detail-status">That review could not be found.</p>
        <Button variant="ghost" size="md" to={`/rating/${entityId}`}>
          <Icon name="arrowLeft" size={18} /> Back
        </Button>
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
              disabled={isGuest}
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
          <div className="rupv-review-list">
            {replies.map((reply) => (
              <article key={reply.id} className="rupv-review">
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
          {isGuest ? (
            <div className="rupv-rform rupv-rform-guest">
              <p className="rupv-h4">Join the conversation</p>
              <p className="rupv-body-sm">Log in with your UP account to leave a reply.</p>
              <Button variant="primary" size="md" to="/signin">Log in</Button>
            </div>
          ) : (
            <form className="rupv-rform" onSubmit={submitReply}>
              <h3 className="rupv-h4">Leave a reply</h3>
              <label className="rupv-field">
                <span className="rupv-field-label">Your reply</span>
                <textarea
                  rows="4"
                  required
                  placeholder="Add to the conversation…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </label>
              {replyError && <p className="rupv-rform-error">{replyError}</p>}
              <div className="rupv-rform-actions">
                <Button type="submit" variant="primary" size="md" disabled={busy}>
                  Submit reply
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

export default Replies
