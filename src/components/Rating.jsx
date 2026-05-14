import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import '../styles/Ratings.css'

const Rating = () => {
    const [entities, setEntities] = useState([])
    const [currentEntity, setCurrentEntity] = useState(null)
    const [loading, setLoading] = useState(true)
    const [userVotes, setUserVotes] = useState({})
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

    // Load user's votes when reviews load
    useEffect(() => {
        if (session && currentEntity?.reviews) {
            loadUserVotes()
        }
    }, [currentEntity?.reviews, session])

    // Fetch a single entity with its reviews
    const fetchSingleEntityWithRatings = async () => {
        try {
            setLoading(true)
            
            // Fetch the specific entity
            const { data: entity, error: entityError } = await supabase
                .from('entities')
                .select('*')
                .eq('id', entityId)
                .single()
            
            if (entityError) throw entityError
            
            // Fetch reviews for this entity
            const { data: reviews, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .eq('entity_id', entityId)
                .order('created_at', { ascending: false }) // Show newest first

            if (reviewsError) throw reviewsError

            setCurrentEntity({
                ...entity,
                reviews: reviews || []
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

    // Check if user has already voted on a review
    const checkUserVote = async (reviewId) => {
        try {
            const { data, error } = await supabase
                .from('votes')
                .select('vote_type')
                .eq('target_id', reviewId)
                .eq('user_id', session.user.id)
                .eq('target_type', 'review')
                .maybeSingle()
            
            if (error) throw error
            return data?.vote_type || null
        } catch (error) {
            console.error('Error checking vote:', error)
            return null
        }
    }

    // Load all user votes for current reviews
    const loadUserVotes = async () => {
        try {
            const votesMap = {}
            for (const review of currentEntity.reviews) {
                const vote = await checkUserVote(review.id)
                if (vote) votesMap[review.id] = vote
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
            
            // If clicking the same vote type -> remove vote
            if (existingVote === voteType) {
                // Delete from votes table
                const { error: deleteError } = await supabase
                    .from('votes')
                    .delete()
                    .eq('target_id', reviewId)
                    .eq('user_id', session.user.id)
                    .eq('target_type', 'review')
                
                if (deleteError) throw deleteError
                
                // Just refresh - don't manually update counts since they'll be fetched
                await fetchSingleEntityWithRatings()
                
            } else {
                // If changing vote type or new vote, handle accordingly
                if (existingVote) {
                    // Remove old vote first
                    await supabase
                        .from('votes')
                        .delete()
                        .eq('target_id', reviewId)
                        .eq('user_id', session.user.id)
                        .eq('target_type', 'review')
                }
                
                // Add new vote
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
                
                // Just refresh - don't manually update counts
                await fetchSingleEntityWithRatings()
            }
            
        } catch (error) {
            console.error('Error handling vote:', error)
        }
    }

    // Submit a new review
    const submitRating = async (ratingData) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .insert([
                    {
                        entity_id: entityId,
                        user_id: session.user.id,
                        rating: ratingData.rating,
                        title: ratingData.title,
                        review_text: ratingData.review,
                        upvote_count: 0,
                        downvote_count: 0,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                ])
            
            if (error) throw error
            
            // Refresh the reviews after submission
            await fetchSingleEntityWithRatings()
        } catch (error) {
            console.error('Error submitting review:', error)
        }
    }

    // Render single entity page
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
                            <div className="review-rating">
                                Rating: {review.rating}/5
                            </div>
                            <h3 className="review-title">{review.title}</h3>
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
                            
                            <small>Posted: {new Date(review.created_at).toLocaleDateString()}</small>
                        </div>
                    ))
                )}
            </div>
            
            {/* Review form */}
            <div className="rating-form">
                <h2>Leave a Review</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    submitRating({
                        rating: parseInt(formData.get('rating')),
                        title: formData.get('title'),
                        review: formData.get('review_text')
                    });
                    e.target.reset();
                }}>
                    <label>
                        Rating (1-5):
                        <select name="rating" required>
                            <option value="">Select rating</option>
                            {[1,2,3,4,5].map(rating => (
                                <option key={rating} value={rating}>{rating} ★</option>
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
                        ></textarea>
                    </label>
                    <br />
                    
                    <button type="submit">Submit Review</button>
                </form>
            </div>
        </div>
    )
}

export default Rating