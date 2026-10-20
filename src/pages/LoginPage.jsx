import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";


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
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (error) {
                setLoginError(error.message);
                return;
            }

            console.log("Organizer signed in:", data.user?.id);

            navigate("/dashboard", { replace: true });
        }   catch (error) {
            console.error("Unexpected login error:", error);
        }   finally {
            setIsLoading(false);
        }
    }

   return (
     <div>
       <h1>RoomPulse Login</h1>
       <p>Sign in to manage your presentations.</p>

       <form onSubmit={handleLogin}>
         <label htmlFor="email">Email:</label>
         <input
           type="email"
           id="email"
           placeholder="Enter your email"
           value={email}
           onChange={(event) => setEmail(event.target.value)}
           required
           />

         <label htmlFor="password">Password:</label>
         <input
           type="password"
           id="password"
           placeholder="Enter your password"
           value={password}
           onChange={(event) => setPassword(event.target.value)}
           required
           />

            {loginError && <p role="alert">{loginError}</p>}
           <button type="submit" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
           </button>
       </form>
     </div>
   )
 }

export default LoginPage;
