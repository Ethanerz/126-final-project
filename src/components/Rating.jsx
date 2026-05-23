import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import '../styles/Ratings.css'

const Rating = () => {
    const [entities, setEntities] = useState([])
    const [currentEntity, setCurrentEntity] = useState(null)
    const [loading, setLoading] = useState(true)
    const [userVotes, setUserVotes] = useState({})
    const [userReview, setUserReview] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [reviewError, setReviewError] = useState(null)
    const { session } = UserAuth()
    const navigate = useNavigate()
    const { entityId } = useParams()

    // Fetch specific entity data
    useEffect(() => {
        if (session && entityId) {
            fetchSingleEntityWithRatings()
        } else if (session && !entityId) {
            fetchEntitiesWithRatings()
        } else {
            setLoading(false)
        }
    }, [session, entityId])

    // Load user's votes when reviews load + find user's own review
    useEffect(() => {
        if (session && currentEntity?.reviews?.length > 0) {
            loadUserVotes()
        }
        if (session && currentEntity?.reviews) {
            const existing = currentEntity.reviews.find(
                (r) => r.user_id === session.user.id
            )
            setUserReview(existing || null)
        }
    }, [currentEntity?.reviews, session])

    const fetchSingleEntityWithRatings = async () => {
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

            const sortedReviews = reviews?.sort((a, b) =>
                (b.upvote_count - b.downvote_count) - (a.upvote_count - a.downvote_count)
            ) || []

            setCurrentEntity({ ...entity, reviews: sortedReviews })
        } catch (error) {
            console.error('Error fetching entity:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchEntitiesWithRatings = async () => {
        try {
            setLoading(true)
            const { data: entities, error } = await supabase
                .from('entities')
                .select('*')

            if (error) throw error
            setEntities(entities || [])
        } catch (error) {
            console.error('Error fetching entities:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadUserVotes = async () => {
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
            for (const vote of data) {
                votesMap[vote.target_id] = vote.vote_type
            }
            setUserVotes(votesMap)
        } catch (error) {
            console.error('Error loading user votes:', error)
        }
    }

    const handleVote = async (reviewId, voteType) => {
        try {
            const existingVote = userVotes[reviewId]

            if (existingVote === voteType) {
                const { error: deleteError } = await supabase
                    .from('votes')
                    .delete()
                    .eq('target_id', reviewId)
                    .eq('user_id', session.user.id)
                    .eq('target_type', 'review')

                if (deleteError) throw deleteError
                await fetchSingleEntityWithRatings()
            } else {
                if (existingVote) {
                    await supabase
                        .from('votes')
                        .delete()
                        .eq('target_id', reviewId)
                        .eq('user_id', session.user.id)
                        .eq('target_type', 'review')
                }

                const { error: insertError } = await supabase
                    .from('votes')
                    .insert([{
                        user_id: session.user.id,
                        target_id: reviewId,
                        target_type: 'review',
                        vote_type: voteType,
                        created_at: new Date()
                    }])

                if (insertError) throw insertError
                await fetchSingleEntityWithRatings()
            }
        } catch (error) {
            console.error('Error handling vote:', error)
        }
    }

    const submitRating = async (ratingData) => {
        try {
            setReviewError(null)

            const { error } = await supabase
                .from('reviews')
                .insert([{
                    entity_id: entityId,
                    user_id: session.user.id,
                    rating: ratingData.rating,
                    title: ratingData.title,
                    review_text: ratingData.review,
                    upvote_count: 0,
                    downvote_count: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                }])

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
        }
    }

    const updateRating = async (ratingData) => {
        try {
            setReviewError(null)

            const { error } = await supabase
                .from('reviews')
                .update({
                    rating: ratingData.rating,
                    title: ratingData.title,
                    review_text: ratingData.review,
                    updated_at: new Date()
                })
                .eq('id', userReview.id)
                .eq('user_id', session.user.id)

            if (error) throw error

            setIsEditing(false)
            await fetchSingleEntityWithRatings()
        } catch (error) {
            console.error('Error updating review:', error)
        }
    }

    const deleteRating = async () => {
        if (!window.confirm('Are you sure you want to delete your review?')) return

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

    // ── Shared review form ────────────────────────────────────────────────
    const ReviewForm = ({ initial, onSubmit, onCancel, error }) => {
        const [formState, setFormState] = useState({
            rating: initial?.rating || '',
            title: initial?.title || '',
            review_text: initial?.review_text || ''
        })

        const handleSubmit = (e) => {
            e.preventDefault()
            onSubmit({
                rating: parseInt(formState.rating),
                title: formState.title,
                review: formState.review_text
            })
        }

        return (
            <form className="form-card" onSubmit={handleSubmit}>
                <h2 className="form-card-title">
                    {initial ? 'Edit Your Review' : 'Leave a Review'}
                </h2>

                <div className="form-field">
                    <label htmlFor="review-rating">Rating</label>
                    <select
                        id="review-rating"
                        required
                        value={formState.rating}
                        onChange={(e) => setFormState({ ...formState, rating: e.target.value })}
                    >
                        <option value="">Select a rating</option>
                        {[1, 2, 3, 4, 5].map((r) => (
                            <option key={r} value={r}>{r} ★</option>
                        ))}
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="review-title">Title</label>
                    <input
                        id="review-title"
                        type="text"
                        required
                        placeholder="Summarize your experience"
                        value={formState.title}
                        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="review-text">Your review</label>
                    <textarea
                        id="review-text"
                        rows="4"
                        required
                        placeholder="Share your experience…"
                        value={formState.review_text}
                        onChange={(e) => setFormState({ ...formState, review_text: e.target.value })}
                    />
                </div>

                {error && <div className="form-error">{error}</div>}

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        {initial ? 'Save changes' : 'Submit review'}
                    </button>
                    {onCancel && (
                        <button type="button" className="btn btn-ghost" onClick={onCancel}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        )
    }

    if (loading) {
        return (
            <div className="rating-container">
                <div className="rating-shell">
                    <p>Loading…</p>
                </div>
            </div>
        )
    }

    if (!currentEntity) {
        return (
            <div className="rating-container">
                <div className="rating-shell">
                    <p>Entity not found.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="rating-container">
            <div className="rating-shell">

                <div className="rating-header">
                    <button
                        type="button"
                        className="back-btn"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        Back
                    </button>
                    <h1 className="rating-title">{currentEntity.name}</h1>
                </div>

                {currentEntity.description && (
                    <div className="entity-meta">
                        <p>{currentEntity.description}</p>
                    </div>
                )}

                <h2 className="section-heading">User Reviews</h2>

                {currentEntity.reviews?.length === 0 ? (
                    <div className="empty-state">No reviews yet. Be the first!</div>
                ) : (
                    currentEntity.reviews.map((review) => {
                        const isOwn = review.user_id === session?.user?.id
                        return (
                            <div key={review.id} className="review-card">
                                <span className="review-author">
                                    {review.user_profiles?.full_name || 'User'}
                                </span>
                                <h3 className="review-title">{review.title}</h3>
                                <div className="review-rating">
                                    <strong>{review.rating}/5</strong>
                                    <span className="review-stars">
                                        {'★'.repeat(review.rating)}
                                        {'☆'.repeat(5 - review.rating)}
                                    </span>
                                </div>
                                <p className="review-text">{review.review_text}</p>

                                <div className="review-votes">
                                    <button
                                        type="button"
                                        onClick={() => handleVote(review.id, 'upvote')}
                                        className={`vote-btn upvote ${userVotes[review.id] === 'upvote' ? 'active' : ''}`}
                                    >
                                        👍 {review.upvote_count || 0}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleVote(review.id, 'downvote')}
                                        className={`vote-btn downvote ${userVotes[review.id] === 'downvote' ? 'active' : ''}`}
                                    >
                                        👎 {review.downvote_count || 0}
                                    </button>
                                </div>

                                {isOwn && (
                                    <div className="review-actions">
                                        <button
                                            type="button"
                                            className="review-action-btn"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="review-action-btn danger"
                                            onClick={deleteRating}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}

                                <div className="review-meta">
                                    <Link to={`/rating/${entityId}/${review.id}`} className="replies-link">
                                        Replies →
                                    </Link>
                                    <span className="review-date">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}

                {(!userReview || isEditing) && (
                    <ReviewForm
                        initial={isEditing ? userReview : null}
                        onSubmit={isEditing ? updateRating : submitRating}
                        onCancel={isEditing ? () => setIsEditing(false) : null}
                        error={reviewError}
                    />
                )}

            </div>
        </div>
    )
}

export default Rating
