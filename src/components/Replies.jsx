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
                <div className="rating-shell">
                    <p>Loading…</p>
                </div>
            </div>
        )
    }

    if (!review) {
        return (
            <div className="rating-container">
                <div className="rating-shell">
                    <p>Review not found.</p>
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
                    <h1 className="rating-title">Review</h1>
                </div>

                {/* Parent review */}
                <div className="review-card">
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
                            onClick={() => handleVote('upvote')}
                            className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
                        >
                            👍 {review.upvote_count || 0}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleVote('downvote')}
                            className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
                        >
                            👎 {review.downvote_count || 0}
                        </button>
                    </div>

                    <div className="review-meta">
                        <span />
                        <span className="review-date">
                            Posted {new Date(review.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <h2 className="section-heading">Replies</h2>

                {replies.length === 0 ? (
                    <div className="empty-state">No replies yet. Be the first!</div>
                ) : (
                    replies.map((reply) => (
                        <div key={reply.id} className="review-card">
                            <span className="review-author">
                                {reply.user_profiles?.full_name || 'User'}
                            </span>
                            <p className="review-text">{reply.reply_text}</p>
                            <div className="review-meta">
                                <span />
                                <span className="review-date">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {/* Reply form */}
                <form className="form-card" onSubmit={submitReply}>
                    <h2 className="form-card-title">Leave a Reply</h2>

                    <div className="form-field">
                        <label htmlFor="reply-text">Your reply</label>
                        <textarea
                            id="reply-text"
                            rows="4"
                            required
                            placeholder="Write your reply…"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                    </div>

                    {replyError && <div className="form-error">{replyError}</div>}

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            Submit reply
                        </button>
                    </div>
                </form>

            </div>
        </div>
    )
}

export default Replies
