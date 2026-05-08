import { Link } from 'react-router-dom'

function App() {
  return (
    <div className="app-container">
      <h1>Welcome to Our App</h1>
      <div className="button-container">
        <Link to="/signup">
          <button className="signup-btn">Sign Up</button>
        </Link>
        <br />
        <Link to="/signin">
          <button className="signin-btn">Sign In</button>
        </Link>
      </div>
    </div>
  )
}

export default App