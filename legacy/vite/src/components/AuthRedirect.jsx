import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'

// Keeps /signin and /signup working as URLs: opens the auth modal over the
// home page instead of rendering a standalone page.
export default function AuthRedirect({ mode }) {
  const { openAuth } = UserAuth()
  useEffect(() => {
    openAuth(mode)
  }, [mode, openAuth])
  return <Navigate to="/" replace />
}
