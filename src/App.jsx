
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OrganizerDashboard from "./components/Organizer/OrganizerDashboard";
import ParticipantJoin from "./components/participant/ParticipantJoin";
import PresentationPage from "./pages/PresentationPage";
import { supabase } from "./services/supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  
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

  
  if (isCheckingAuth) {
    return <p>Checking login status...</p>;
  }

  
  const isOrganizer = Boolean(
    user && !user.is_anonymous
  );

  return (
    <Routes>
      
      <Route path="/" element={<HomePage />} />
      
      
      <Route
        path="/login"
        element={
          isOrganizer
            ? <Navigate to="/dashboard" replace />
            : <LoginPage />
        }
      />

      
      <Route
        path="/dashboard"
        element={
          isOrganizer
            ? <OrganizerDashboard />
            : <Navigate to="/login" replace />
        }
      />

     
      <Route
        path="/join"
        element={<ParticipantJoin />}
      />

    
      <Route
        path="/present/:id"
        element={
          isOrganizer
            ? <PresentationPage />
            : <Navigate to="/login" replace />
        }
      />

      
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;
