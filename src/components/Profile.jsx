import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { UserAuth } from '../context/AuthContext'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import ErrorState from './ui/ErrorState'
import Icon from './ui/Icon'
import { usePageTitle } from '../hooks/usePageTitle'
import '../styles/Profile.css'

const NAME_MAX = 80
const STUDENT_ID_MAX = 20

async function fetchProfileData(userId) {
    // student_id is intentionally not selectable via the table (it is private
    // to its owner). The owner reads their own value through the
    // get_my_student_id() RPC instead.
    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, created_at, updated_at')
        .eq('id', userId)
        .single()
    if (error) throw error

    // Non-fatal: if this fails we just show a blank student ID rather than
    // breaking the whole profile page.
    const { data: myStudentId } = await supabase.rpc('get_my_student_id')
    return { ...data, student_id: myStudentId ?? null }
}

const Profile = () => {
    const { session } = UserAuth()
    const navigate = useNavigate()

    // page.key tracks which user the loaded profile belongs to.
    const [page, setPage] = useState({ key: null, profile: null, error: null })
    const [isEditing, setIsEditing] = useState(false)
    const [fullName, setFullName] = useState('')
    const [studentId, setStudentId] = useState('')
    const [saveError, setSaveError] = useState(null)
    const [saving, setSaving] = useState(false)

    usePageTitle('My profile')

    const userId = session?.user?.id ?? null
    const loading = !!userId && page.key !== userId
    const profile = loading ? null : page.profile
    const fetchFailed = !loading && !!page.error

    useEffect(() => {
        if (!userId) return
        let cancelled = false
        fetchProfileData(userId)
            .then((data) => { if (!cancelled) setPage({ key: userId, profile: data, error: null }) })
            .catch((err) => {
                console.error('Error fetching profile:', err)
                if (!cancelled) setPage({ key: userId, profile: null, error: err })
            })
        return () => { cancelled = true }
    }, [userId])

    const retry = () => {
        setPage({ key: null, profile: null, error: null })
        fetchProfileData(userId)
            .then((data) => setPage({ key: userId, profile: data, error: null }))
            .catch((err) => {
                console.error('Error fetching profile:', err)
                setPage({ key: userId, profile: null, error: err })
            })
    }

    const startEditing = () => {
        setFullName(profile.full_name || '')
        setStudentId(profile.student_id || '')
        setSaveError(null)
        setIsEditing(true)
    }

    const handleSave = async () => {
        try {
            setSaveError(null)
            setSaving(true)

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    full_name: fullName.trim() || null,
                    // Store null (not '') when blank so the UNIQUE constraint
                    // doesn't trip on multiple empty student IDs.
                    student_id: studentId.trim() || null,
                    updated_at: new Date()
                })
                .eq('id', session.user.id)

            if (error) {
                // 23505 = unique_violation: that student ID is already taken.
                if (error.code === '23505') {
                    setSaveError('That student ID is already in use.')
                    return
                }
                throw error
            }

            const data = await fetchProfileData(session.user.id)
            setPage({ key: session.user.id, profile: data, error: null })
            setIsEditing(false)
        } catch (error) {
            console.error('Error saving profile:', error)
            setSaveError('Failed to save changes. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setSaveError(null)
        setIsEditing(false)
    }

    // Signed-out visitors have no profile page — bounce them home.
    // session === undefined means auth is still resolving, so wait.
    if (session === null) {
        return <Navigate to="/" replace />
    }

    if (session === undefined || loading) {
        return (
            <div className="profile-page" aria-busy="true">
                <div className="profile-shell">
                    <div className="profile-header" aria-hidden="true">
                        <div className="rupv-skeleton profile-skel-back" />
                        <div className="rupv-skeleton profile-skel-title" />
                    </div>

                    <div className="profile-card profile-card--skeleton" aria-hidden="true">
                        <div className="profile-identity">
                            <div className="rupv-skeleton profile-skel-avatar" />
                            <div className="rupv-skeleton profile-skel-name" />
                            <div className="rupv-skeleton profile-skel-badge" />
                        </div>

                        <div className="profile-fields">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="profile-field">
                                    <div className="rupv-skeleton profile-skel-label" />
                                    <div className="rupv-skeleton profile-skel-value" />
                                </div>
                            ))}
                        </div>

                        <div className="profile-actions">
                            <div className="rupv-skeleton profile-skel-btn" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (fetchFailed || !profile) {
        return (
            <div className="profile-page">
                <div className="profile-shell">
                    <ErrorState
                        title="Couldn't load your profile"
                        message="Your profile didn't come through. Check your connection and try again."
                        onRetry={retry}
                    />
                </div>
            </div>
        )
    }

    const roleClass = profile.role === 'admin' ? 'role-admin' : 'role-user'
    const displayName = profile.full_name || session.user.email?.split('@')[0] || 'Student'

    return (
        <div className="profile-page">
            <div className="profile-shell">
                <div className="profile-header">
                    <button
                        type="button"
                        className="rupv-backbtn"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <Icon name="arrowLeft" size={16} /> Back
                    </button>
                    <h1 className="profile-title">My profile</h1>
                </div>

                <div className="profile-card">
                    <div className="profile-identity">
                        <Avatar name={displayName} size={88} />
                        <h2 className="profile-name">{displayName}</h2>
                        <span className={`role-badge ${roleClass}`}>
                            {profile.role || 'student'}
                        </span>
                    </div>

                    <div className="profile-fields">

                        {/* Full name — editable */}
                        <div className="profile-field">
                            <label htmlFor="profile-full-name">Full name</label>
                            {isEditing ? (
                                <input
                                    id="profile-full-name"
                                    type="text"
                                    value={fullName}
                                    maxLength={NAME_MAX}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                    disabled={saving}
                                />
                            ) : (
                                <p>{profile.full_name || 'Not set'}</p>
                            )}
                        </div>

                        {/* Student ID — editable by the owner, private to them */}
                        <div className="profile-field">
                            <label htmlFor="profile-student-id">Student ID</label>
                            {isEditing ? (
                                <input
                                    id="profile-student-id"
                                    type="text"
                                    value={studentId}
                                    maxLength={STUDENT_ID_MAX}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="Enter your student ID"
                                    disabled={saving}
                                />
                            ) : (
                                <p>{profile.student_id || 'Not set'}</p>
                            )}
                        </div>

                        {/* Email — read only */}
                        <div className="profile-field">
                            <label htmlFor="profile-email">Email</label>
                            <p id="profile-email">{session.user.email}</p>
                        </div>

                    </div>

                    {saveError && (
                        <div className="rupv-alert rupv-alert--error" role="alert">{saveError}</div>
                    )}

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={handleSave}
                                    loading={saving}
                                >
                                    {saving ? 'Saving…' : 'Save changes'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button variant="ghost" size="md" onClick={startEditing}>
                                <Icon name="edit" size={16} /> Edit profile
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
