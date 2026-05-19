import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import '../styles/Ratings.css'

const Replies = () => {
    const [review, setReview] = useState(null)
    const [replies, setReplies] = useState([])
    const [loading, setLoading] = useState(true)
    const [userVote, setUserVote] = useState(null)
    const [replyText, setReplyText] = useState('')
    const [replyError, setReplyError] = useState(null)
    const { session } = UserAuth()
    const navigate = useNavigate()
    const { entityId, reviewId } = useParams()

    useEffect(() => {
        if (session && reviewId) {
            fetchReview()
        } else {
            setLoading(false)
        }
    }, [session, reviewId])

    useEffect(() => {
        if (session && review) {
            loadUserVote()
        }
    }, [review, session])

    const fetchReview = async () => {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .from('reviews')
                .select('*, user_profiles(full_name)')
                .eq('id', reviewId)
                .single()

            if (error) throw error
            setReview(data)

            // Fetch replies for this review
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

    const loadUserVote = async () => {
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

    const handleVote = async (voteType) => {
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
                await supabase
                    .from('votes')
                    .insert([{
                        user_id: session.user.id,
                        target_id: reviewId,
                        target_type: 'review',
                        vote_type: voteType,
                        created_at: new Date()
                    }])
            }
            await fetchReview()
        } catch (error) {
            console.error('Error handling vote:', error)
        }
    }

    const submitReply = async (e) => {
        e.preventDefault()
        setReplyError(null)

        try {
            const { error } = await supabase
                .from('review_replies')
                .insert([{
                    review_id: reviewId,
                    user_id: session.user.id,
                    parent_reply_id: null,
                    reply_text: replyText,
                    upvote_count: 0,
                    downvote_count: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                }])

            if (error) throw error

            setReplyText('')
            await fetchReview()
        } catch (error) {
            console.error('Error submitting reply:', error)
            setReplyError('Failed to submit reply. Please try again.')
        }
    }

    if (loading) {
        return (
            <div className="rating-container">
                <p>Loading...</p>
            </div>
        )
    }

    if (!review) {
        return (
            <div className="rating-container">
                <p>Review not found</p>
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

            {/* Parent review card */}
            <div className="review-card">
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
                        onClick={() => handleVote('upvote')}
                        className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
                    >
                        👍 {review.upvote_count || 0}
                    </button>
                    <button
                        onClick={() => handleVote('downvote')}
                        className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
                    >
                        👎 {review.downvote_count || 0}
                    </button>
                </div>

                <small>Posted: {new Date(review.created_at).toLocaleDateString()}</small>
            </div>

            {/* Replies list */}
            <div className="reviews-list">
                <h2>Replies</h2>
                {replies.length === 0 ? (
                    <p>No replies yet. Be the first!</p>
                ) : (
                    replies.map((reply) => (
                        <div key={reply.id} className="review-card">
                            <small className="review-author">
                                {reply.user_profiles?.full_name || 'User'}
                            </small>
                            <p className="review-text">{reply.reply_text}</p>
                            <small>Posted: {new Date(reply.created_at).toLocaleDateString()}</small>
                        </div>
                    ))
                )}
            </div>

            {/* Reply form */}
            <div className="rating-form">
                <h2>Leave a Reply</h2>
                {replyError && (
                    <p className="review-error" style={{ color: 'red' }}>{replyError}</p>
                )}
                <form onSubmit={submitReply}>
                    <label>
                        Your Reply:
                        <br />
                        <textarea
                            rows="4"
                            required
                            placeholder="Write your reply..."
                            style={{ resize: 'none' }}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        ></textarea>
                    </label>
                    <br />
                    <button type="submit">Submit Reply</button>
                </form>
            </div>
        </div>
    )
}

export default Replies