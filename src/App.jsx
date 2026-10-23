
import { useEffect, useState } from "react";

// --------------------------------------------------
// REACT ROUTER IMPORTS
// --------------------------------------------------

// Routes: Groups all the routes in our application.
//
// Route: Defines which component should appear
// when a specific URL is visited.
//
// Navigate: Redirects users to another route.
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --------------------------------------------------
// PAGE AND COMPONENT IMPORTS
// --------------------------------------------------

// The main landing page for RoomPulse.
import HomePage from "./pages/HomePage";

// The organizer login and account creation page.
import LoginPage from "./pages/LoginPage";

// The organizer dashboard for managing presentations.
import OrganizerDashboard from "./components/Organizer/OrganizerDashboard";

// The page where participants join a live session.
import ParticipantJoin from "./components/participant/ParticipantJoin";

// The presenter view with QR code and live results.
import PresentationPage from "./pages/PresentationPage";

// Import the shared Supabase client for authentication.
import { supabase } from "./services/supabaseClient";

// --------------------------------------------------
// MAIN APP COMPONENT
// --------------------------------------------------

// App is the main component that controls
// navigation and authentication throughout RoomPulse.
function App() {

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores the currently authenticated Supabase user.
  //
  // null means there is no authenticated user.
  const [user, setUser] = useState(null);

  // Tracks whether RoomPulse is checking
  // the user's authentication status.
  //
  // Starts as true because the application
  // needs to check authentication when it loads.
  const [isCheckingAuth, setIsCheckingAuth] =
    useState(true);

  // --------------------------------------------------
  // CHECK AUTHENTICATION STATUS
  // --------------------------------------------------

  // useEffect runs when App first mounts.
  //
  // The empty dependency array [] means this effect
  // is set up once per mount.
  //
  // It checks the current user and listens
  // for future authentication changes.
  useEffect(() => {

    // --------------------------------------------------
    // GET THE CURRENT USER
    // --------------------------------------------------

    // Ask Supabase whether someone is already signed in.
    //
    // getUser() returns a Promise.
    //
    // .then() runs when the request finishes.
    supabase.auth.getUser().then(({ data, error }) => {

      // Only update user state if Supabase
      // did not return an error.
      if (!error) {

        // Store the authenticated user.
        //
        // If nobody is signed in,
        // data.user will be null.
        setUser(data.user);
      }

      // Authentication checking is complete.
      //
      // This allows the application to
      // display the correct page.
      setIsCheckingAuth(false);
    });

    // --------------------------------------------------
    // LISTEN FOR AUTHENTICATION CHANGES
    // --------------------------------------------------

    // onAuthStateChange listens for changes such as:
    //
    // - A user signing in.
    // - A user signing out.
    // - A session being updated.
    //
    // This keeps React state synchronized
    // with Supabase Authentication.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {

        // _event contains the type of auth event.
        //
        // The underscore indicates that we
        // receive this parameter but do not use it.

        // session?.user retrieves the authenticated user
        // if a session exists.
        //
        // ?? null uses null if there is no user.
        setUser(session?.user ?? null);

        // Stop displaying the authentication
        // loading message.
        setIsCheckingAuth(false);
      }
    );

    // --------------------------------------------------
    // CLEANUP AUTHENTICATION LISTENER
    // --------------------------------------------------

    // This cleanup function runs when App unmounts.
    //
    // unsubscribe() removes the authentication listener
    // to prevent unnecessary subscriptions.
    return () => subscription.unsubscribe();

  }, []);

  // --------------------------------------------------
  // AUTHENTICATION LOADING STATE
  // --------------------------------------------------

  // While Supabase checks the login status,
  // display a temporary loading message.
  //
  // This prevents protected routes from being
  // evaluated before the initial check finishes.
  if (isCheckingAuth) {
    return (
      <p>
        Checking login status...
      </p>
    );
  }

  // --------------------------------------------------
  // CHECK WHETHER USER IS AN ORGANIZER
  // --------------------------------------------------

  // A RoomPulse organizer must:
  //
  // 1. Have an authenticated Supabase user.
  // 2. NOT be an anonymous user.
  //
  // Anonymous participants can vote without
  // creating a traditional account, but they
  // should not access organizer-only pages.
  //
  // Boolean() converts the result to true or false.
  const isOrganizer = Boolean(
    user && !user.is_anonymous
  );

  // --------------------------------------------------
  // APPLICATION ROUTES
  // --------------------------------------------------

  // Routes determines which component should
  // be displayed based on the current URL.
  return (
    <Routes>

      {/* --------------------------------------------------
          HOME PAGE
          -------------------------------------------------- */}

      {/* The homepage is publicly accessible.
          Anyone can visit this route. */}
      <Route
        path="/"
        element={<HomePage />}
      />

      {/* --------------------------------------------------
          LOGIN PAGE
          -------------------------------------------------- */}

      {/* If an organizer is already signed in,
          redirect them to the dashboard.

          Otherwise, display the LoginPage.

          replace prevents adding the redirect
          as a new browser history entry. */}
      <Route
        path="/login"
        element={
          isOrganizer
            ? <Navigate to="/dashboard" replace />
            : <LoginPage />
        }
      />

      {/* --------------------------------------------------
          ORGANIZER DASHBOARD
          -------------------------------------------------- */}

      {/* This is a protected route.

          Authenticated, non-anonymous users
          can access OrganizerDashboard.

          Other users are redirected to login. */}
      <Route
        path="/dashboard"
        element={
          isOrganizer
            ? <OrganizerDashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* --------------------------------------------------
          PARTICIPANT JOIN PAGE
          -------------------------------------------------- */}

      {/* This route is publicly accessible.

          Participants do not need to create
          an organizer account to open this page.

          ParticipantJoin handles checking
          the session and anonymous authentication. */}
      <Route
        path="/join"
        element={<ParticipantJoin />}
      />

      {/* --------------------------------------------------
          PRESENTER VIEW
          -------------------------------------------------- */}

      {/* :id is a dynamic URL parameter.

          Example:
          /present/abc123

          PresentationPage uses useParams()
          to retrieve the presentation ID.

          Only authenticated, non-anonymous users
          can access this route. */}
      <Route
        path="/present/:id"
        element={
          isOrganizer
            ? <PresentationPage />
            : <Navigate to="/login" replace />
        }
      />

      {/* --------------------------------------------------
          FALLBACK ROUTE
          -------------------------------------------------- */}

      {/* The * matches any URL that does not
          match the routes defined above.

          Redirect unknown URLs to the homepage. */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

// Export App so it can be rendered by main.jsx.
export default App;
