import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import AdminPanel from './AdminPanel'
import '../styles/Dashboard.css'

const Dashboard = () => {
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingEdit, setPendingEdit] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const { session, userRole, signOut } = UserAuth()
  const navigate = useNavigate()

  const isAdmin = userRole === 'admin'

  // ========== FUNCTIONS ==========

  async function fetchEntitiesWithRatings() {
    const { data: entitiesData, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .order('name')

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError)
      setLoading(false)
      return
    }

    const entitiesWithRatings = await Promise.all(
      entitiesData.map(async (entity) => {
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('entity_id', entity.id)

        if (reviewsError) {
          return { ...entity, avgRating: 0, reviewCount: 0 }
        }

        const reviewCount = reviews.length
        const avgRating = reviewCount > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
          : 0

        return { ...entity, avgRating: Number(avgRating.toFixed(1)), reviewCount }
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

  useEffect(() => {
    if (!session) navigate('/signin')
  }, [session, navigate])

  useEffect(() => {
    if (session) fetchEntitiesWithRatings()
    else setLoading(false)
  }, [session])

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

      {isAdmin && (
        <AdminPanel
          onEntityChange={fetchEntitiesWithRatings}
          pendingEdit={pendingEdit}
          pendingDelete={pendingDelete}
          onConsumed={() => { setPendingEdit(null); setPendingDelete(null) }}
        />
      )}

      <div className="dashboard-header">
        <h1 className="dashboard-title">Rate UPV</h1>
        <p>Welcome, {session?.user?.email}</p>
        <button onClick={() => navigate('/profile')} className="profile-btn">
          My Profile
        </button>
        <button onClick={handleSignOut} className="signout-btn">
          Sign Out
        </button>
      </div>

      <div className="entities-grid">
        {entities.length === 0 ? (
          <p>No facilities or services found.</p>
        ) : (
          entities.map((entity) => (
            <div key={entity.id} className="entity-card">

              {isAdmin && (
                <div className="entity-admin-actions">
                  <button
                    className="entity-admin-btn entity-admin-btn--edit"
                    title="Edit"
                    onClick={() => setPendingEdit(entity)}
                  >
                    ✎
                  </button>
                  <button
                    className="entity-admin-btn entity-admin-btn--delete"
                    title="Delete"
                    onClick={() => setPendingDelete(entity)}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="rating-section">
                <div className="rating-number">{entity.avgRating}</div>
                <div className="rating-stars">
                  {'★'.repeat(Math.floor(entity.avgRating))}
                  {'☆'.repeat(5 - Math.floor(entity.avgRating))}
                </div>
                <div className="review-count">({entity.reviewCount} reviews)</div>
              </div>

              <div className="entity-info">
                <h3><Link to={`/rating/${entity.id}`}>{entity.name}</Link></h3>
                <p className="entity-type">
                  {entity.entity_type === 'facility' ? '🏛️ Facility' : '🛎️ Service'}
                </p>
                <p className="entity-description">
                  {entity.description || 'No description available'}
                </p>
              </div>

              <div className="entity-image">
                <div className="image-placeholder">📸</div>
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