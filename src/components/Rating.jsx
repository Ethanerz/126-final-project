import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom' // Add useParams
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import '../styles/Ratings.css'

const Rating = () => {
    const [entities, setEntities] = useState([])
    const [currentEntity, setCurrentEntity] = useState(null) // Add this for single entity
    const [loading, setLoading] = useState(true)
    const { session, signOut } = UserAuth()
    const navigate = useNavigate()
    const { entityId } = useParams() // Get entity ID from URL

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
            // Option A: If no entityId, fetch all entities (maybe for a list view)
            fetchEntitiesWithRatings()
        } else {
            setLoading(false)
        }
    }, [session, entityId])

    // Fetch a single entity with its ratings
    const fetchSingleEntityWithRatings = async () => {
        try {
            setLoading(true)
            
            // Fetch the specific entity
            const { data: entity, error: entityError } = await supabase
                .from('entities') // Your entities table name
                .select('*')
                .eq('id', entityId)
                .single()
            
            if (entityError) throw entityError
            
            // Fetch reviews for this entity (using correct column names)
            const { data: reviews, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .eq('entity_id', entityId)

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

    // Your existing fetchEntitiesWithRatings function (if needed)
    const fetchEntitiesWithRatings = async () => {
        // Keep your existing implementation
    }

    // Submit a new rating
    const submitRating = async (ratingData) => {
    try {
        const { error } = await supabase
            .from('reviews')
            .insert([
                {
                    entity_id: entityId,
                    user_id: session.user.id,
                    rating: ratingData.rating,        // Changed from 'score' to 'rating'
                    title: ratingData.title,          // Add this field
                    review_text: ratingData.review,   // Changed from 'review' to 'review_text'
                    upvote_count: 0,                  // Initialize
                    downvote_count: 0,                // Initialize
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
                                Rating: {review.rating}/5  {/* Changed from review.score */}
                            </div>
                            <h3 className="review-title">{review.title}</h3>  {/* New field */}
                            <p className="review-text">{review.review_text}</p>  {/* Changed from review.review */}
                            <div className="review-votes">
                                👍 {review.upvote_count} | 👎 {review.downvote_count}
                            </div>
                            <small>Posted: {new Date(review.created_at).toLocaleDateString()}</small>
                        </div>
                    ))
                )}
            </div>
            
            <div className="rating-form">
                <h2>Leave a Review</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    submitRating({
                        rating: parseInt(formData.get('rating')),
                        title: formData.get('title'),        // New field
                        review: formData.get('review_text')  // Match schema name
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
                            name="review_text"  // Changed from 'review'
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