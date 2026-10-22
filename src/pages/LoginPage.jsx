
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(error.message);
          return;
        }

        if (data.session) {
          navigate("/dashboard", { replace: true });
        } else {
          setAuthMessage(
            "Check your email for a confirmation link, then return to sign in."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(error.message);
          return;
        }

        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleAuthMode() {
    setIsSignUp(!isSignUp);
    setAuthError("");
    setAuthMessage("");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">RoomPulse</div>

        <h1 className="login-title">
          {isSignUp ? "Create Your Account" : "Welcome Back"}
        </h1>

        <p className="login-description">
          {isSignUp
            ? "Sign up to create and manage interactive presentations."
            : "Sign in to manage your presentations."}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
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
            minLength={6}
            required
          />

          {authError && (
            <p className="login-error" role="alert">
              {authError}
            </p>
          )}

          {authMessage && (
            <p className="login-success" role="status">
              {authMessage}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? isSignUp
                ? "Creating Account..."
                : "Signing In..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <p className="login-switch">
          {isSignUp
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            className="login-switch-button"
            onClick={toggleAuthMode}
            disabled={isLoading}
          >
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </p>

        <Link className="login-back" to="/">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
