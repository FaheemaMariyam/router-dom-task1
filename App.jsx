import React from 'react'
import Registration from './registration'
import Login from './login'
import Home from './home'
import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router,Routes,Route,Link, NavLink} from 'react-router-dom'
function App() {
  return (
    <Router>
      <nav className='navbar navbar-expand-lg navbar-dark bg-dark'>
        <ul style={{display:"flex",gap:"20px"}}>
        <li >
          <NavLink className="navbar-brand" to="/">Home</NavLink>
        </li>
        <li >
          <NavLink className="navbar-brand" to="/Registration">Registration</NavLink>
        </li>
        <li >
          <NavLink  className="navbar-brand" to="/Login">Login</NavLink>
        </li>
        </ul>
      </nav>
      <div>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/Registration' element={<Registration/>}/>
          <Route path='/Login' element={<Login/>}/>
        </Routes>
      </div>
    </Router>
  )
}

export default App
