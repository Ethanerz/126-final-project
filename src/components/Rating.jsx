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

    // Protect route - redirect if not logged in
    /*useEffect(() => {
        if (!session) {
            navigate('/signin')
        }
    }, [session, navigate])*/

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

    // Fetch a single entity with its reviews + reviewer names
    const fetchSingleEntityWithRatings = async () => {
    try {
        setLoading(true)
        
        // Fetch entity
        const { data: entity, error: entityError } = await supabase
        .from('entities')
        .select('*')
        .eq('id', entityId)
        .single()
        
        if (entityError) throw entityError
        
        // Fetch reviews (no sorting here)
        const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*, user_profiles(full_name)')
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })  // Keep newest first? Or remove .order() entirely
        
        if (reviewsError) throw reviewsError
        
        // ✅ SORT IN REACT by net votes (upvotes - downvotes)
        const sortedReviews = reviews?.sort((a, b) => 
        (b.upvote_count - b.downvote_count) - (a.upvote_count - a.downvote_count)
        ) || []
        
        setCurrentEntity({
        ...entity,
        reviews: sortedReviews
        })
        
    } catch (error) {
        console.error('Error fetching entity:', error)
    } finally {
        setLoading(false)
    }
    }

    // Fetch all entities (if needed)
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

    // Load all user votes in a single batch query
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

    // Handle upvote/downvote
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

    // Submit a new review
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

    // Update existing review
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

    // Delete own review
    const deleteRating = async () => {
        if (!window.confirm('Are you sure you want to delete your review?')) return

        try {
            // Delete associated votes first
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

    // Shared form — used for both submit and edit
    const ReviewForm = ({ initial, onSubmit, onCancel }) => {
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
            <form onSubmit={handleSubmit}>
                <label>
                    Rating (1-5):
                    <select
                        name="rating"
                        required
                        value={formState.rating}
                        onChange={(e) => setFormState({ ...formState, rating: e.target.value })}
                    >
                        <option value="">Select rating</option>
                        {[1, 2, 3, 4, 5].map((r) => (
                            <option key={r} value={r}>{r} ★</option>
                        ))}
                    </select>
                </label>

                <br />

                <label>
                    Review Title:
                    <br />
                    <input
                        type="text"
                        name="title"
                        required
                        placeholder="Summarize your experience"
                        value={formState.title}
                        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    />
                </label>

                <br />

                <label>
                    Your Review:
                    <br />
                    <textarea
                        name="review_text"
                        rows="4"
                        required
                        placeholder="Share your experience..."
                        style={{ resize: 'none' }}
                        value={formState.review_text}
                        onChange={(e) => setFormState({ ...formState, review_text: e.target.value })}
                    ></textarea>
                </label>
                <br />

                <button type="submit">{initial ? 'Save Changes' : 'Submit Review'}</button>
                {onCancel && (
                    <button type="button" onClick={onCancel} style={{ marginLeft: '8px' }}>
                        Cancel
                    </button>
                )}
            </form>
        )
    }

    if (loading) {
        return (
            <div className="rating-container">
                <p>Loading...</p>
            </div>
        )
    }

    if (!currentEntity) {
        return (
            <div className="rating-container">
                <p>Entity not found</p>
            </div>
        )
    }

    return (
        <div className="rating-container">
            <button
                type="button"
                className="map-back-btn"
                onClick={() => navigate(-1)}
                aria-label="Go back"
            >
                Back
            </button>
            <h1>{currentEntity.name}</h1>
            <p>{currentEntity.description}</p>
            
            {/* Display existing reviews */}
            <div className="reviews-list">
                <h2>User Reviews</h2>
                {currentEntity.reviews?.length === 0 ? (
                    <p>No reviews yet. Be the first!</p>
                ) : (
                    currentEntity.reviews.map((review) => (
                        <div key={review.id} className="review-card">
                            <small className="review-author">
                                {review.user_profiles?.full_name || 'User'}
                            </small>
                            <h3 className="review-title">{review.title}</h3>
                            <div className="review-rating">
                                <strong>Rating: {review.rating}/5</strong>
                            </div>
                            <p className="review-text">{review.review_text}</p>
                            
                            {/* Vote buttons */}
                            <div className="review-votes">
                                <button 
                                    onClick={() => handleVote(review.id, 'upvote')}
                                    className={`vote-btn upvote ${userVotes[review.id] === 'upvote' ? 'active' : ''}`}
                                >
                                    👍 {review.upvote_count || 0}
                                </button>
                                <button 
                                    onClick={() => handleVote(review.id, 'downvote')}
                                    className={`vote-btn downvote ${userVotes[review.id] === 'downvote' ? 'active' : ''}`}
                                >
                                    👎 {review.downvote_count || 0}
                                </button>
                            </div>

                            {/* Edit/Delete buttons — only show on user's own review */}
                            {review.user_id === session?.user?.id && (
                                <div className="review-actions">
                                    <button
                                        type="button"
                                        className="edit-btn"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={deleteRating}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                            
                            <Link to={`/rating/${entityId}/${review.id}`} className="replies-link">
                                <small>replies</small>
                            </Link>
                            <br />
                            <small>Posted: {new Date(review.created_at).toLocaleDateString()}</small>
                        </div>
                    ))
                )}
            </div>
            
            {/* Review form section */}
            <div className="rating-form">
                {reviewError && (
                    <p className="review-error" style={{ color: 'red' }}>{reviewError}</p>
                )}
                {!userReview || isEditing ? (
                    <>
                        <h2>{isEditing ? 'Edit Your Review' : 'Leave a Review'}</h2>
                        <ReviewForm
                            initial={isEditing ? userReview : null}
                            onSubmit={isEditing ? updateRating : submitRating}
                            onCancel={isEditing ? () => setIsEditing(false) : null}
                        />
                    </>
                ) : null}
            </div>
        </div>
    )
}

export default Rating