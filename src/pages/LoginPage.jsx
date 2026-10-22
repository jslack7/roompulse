
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setLoginError("");
    setIsLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

      if (error) {
        setLoginError(error.message);
        return;
      }

      console.log("Organizer signed in:", data.user?.id);

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Unexpected login error:", error);
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">RoomPulse</div>

        <h1 className="login-title">Welcome Back</h1>

        <p className="login-description">
          Sign in to manage your presentations.
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="login-label" htmlFor="email">
            Email
          </label>

          <input
            className="login-input"
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label className="login-label" htmlFor="password">
            Password
          </label>

          <input
            className="login-input"
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {loginError && (
            <p className="login-error" role="alert">
              {loginError}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <Link className="login-back" to="/">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
