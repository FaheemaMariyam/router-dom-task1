import React from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
    const navigate=useNavigate();
  return (

    <div className="container mt-5">
        <h1 className="text-center mb-4">Login</h1><br />

     <form action="">
      <div  className="mb-3">
        <label>User Name</label>
        <input type="text" /></div><br />
        <div  className="mb-3">
         <label>Password</label>
        <input type="text" /></div><br />
        <button type='submit'  className="btn btn-primary w-100" onClick={()=>{
            navigate("/")
        }}>Login</button>

    </form>
    </div>
  )
}

export default Login
