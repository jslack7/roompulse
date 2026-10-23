
import { useState } from "react";

// useNavigate allows us to redirect users to another page.
// Link allows users to navigate without a full page refresh.
import { useNavigate, Link } from "react-router-dom";

// Import our Supabase connection for authentication.
import { supabase } from "../services/supabaseClient";

// Import the CSS styling for this page.
import "./LoginPage.css";

// --------------------------------------------------
// LOGIN PAGE COMPONENT
// --------------------------------------------------

// This component handles two authentication actions:
//
// 1. Creating a new organizer account.
// 2. Signing in to an existing organizer account.
//
// Both actions use Supabase Authentication.
function LoginPage() {

  // --------------------------------------------------
  // REACT ROUTER
  // --------------------------------------------------

  // useNavigate gives us a function for redirecting users
  // to another route after successful authentication.
  const navigate = useNavigate();

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores the email entered by the user.
  const [email, setEmail] = useState("");

  // Stores the password entered by the user.
  const [password, setPassword] = useState("");

  // Tracks whether an authentication request is processing.
  // This helps prevent repeated submissions.
  const [isLoading, setIsLoading] = useState(false);

  // Determines which form mode is displayed.
  //
  // false = Sign In
  // true = Create Account
  const [isSignUp, setIsSignUp] = useState(false);

  // Stores authentication error messages.
  const [authError, setAuthError] = useState("");

  // Stores informational or success messages.
  // For example, instructions to confirm an email address.
  const [authMessage, setAuthMessage] = useState("");

  // --------------------------------------------------
  // HANDLE ACCOUNT CREATION OR SIGN-IN
  // --------------------------------------------------

  // This function runs when the user submits the form.
  //
  // async allows us to use await when communicating
  // with Supabase Authentication.
  async function handleSubmit(event) {

    // Prevent the browser from refreshing the page.
    event.preventDefault();

    // Clear previous error and informational messages.
    setAuthError("");
    setAuthMessage("");

    // Set loading to true while authentication is processing.
    setIsLoading(true);

    try {

      // --------------------------------------------------
      // CREATE ACCOUNT
      // --------------------------------------------------

      // Check whether the form is in Sign Up mode.
      if (isSignUp) {

        // Request a new account through Supabase.
        //
        // trim() removes extra spaces around the email.
        //
        // The password is sent as entered by the user.
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        // If Supabase returns an error,
        // display the error message and stop.
        if (error) {
          setAuthError(error.message);
          return;
        }

        // --------------------------------------------------
        // CHECK WHETHER SIGN-UP CREATED A SESSION
        // --------------------------------------------------

        // Depending on Supabase authentication settings,
        // a new account may require email confirmation.
        //
        // If a session exists, the user is signed in.
        if (data.session) {

          // Redirect the user to the organizer dashboard.
          //
          // replace: true replaces the current history entry
          // instead of adding another one.
          navigate("/dashboard", { replace: true });

        } else {

          // If there is no active session,
          // tell the user to check their email.
          setAuthMessage(
            "Check your email for a confirmation link, then return to sign in."
          );
        }

      } else {

        // --------------------------------------------------
        // SIGN IN TO AN EXISTING ACCOUNT
        // --------------------------------------------------

        // If isSignUp is false, attempt to sign in
        // using the provided email and password.
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        // Display an error if authentication fails.
        if (error) {
          setAuthError(error.message);
          return;
        }

        // Redirect the authenticated organizer
        // to their dashboard.
        navigate("/dashboard", { replace: true });
      }

    } catch (error) {

      // Handle unexpected errors during authentication.
      console.error("Authentication error:", error);

      setAuthError(
        "Something went wrong. Please try again."
      );

    } finally {

      // finally runs whether authentication succeeds
      // or fails, including when a return occurs in try.
      //
      // Reset the loading state when processing finishes.
      setIsLoading(false);
    }
  }

  // --------------------------------------------------
  // SWITCH BETWEEN SIGN-IN AND SIGN-UP
  // --------------------------------------------------

  // This function changes the authentication form mode.
  function toggleAuthMode() {

    // ! reverses the current Boolean value.
    //
    // true becomes false.
    // false becomes true.
    //
    // This switches between Sign In and Create Account.
    setIsSignUp(!isSignUp);

    // Clear previous messages when changing modes.
    setAuthError("");
    setAuthMessage("");
  }

  // --------------------------------------------------
  // LOGIN PAGE USER INTERFACE (JSX)
  // --------------------------------------------------

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ROOMPULSE BRAND */}
        <div className="login-brand">
          RoomPulse
        </div>

        {/* PAGE HEADING */}

        {/* The heading changes depending on isSignUp. */}
        <h1 className="login-title">
          {isSignUp
            ? "Create Your Account"
            : "Welcome Back"}
        </h1>

        {/* PAGE DESCRIPTION */}

        {/* Show instructions for the selected form mode. */}
        <p className="login-description">
          {isSignUp
            ? "Sign up to create and manage interactive presentations."
            : "Sign in to manage your presentations."}
        </p>

        {/* AUTHENTICATION FORM */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {/* EMAIL LABEL */}
          <label
            className="login-label"
            htmlFor="email"
          >
            Email
          </label>

          {/* EMAIL INPUT */}
          <input
            className="login-input"
            type="email"
            id="email"
            placeholder="Enter your email"

            // Controlled input:
            // Its value comes from React state.
            value={email}

            // Update email state whenever the user types.
            onChange={(event) =>
              setEmail(event.target.value)
            }

            // Require an email before form submission.
            required
          />

          {/* PASSWORD LABEL */}
          <label
            className="login-label"
            htmlFor="password"
          >
            Password
          </label>

          {/* PASSWORD INPUT */}
          <input
            className="login-input"
            type="password"
            id="password"
            placeholder="Enter your password"

            // The password is stored in React state.
            value={password}

            // Update password state when the user types.
            onChange={(event) =>
              setPassword(event.target.value)
            }

            // Require at least 6 characters.
            minLength={6}

            // Prevent submitting an empty password.
            required
          />

          {/* AUTHENTICATION ERROR MESSAGE */}

          {/* Only display this paragraph
              if authError contains a message. */}
          {authError && (
            <p
              className="login-error"
              role="alert"
            >
              {authError}
            </p>
          )}

          {/* AUTHENTICATION INFORMATION MESSAGE */}

          {/* Display instructions or confirmation
              messages when authMessage is not empty. */}
          {authMessage && (
            <p
              className="login-success"
              role="status"
            >
              {authMessage}
            </p>
          )}

          {/* SUBMIT BUTTON */}
          <button
            className="login-button"
            type="submit"

            // Disable the button during authentication.
            disabled={isLoading}
          >

            {/* Nested ternary operators change the button
                text based on loading state and form mode.

                Possible labels:
                - Creating Account...
                - Signing In...
                - Create Account
                - Sign In */}
            {isLoading
              ? isSignUp
                ? "Creating Account..."
                : "Signing In..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        {/* SWITCH AUTHENTICATION MODE */}
        <p className="login-switch">

          {/* Change the prompt depending on
              whether the user is signing up or signing in. */}
          {isSignUp
            ? "Already have an account?"
            : "Don't have an account?"}{" "}

          {/* SWITCH MODE BUTTON */}
          <button
            type="button"
            className="login-switch-button"

            // Switch between Sign In and Create Account.
            onClick={toggleAuthMode}

            // Prevent switching modes during a request.
            disabled={isLoading}
          >
            {isSignUp
              ? "Sign In"
              : "Create Account"}
          </button>
        </p>

        {/* BACK TO HOME LINK */}

        {/* Link navigates to the homepage using
            React Router without a full page reload. */}
        <Link
          className="login-back"
          to="/"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

// Export this page so it can be used
// in the application's routing configuration.
export default LoginPage;
