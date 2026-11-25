
export type UserRole = "Admin" | "Staff";

import { useState, type FormEvent } from "react";

type LoginProps = {
  onLogin: (email: string, role: UserRole) => void;
};

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const enteredEmail = email.trim().toLowerCase();

    if (enteredEmail === "admin@sid.com" && password === "Admin@123") {
      onLogin(enteredEmail, "Admin");
    } else if (
      enteredEmail === "staff@sid.com" &&
      password === "Staff@123"
    ) {
      onLogin(enteredEmail, "Staff");
    } else {
      setError("Invalid email or password. Please try again.");
    }
  }

  return (
    <div className="login-page">

      {/* LEFT BRANDING SECTION */}
      <div className="login-left">
        <div className="login-brand-content">

          <div className="login-logo">🍘</div>

          <h1>South Indian</h1>
          <h2>Traditional Dishes</h2>

          <div className="brand-line"></div>

          <h3>Manufacturing Management System</h3>

          <p>
            Bringing traditional South Indian snacks
            to every home with quality and care.
          </p>

          <div className="food-categories">
            <span>Murukku</span>
            <span>Mixture</span>
            <span>Chips</span>
            <span>Sweets</span>
          </div>

        </div>
      </div>

      {/* RIGHT LOGIN SECTION */}
      <div className="login-right">

        <div className="login-card">

          <h1>Welcome Back!</h1>

          <p className="login-description">
            Please login to access your account.
          </p>

          <form onSubmit={handleLogin}>

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
            />

            {error && (
              <p className="login-error">{error}</p>
            )}

            <button type="submit">
              Login
            </button>

          </form>

          {/* DEMO CREDENTIALS */}
          <div className="demo-credentials">

            <strong>Demo Login Credentials</strong>

            <p><b>Admin:</b> admin@sid.com</p>
            <p><b>Password:</b> Admin@123</p>

            <div className="credential-divider"></div>

            <p><b>Staff:</b> staff@sid.com</p>
            <p><b>Password:</b> Staff@123</p>

          </div>

          <p className="login-footer">
            © 2026 South Indian Traditional Dishes
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;
