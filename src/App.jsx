
import { useState, useEffect } from "react";
import OrganizerDashboard from "./components/Organizer/OrganizerDashboard";
import LoginPage from "./pages/LoginPage";
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isCheckingAuth) {
    return <p>Checking login status...</p>;
  }

  return (
    <div>
      {user ? <OrganizerDashboard /> : <LoginPage />}
    </div>
  );
}

export default App;
