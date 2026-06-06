import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import EntityMiniMap from './ui/EntityMiniMap'
import Icon from './ui/Icon'
import Pill from './ui/Pill'
import RatingBadge from './ui/RatingBadge'
import VoteStack from './ui/VoteStack'
import '../styles/Ratings.css'

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

// ── Review form (kept outside the page component so typing never remounts it) ──
function ReviewForm({ initial, onSubmit, onCancel, error, busy }) {
  const [rating, setRating] = useState(initial?.rating || 0)
  const [title, setTitle] = useState(initial?.title || '')
  const [text, setText] = useState(initial?.review_text || '')

  const submit = (e) => {
    e.preventDefault()
    if (!rating) return
    onSubmit({ rating, title, review: text })
  }

  return (
    <form className="rupv-rform" onSubmit={submit}>
      <h3 className="rupv-h4">{initial ? 'Edit your review' : 'Write a review'}</h3>

      <div className="rupv-field">
        <span className="rupv-field-label">Your rating</span>
        <div className="rupv-rate-row" role="radiogroup" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="rupv-rate-chip"
              data-active={rating === n}
              aria-pressed={rating === n}
              aria-label={`${n} out of 5`}
              onClick={() => setRating(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <label className="rupv-field">
        <span className="rupv-field-label">Title</span>
        <input
          type="text"
          required
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="rupv-field">
        <span className="rupv-field-label">Your review</span>
        <textarea
          rows="4"
          required
          placeholder="Share the details — what was good, what could be better?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      {error && <p className="rupv-rform-error">{error}</p>}

      <div className="rupv-rform-actions">
        <Button type="submit" variant="primary" size="md" loading={busy} disabled={!rating}>
          {initial ? 'Save changes' : 'Submit review'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

const Rating = () => {
  const [currentEntity, setCurrentEntity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userVotes, setUserVotes] = useState({})
  const [userReview, setUserReview] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { session, isGuest } = UserAuth()
  const { entityId } = useParams()
  const formRef = useRef(null)

  useEffect(() => {
    if (session && entityId) fetchSingleEntityWithRatings()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, entityId])

  useEffect(() => {
    if (session && currentEntity?.reviews?.length > 0) loadUserVotes()
    if (session && currentEntity?.reviews) {
      const existing = currentEntity.reviews.find((r) => r.user_id === session.user.id)
      setUserReview(existing || null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEntity?.reviews, session])

  async function fetchSingleEntityWithRatings() {
    try {
      setLoading(true)

      const { data: entity, error: entityError } = await supabase
        .from('entities')
        .select('*')
        .eq('id', entityId)
        .single()

      if (entityError) throw entityError

      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*, user_profiles(full_name)')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError

      const sortedReviews =
        reviews?.sort(
          (a, b) =>
            b.upvote_count - b.downvote_count - (a.upvote_count - a.downvote_count)
        ) || []

      setCurrentEntity({ ...entity, reviews: sortedReviews })
    } catch (error) {
      console.error('Error fetching entity:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserVotes() {
    try {
      const reviewIds = currentEntity.reviews.map((r) => r.id)
      const { data, error } = await supabase
        .from('votes')
        .select('target_id, vote_type')
        .eq('user_id', session.user.id)
        .eq('target_type', 'review')
        .in('target_id', reviewIds)

      if (error) throw error

      const votesMap = {}
      for (const vote of data) votesMap[vote.target_id] = vote.vote_type
      setUserVotes(votesMap)
    } catch (error) {
      console.error('Error loading user votes:', error)
    }
  }

  async function handleVote(reviewId, voteType) {
    try {
      const existingVote = userVotes[reviewId]

      if (existingVote === voteType) {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('target_id', reviewId)
          .eq('user_id', session.user.id)
          .eq('target_type', 'review')
        if (error) throw error
      } else {
        if (existingVote) {
          await supabase
            .from('votes')
            .delete()
            .eq('target_id', reviewId)
            .eq('user_id', session.user.id)
            .eq('target_type', 'review')
        }
        const { error } = await supabase.from('votes').insert([
          {
            user_id: session.user.id,
            target_id: reviewId,
            target_type: 'review',
            vote_type: voteType,
            created_at: new Date(),
          },
        ])
        if (error) throw error
      }
      await fetchSingleEntityWithRatings()
    } catch (error) {
      console.error('Error handling vote:', error)
    }
  }

  async function submitRating(ratingData) {
    try {
      setBusy(true)
      setReviewError(null)

      const { error } = await supabase.from('reviews').insert([
        {
          entity_id: entityId,
          user_id: session.user.id,
          rating: ratingData.rating,
          title: ratingData.title,
          review_text: ratingData.review,
          upvote_count: 0,
          downvote_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      if (error) {
        if (error.code === '23505') {
          setReviewError("You've already reviewed this.")
          return
        }
        throw error
      }
      await fetchSingleEntityWithRatings()
    } catch (error) {
      console.error('Error submitting review:', error)
      setReviewError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function updateRating(ratingData) {
    try {
      setBusy(true)
      setReviewError(null)

      const { error } = await supabase
        .from('reviews')
        .update({
          rating: ratingData.rating,
          title: ratingData.title,
          review_text: ratingData.review,
          updated_at: new Date(),
        })
        .eq('id', userReview.id)
        .eq('user_id', session.user.id)

      if (error) throw error

      setIsEditing(false)
      await fetchSingleEntityWithRatings()
    } catch (error) {
      console.error('Error updating review:', error)
      setReviewError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteRating() {
    if (!window.confirm('Delete your review? This cannot be undone.')) return
    try {
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('target_id', userReview.id)
        .eq('target_type', 'review')
      if (votesError) throw votesError

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id)
        .eq('user_id', session.user.id)
      if (error) throw error

      setUserReview(null)
      setIsEditing(false)
      await fetchSingleEntityWithRatings()
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const reviews = currentEntity?.reviews || []
  const reviewCount = reviews.length
  const avgRating = useMemo(
    () =>
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0,
    [reviews, reviewCount]
  )

  const focusForm = () => {
    if (userReview) setIsEditing(true)
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    )
  }

  if (loading) {
    return (
      <div className="rupv-container rupv-detail">
        <p className="rupv-detail-status">Loading…</p>
      </div>
    )
  }

  if (!currentEntity) {
    return (
      <div className="rupv-container rupv-detail">
        <p className="rupv-detail-status">That place could not be found.</p>
        <Button variant="ghost" size="md" to="/">
          <Icon name="arrowLeft" size={18} /> Back to browse
        </Button>
      </div>
    )
  }

  const isService = currentEntity.entity_type === 'service'
  const hasCoords =
    currentEntity.latitude != null && currentEntity.longitude != null
  const zoom = currentEntity.map_zoom_level || 16

  return (
    <div className="rupv-container rupv-detail">
      <Link className="rupv-detail-back" to="/">
        <Icon name="arrowLeft" size={18} /> Browse
      </Link>

      <section className="rupv-detail-hero">
        <div className="rupv-detail-media">
          {currentEntity.image_link ? (
            <img src={currentEntity.image_link} alt="" />
          ) : (
            <div className="rupv-detail-media-empty" aria-hidden="true">
              <Icon name="building" size={56} stroke="var(--rupv-slate-soft)" />
            </div>
          )}
        </div>

        <div className="rupv-detail-info rupv-stagger">
          <div className="rupv-detail-badge" style={{ '--i': 0 }}>
            <RatingBadge value={avgRating} count={reviewCount} size="lg" />
          </div>

          <div className="rupv-detail-headings" style={{ '--i': 1 }}>
            <h1 className="rupv-h1">{currentEntity.name}</h1>
            <p className="rupv-detail-meta">
              {isService ? 'Service' : 'Facility'} ·{' '}
              {reviewCount === 0
                ? 'No reviews yet'
                : `${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
            </p>
          </div>

          {currentEntity.description && (
            <p className="rupv-detail-desc" style={{ '--i': 2 }}>{currentEntity.description}</p>
          )}

          <div className="rupv-detail-tags" style={{ '--i': 3 }}>
            <Pill>{isService ? 'Service' : 'Facility'}</Pill>
            {currentEntity.address && <Pill>{currentEntity.address}</Pill>}
          </div>

          {!isGuest && ((!userReview || isEditing) ? (
            <Button variant="slate" size="md" onClick={focusForm} style={{ '--i': 4 }}>
              <Icon name="edit" size={18} stroke="var(--rupv-cream)" /> Write a review
            </Button>
          ) : (
            <Button variant="slate" size="md" onClick={focusForm} style={{ '--i': 4 }}>
              <Icon name="edit" size={18} stroke="var(--rupv-cream)" /> Edit your review
            </Button>
          ))}
        </div>
      </section>

      {hasCoords && (
        <section className="rupv-detail-map">
          <EntityMiniMap lat={currentEntity.latitude} lng={currentEntity.longitude} zoom={zoom} />
          <Link className="rupv-detail-map-cta" to="/mappreview">
            <Icon name="map" size={16} /> Open campus map
          </Link>
        </section>
      )}

      <section className="rupv-detail-reviews">
        <div className="rupv-detail-reviews-head">
          <h2 className="rupv-h3">Student ratings</h2>
          {reviewCount > 0 && (
            <span className="rupv-detail-reviews-count">
              {reviewCount} total
            </span>
          )}
        </div>

        {reviewCount === 0 ? (
          <div className="rupv-detail-empty">
            <Icon name="message" size={36} stroke="var(--rupv-fg-3)" />
            <p className="rupv-h4">No reviews yet</p>
            <p className="rupv-body-sm">Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="rupv-review-list rupv-stagger">
            {reviews.map((review, i) => {
              const isOwn = review.user_id === session?.user?.id
              return (
                <article key={review.id} className="rupv-review" style={{ '--i': i }}>
                  <header className="rupv-review-head">
                    <Avatar name={review.user_profiles?.full_name} size={44} />
                    <div className="rupv-review-author">
                      <span className="rupv-review-name">
                        {review.user_profiles?.full_name || 'Student'}
                      </span>
                      <span className="rupv-review-date">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    <RatingBadge value={review.rating} count={1} size="sm" tone="ghost" />
                  </header>

                  {review.title && <h3 className="rupv-review-title">{review.title}</h3>}
                  {review.review_text && (
                    <p className="rupv-review-text">{review.review_text}</p>
                  )}

                  <footer className="rupv-review-foot">
                    <VoteStack
                      up={review.upvote_count || 0}
                      down={review.downvote_count || 0}
                      active={userVotes[review.id]}
                      onUp={() => handleVote(review.id, 'upvote')}
                      onDown={() => handleVote(review.id, 'downvote')}
                      disabled={isGuest}
                    />
                    <Link
                      to={`/rating/${entityId}/${review.id}`}
                      className="rupv-review-replies"
                    >
                      <Icon name="message" size={16} /> Replies
                    </Link>

                    {isOwn && !isGuest && (
                      <div className="rupv-review-own">
                        <button
                          type="button"
                          className="rupv-review-ownbtn"
                          onClick={focusForm}
                        >
                          <Icon name="edit" size={15} /> Edit
                        </button>
                        <button
                          type="button"
                          className="rupv-review-ownbtn rupv-review-ownbtn--danger"
                          onClick={deleteRating}
                        >
                          <Icon name="trash" size={15} /> Delete
                        </button>
                      </div>
                    )}
                  </footer>
                </article>
              )
            })}
          </div>
        )}

        <div className="rupv-rform-slot" ref={formRef}>
          {isGuest ? (
            <div className="rupv-rform rupv-rform-guest">
              <p className="rupv-h4">Want to share your experience?</p>
              <p className="rupv-body-sm">Log in with your UP account to write a review.</p>
              <Button variant="primary" size="md" to="/signin">Log in</Button>
            </div>
          ) : (
            <>
              {!userReview && (
                <ReviewForm
                  key="new"
                  onSubmit={submitRating}
                  error={reviewError}
                  busy={busy}
                />
              )}
              {userReview && isEditing && (
                <ReviewForm
                  key="edit"
                  initial={userReview}
                  onSubmit={updateRating}
                  onCancel={() => {
                    setIsEditing(false)
                    setReviewError(null)
                  }}
                  error={reviewError}
                  busy={busy}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Rating
