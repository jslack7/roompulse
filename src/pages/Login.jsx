import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMsg(error.message);
    else setMsg("Signed up. Now click Sign in.");
  }

  async function handleSignIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setMsg(error.message);
    else {
      setMsg("Signed in!");
      navigate("/dashboard");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Organizer login</h2>

      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <button onClick={handleSignUp}>Sign up</button>{" "}
        <button onClick={handleSignIn}>Sign in</button>
      </div>

      <p>{msg}</p>
    </div>
  );
}