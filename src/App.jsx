
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import OrganizerDashboard from "./components/Organizer/OrganizerDashboard";
import ParticipantJoin from "./components/participant/ParticipantJoin";
import LoginPage from "./pages/LoginPage";
import PresentationPage from "./pages/PresentationPage";
import { supabase } from "./services/supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check the current Supabase session
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) {
        setUser(data.user);
      }

      setIsCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Wait until authentication has been checked
  if (isCheckingAuth) {
    return <p>Checking login status...</p>;
  }

  // Anonymous participants are not organizers
  const isOrganizer = Boolean(
    user && !user.is_anonymous
  );

  return (
    <Routes>
      {/* Default page */}
      <Route
        path="/"
        element={
          <Navigate
            to={isOrganizer ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      {/* Organizer login */}
      <Route
        path="/login"
        element={
          isOrganizer
            ? <Navigate to="/dashboard" replace />
            : <LoginPage />
        }
      />

      {/* Private organizer dashboard */}
      <Route
        path="/dashboard"
        element={
          isOrganizer
            ? <OrganizerDashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* Public participant page */}
      <Route
        path="/join"
        element={<ParticipantJoin />}
      />

      {/* Presentation screen */}
      <Route
        path="/present/:id"
        element={
          isOrganizer
            ? <PresentationPage />
            : <Navigate to="/login" replace />
        }
      />

      {/* Unknown URLs */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;
