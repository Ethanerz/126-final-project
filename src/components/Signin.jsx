import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'


const Signin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {session, signInUser} = UserAuth();
  const navigate = useNavigate()
  console.log(session);

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      const result = await signInUser(email, password);

      if(result.success){
        navigate('/dashboard')
      }
    }catch(err){
      setError(err.message || "an error occured during sign-in")
    }finally{
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSignIn}action="">
        <h2>Sign In</h2>
        <p>Don't have an account? <Link to='/signup'>Sign up!</Link></p>
        <div>
          <input onChange={(e) => setEmail(e.target.value)} placeholder='Email' type="email" name="" id="" />
          <br />
          <input onChange={(e) => setPassword(e.target.value)} placeholder='Password' type="password" name="" id="" />
          <br />
          <button type='submit' disabled={loading}>Sign in</button>
        </div>
        {error && <p>{error}</p>}
      </form>
    </div>
  )
}

export default Signin
