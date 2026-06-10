import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import ErrorState from './ui/ErrorState'
import Icon from './ui/Icon'
import Pill from './ui/Pill'
import RatingBadge from './ui/RatingBadge'
import VoteStack from './ui/VoteStack'
import { usePageTitle } from '../hooks/usePageTitle'
import { computeVoteTransition } from '../utils/votes'
import '../styles/Ratings.css'

// MapTiler SDK is heavy — only load it when an entity actually has coordinates.
const EntityMiniMap = lazy(() => import('./ui/EntityMiniMap'))

const TITLE_MAX = 120
const REVIEW_MAX = 2000

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
  const [localError, setLocalError] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    if (!rating) return
    const cleanTitle = title.trim()
    const cleanText = text.trim()
    if (!cleanTitle || !cleanText) {
      setLocalError('Your title and review can\'t be just spaces.')
      return
    }
    setLocalError(null)
    onSubmit({ rating, title: cleanTitle, review: cleanText })
  }

  const shownError = localError || error

  return (
    <form className="rupv-rform" onSubmit={submit}>
      <h3 className="rupv-h4">{initial ? 'Edit your review' : 'Write a review'}</h3>

      <div className="rupv-field">
        <span className="rupv-field-label" id="rate-label">Your rating</span>
        <div className="rupv-rate-row" role="radiogroup" aria-labelledby="rate-label">
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
          maxLength={TITLE_MAX}
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={localError && !title.trim() ? 'true' : undefined}
        />
      </label>

      <label className="rupv-field">
        <span className="rupv-field-label">Your review</span>
        <textarea
          rows="4"
          required
          maxLength={REVIEW_MAX}
          placeholder="Share the details — what was good, what could be better?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={localError && !text.trim() ? 'true' : undefined}
        />
      </label>

      {shownError && <p className="rupv-alert rupv-alert--error" role="alert">{shownError}</p>}

      <div className="rupv-rform-actions">
        <Button type="submit" variant="primary" size="md" loading={busy} disabled={!rating || busy}>
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

// Postgres rejects a malformed uuid with 22P02 — for the UI that is simply
// "no such record", not a retryable failure.
const isBadIdError = (err) => err?.code === '22P02'

async function fetchEntityWithReviews(entityId) {
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .maybeSingle()
  if (entityError) {
    if (isBadIdError(entityError)) return null
    throw entityError
  }
  if (!entity) return null

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*, user_profiles(full_name)')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
  if (reviewsError) throw reviewsError

  const sortedReviews = (reviews ?? []).sort(
    (a, b) => b.upvote_count - b.downvote_count - (a.upvote_count - a.downvote_count)
  )
  return { ...entity, reviews: sortedReviews }
}

const Rating = () => {
  const { entityId } = useParams()
  // page.key tracks which entity the current data belongs to, so loading is
  // derived (key mismatch) instead of toggled synchronously in effects.
  const [page, setPage] = useState({ key: null, entity: null, status: 'idle' })
  const [userVotes, setUserVotes] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { session, isVisitor, canWrite, openAuth } = UserAuth()
  const formRef = useRef(null)
  const confirmTimer = useRef(null)

  const loading = page.key !== entityId
  const currentEntity = loading ? null : page.entity
  const notFound = !loading && page.status === 'notfound'
  const fetchFailed = !loading && page.status === 'error'

  usePageTitle(currentEntity?.name)

  // Public data — load for everyone, signed in or not.
  useEffect(() => {
    if (!entityId) return
    let cancelled = false
    fetchEntityWithReviews(entityId)
      .then((entity) => {
        if (cancelled) return
        setPage({ key: entityId, entity, status: entity ? 'ready' : 'notfound' })
      })
      .catch((err) => {
        console.error('Error fetching entity:', err)
        if (!cancelled) setPage({ key: entityId, entity: null, status: 'error' })
      })
    return () => { cancelled = true }
  }, [entityId])

  const retry = () => {
    setPage({ key: null, entity: null, status: 'idle' })
    fetchEntityWithReviews(entityId)
      .then((entity) => setPage({ key: entityId, entity, status: entity ? 'ready' : 'notfound' }))
      .catch((err) => {
        console.error('Error fetching entity:', err)
        setPage({ key: entityId, entity: null, status: 'error' })
      })
  }

  // Refresh data in place (after review submit/edit/delete) — no skeleton,
  // because page.key still matches.
  const refresh = async () => {
    try {
      const entity = await fetchEntityWithReviews(entityId)
      setPage({ key: entityId, entity, status: entity ? 'ready' : 'notfound' })
    } catch (err) {
      console.error('Error refreshing entity:', err)
    }
  }

  // Reload the user's votes only when the *set* of reviews changes (initial
  // load, a new/removed review) — not when vote counts change — so optimistic
  // vote updates don't get clobbered by a stale refetch.
  const reviews = useMemo(() => currentEntity?.reviews ?? [], [currentEntity])
  const reviewIdsKey = reviews.map((r) => r.id).join(',')
  useEffect(() => {
    if (!session || reviewIdsKey === '') return
    let cancelled = false
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('target_id, vote_type')
          .eq('user_id', session.user.id)
          .eq('target_type', 'review')
          .in('target_id', reviewIdsKey.split(','))
        if (error) throw error
        if (cancelled) return
        const votesMap = {}
        for (const vote of data) votesMap[vote.target_id] = vote.vote_type
        setUserVotes(votesMap)
      } catch (err) {
        console.error('Error loading user votes:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [reviewIdsKey, session])

  // The signed-in user's own review — derived, not copied into state.
  const userReview = useMemo(
    () => (session ? reviews.find((r) => r.user_id === session.user.id) ?? null : null),
    [reviews, session]
  )

  // Clear any pending delete-confirm timer on unmount.
  useEffect(() => () => clearTimeout(confirmTimer.current), [])

  async function handleVote(reviewId, voteType) {
    if (!canWrite) return
    const existingVote = userVotes[reviewId]

    // Figure out the new vote and how the counts shift, then apply it to the UI
    // immediately so it feels instant. The DB write runs in the background; the
    // count columns are kept correct server-side by a trigger, so no refetch.
    const { newVote, upDelta, downDelta } = computeVoteTransition(existingVote, voteType)

    // Snapshots for rollback if the write fails.
    const prevVotes = userVotes
    const prevPage = page

    setUserVotes((prev) => {
      const next = { ...prev }
      if (newVote) next[reviewId] = newVote
      else delete next[reviewId]
      return next
    })
    setPage((prev) =>
      prev.entity
        ? {
            ...prev,
            entity: {
              ...prev.entity,
              reviews: prev.entity.reviews.map((r) =>
                r.id === reviewId
                  ? {
                      ...r,
                      upvote_count: (r.upvote_count || 0) + upDelta,
                      downvote_count: (r.downvote_count || 0) + downDelta,
                    }
                  : r
              ),
            },
          }
        : prev
    )

    try {
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
      // Write failed — undo the optimistic update.
      setUserVotes(prevVotes)
      setPage(prevPage)
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
        },
      ])

      if (error) {
        if (error.code === '23505') {
          setReviewError("You've already reviewed this.")
          return
        }
        throw error
      }
      await refresh()
    } catch (err) {
      console.error('Error submitting review:', err)
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
      await refresh()
    } catch (err) {
      console.error('Error updating review:', err)
      setReviewError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Two-step inline confirm (replaces window.confirm): first click arms it,
  // second click within 4s deletes, otherwise it disarms.
  function requestDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(() => setConfirmingDelete(false), 4000)
      return
    }
    clearTimeout(confirmTimer.current)
    setConfirmingDelete(false)
    deleteRating()
  }

  async function deleteRating() {
    try {
      setBusy(true)
      // Votes cascade-delete with the review (FK ON DELETE CASCADE); the
      // explicit cleanup is kept for older rows and is harmless otherwise.
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

      setIsEditing(false)
      await refresh()
    } catch (err) {
      console.error('Error deleting review:', err)
      setReviewError('Could not delete your review. Please try again.')
    } finally {
      setBusy(false)
    }
  }

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
      <div className="rupv-container rupv-detail" aria-busy="true">
        <div className="rupv-skeleton rupv-detail-skel-back" aria-hidden="true" />

        <section className="rupv-detail-hero" aria-hidden="true">
          <div className="rupv-detail-media rupv-detail-media--skeleton">
            <div className="rupv-skeleton rupv-detail-skel-fill" />
          </div>
          <div className="rupv-detail-info">
            <div className="rupv-skeleton rupv-detail-skel-badge" />
            <div className="rupv-skeleton rupv-detail-skel-title" />
            <div className="rupv-skeleton rupv-detail-skel-meta" />
            <div className="rupv-skeleton rupv-detail-skel-line" />
            <div className="rupv-skeleton rupv-detail-skel-line rupv-detail-skel-line--sm" />
            <div className="rupv-detail-skel-tags">
              <div className="rupv-skeleton rupv-detail-skel-pill" />
              <div className="rupv-skeleton rupv-detail-skel-pill" />
            </div>
            <div className="rupv-skeleton rupv-detail-skel-btn" />
          </div>
        </section>

        <section className="rupv-detail-reviews" aria-hidden="true">
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
                  <div className="rupv-skeleton rupv-review-skel-badge" />
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
        <Link className="rupv-detail-back" to="/">
          <Icon name="arrowLeft" size={18} /> Browse
        </Link>
        <ErrorState
          title="Couldn't load this place"
          message="The page didn't come through. Check your connection and try again."
          onRetry={retry}
        />
      </div>
    )
  }

  if (notFound || !currentEntity) {
    return (
      <div className="rupv-container rupv-detail">
        <div className="rupv-detail-gone">
          <Icon name="building" size={44} stroke="var(--rupv-fg-3)" />
          <p className="rupv-h4">That place could not be found</p>
          <p className="rupv-body-sm">It may have been removed, or the link may be wrong.</p>
          <Button variant="ghost" size="md" to="/">
            <Icon name="arrowLeft" size={18} /> Back to browse
          </Button>
        </div>
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
            <img src={currentEntity.image_link} alt={currentEntity.name} decoding="async" />
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

          {canWrite && (
            <Button variant="slate" size="md" onClick={focusForm} style={{ '--i': 4 }}>
              <Icon name="edit" size={18} stroke="var(--rupv-cream)" />{' '}
              {userReview ? 'Edit your review' : 'Write a review'}
            </Button>
          )}
        </div>
      </section>

      {hasCoords && (
        <section className="rupv-detail-map">
          <Suspense fallback={<div className="rupv-detail-map-canvas rupv-skeleton" aria-hidden="true" />}>
            <EntityMiniMap lat={currentEntity.latitude} lng={currentEntity.longitude} zoom={zoom} />
          </Suspense>
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
              const isOwn = session && review.user_id === session.user.id
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
                      disabled={!canWrite}
                    />
                    <Link
                      to={`/rating/${entityId}/${review.id}`}
                      className="rupv-review-replies"
                    >
                      <Icon name="message" size={16} /> Replies
                    </Link>

                    {isOwn && (
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
                          className={`rupv-review-ownbtn rupv-review-ownbtn--danger${confirmingDelete ? ' is-arming' : ''}`}
                          onClick={requestDelete}
                          disabled={busy}
                          aria-live="polite"
                        >
                          <Icon name="trash" size={15} />{' '}
                          {confirmingDelete ? 'Confirm delete?' : 'Delete'}
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
          {isVisitor ? (
            <div className="rupv-rform rupv-rform-guest">
              <p className="rupv-h4">Want to share your experience?</p>
              <p className="rupv-body-sm">Log in with your UP account to write a review.</p>
              <Button variant="primary" size="md" onClick={() => openAuth('signin')}>Log in</Button>
            </div>
          ) : canWrite ? (
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
                  key={`edit-${userReview.id}`}
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
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default Rating
