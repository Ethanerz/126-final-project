import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'

const Profile = () => {
    const { session } = UserAuth()
    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [fullName, setFullName] = useState('')
    const [saveError, setSaveError] = useState(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (session) {
            fetchProfile()
        }
    }, [session])

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (error) throw error

            setProfile(data)
            setFullName(data.full_name || '')
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaveError(null)
            setSaving(true)

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    full_name: fullName,
                    updated_at: new Date()
                })
                .eq('id', session.user.id)

            if (error) throw error

            await fetchProfile()
            setIsEditing(false)
        } catch (error) {
            console.error('Error saving profile:', error)
            setSaveError('Failed to save changes. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFullName(profile.full_name || '')
        setSaveError(null)
        setIsEditing(false)
    }

    if (loading) {
        return <div className="profile-container"><p>Loading...</p></div>
    }

    if (!profile) {
        return <div className="profile-container"><p>Profile not found.</p></div>
    }

    return (
        <div className="profile-container">
            <button
                type="button"
                onClick={() => navigate(-1)}
            >
                Back
            </button>

            <h1>My Profile</h1>

            <div className="profile-fields">

                {/* Full Name — editable */}
                <div className="profile-field">
                    <label>Full Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                        />
                    ) : (
                        <p>{profile.full_name || 'Not set'}</p>
                    )}
                </div>

                {/* Student ID — read only */}
                <div className="profile-field">
                    <label>Student ID</label>
                    <p>{profile.student_id || 'Not set'}</p>
                </div>

                {/* Role — read only */}
                <div className="profile-field">
                    <label>Role</label>
                    <p>{profile.role}</p>
                </div>

                {/* Email — read only */}
                <div className="profile-field">
                    <label>Email</label>
                    <p>{session.user.email}</p>
                </div>

            </div>

            {saveError && <p style={{ color: 'red' }}>{saveError}</p>}

            <div className="profile-actions">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button onClick={handleCancel} disabled={saving}>
                            Cancel
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </button>
                )}
            </div>
        </div>
    )
}

export default Profile