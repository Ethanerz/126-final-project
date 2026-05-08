import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'


const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')

  const {session, signUpNewUser} = UserAuth();
  const navigate = useNavigate()
  console.log(session);

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      const result = await signUpNewUser(email, password);

      if(result.success){
        navigate('/dashboard')
      }
    }catch(err){
      setError(err.message || "an error occured during sign-up")
    }finally{
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSignUp}action="">
        <h2>Sign Up!</h2>
        <p>Already have an account? <Link to='/signin'>Sign in!</Link></p>
        <div>
          <input onChange={(e) => setEmail(e.target.value)} placeholder='Email' type="email" name="" id="" />
          <br />
          <input onChange={(e) => setPassword(e.target.value)} placeholder='Password' type="password" name="" id="" />
          <br />
          <button type='submit' disabled={loading}>Sign up</button>
        </div>
        {error && <p>{error}</p>}
      </form>
    </div>
  )
}

export default Signup
