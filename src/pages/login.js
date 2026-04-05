import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate("/")}>
          💚 HealthCare
        </div>
      </nav>

      <div className="login-container">
        <h2>Welcome Back</h2>
        <p>Please log in to continue</p>
        <form className="login-form">
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button className="btn-filled">Login</button>
        </form>
        <p>
          Don’t have an account?{" "}
          <span className="link" onClick={() => navigate("/")}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
