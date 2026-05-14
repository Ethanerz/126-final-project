import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import '../styles/Dashboard.css'

const Dashboard = () => {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const { session, signOut } = UserAuth()
  const navigate = useNavigate()

  // ========== FUNCTIONS ==========
  
  async function fetchEntitiesWithRatings() {
    // Step 1: Fetch all entities
    const { data: entitiesData, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .order('name')
    
    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError)
      setLoading(false)
      return
    }

    // Step 2: For each entity, calculate average rating from reviews
    const entitiesWithRatings = await Promise.all(
      entitiesData.map(async (entity) => {
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('entity_id', entity.id)
        
        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError)
          return { ...entity, avgRating: 0, reviewCount: 0 }
        }
        
        const reviewCount = reviews.length
        const avgRating = reviewCount > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
          : 0
        
        return {
          ...entity,
          avgRating: Number(avgRating.toFixed(1)),
          reviewCount
        }
      })
    )
    
    setEntities(entitiesWithRatings)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // ========== EFFECTS ==========
  
  // Protect route - redirect if not logged in
  useEffect(() => {
    if (!session) {
      navigate('/signin')
    }
  }, [session, navigate])

  // Fetch entities when logged in - ONLY ONE Effect that handles both auth check AND data fetch
  useEffect(() => {
    if (session) {
      fetchEntitiesWithRatings()
    } else {
      setLoading(false)  // Handle case where there's no session
    }
  }, [session])  // Only depends on session, not on loading

  // ========== RENDER ==========
  
  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Loading facilities and services...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Rate UPV</h1>
        <p>Welcome, {session?.user?.email}</p>
        <button onClick={handleSignOut} className="signout-btn">
          Sign Out
        </button>
      </div>

      <div className="entities-grid">
        {entities.length === 0 ? (
          <p>No facilities or services found. Add some in the Supabase Table Editor.</p>
        ) : (
          entities.map((entity) => (
            <div key={entity.id} className="entity-card">
              <div className="rating-section">
                <div className="rating-number">{entity.avgRating}</div>
                <div className="rating-stars">
                  {'★'.repeat(Math.floor(entity.avgRating))}
                  {'☆'.repeat(5 - Math.floor(entity.avgRating))}
                </div>
                <div className="review-count">({entity.reviewCount} reviews)</div>
              </div>

              <div className="entity-info">
                <h3>{entity.name}</h3>
                <p className="entity-type">{entity.entity_type === 'facility' ? '🏛️ Facility' : '🛎️ Service'}</p>
                <p className="entity-description">{entity.description || 'No description available'}</p>
                <p className="entity-location">📍 {entity.address || 'Location not specified'}</p>
              </div>

              <div className="entity-image">
                <div className="image-placeholder">
                  📸
                </div>
              </div>
            </div>
          ))
        )}
        <Link to="/mappreview">
          <button className="mappreview">Go to Map</button>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard