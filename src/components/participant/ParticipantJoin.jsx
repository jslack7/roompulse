
import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import ParticipantVoting from "./ParticipantVoting";

function ParticipantJoin() {
  const [sessionCode, setSessionCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [joinedPresentation, setJoinedPresentation] = useState(null);

  async function handleJoin(event) {
    event.preventDefault();

    const cleanedCode = sessionCode.trim();

    if (!cleanedCode) {
      setError("Please enter a session code.");
      return;
    }

    setError("");
    setIsLoading(true);
    setJoinedPresentation(null);

    try {
      // Look for a presentation with this ID
      const { data, error: fetchError } = await supabase
        .from("presentations")
        .select("id, title, is_live")
        .eq("id", cleanedCode)
        .maybeSingle();

      if (fetchError) {
        console.error("Error joining session:", fetchError);
        setError("Unable to join this session. Check your code.");
        return;
      }

      if (!data) {
        setError("Session not found.");
        return;
      }

      if (!data.is_live) {
        setError("This session is not currently live.");
        return;
      }

      const { data: sessionData, error : sessionError } = 
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error checking participant session:", sessionError);
        setError("Unable to verify your session. Please try again.");
        return;
      }

      if (!sessionData.session) {
        const { error: signInError } =
          await supabase.auth.signInAnonymously();

      if (signInError) {
        console.error("Anonymous sign-in error:", signInError);
        setError("Unable to join as a participant. Please try again.");
        return;
      }
      }


      // Save the presentation after successful validation
      setJoinedPresentation(data);
    } catch (unexpectedError) {
      console.error("Unexpected join error:", unexpectedError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h2>Join a Session</h2>
      <p>Enter your session code to participate in a live poll.</p>

      <form onSubmit={handleJoin}>
        <label htmlFor="sessionCode">Session Code</label>

        <input
          id="sessionCode"
          type="text"
          value={sessionCode}
          onChange={(event) => setSessionCode(event.target.value)}
          placeholder="Enter session code"
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Joining..." : "Join Session"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {joinedPresentation && (
        <div>
          <h3>Successfully Joined!</h3>
          <p>Presentation: {joinedPresentation.title}</p>
          <p>Session Status: Live</p>

          <ParticipantVoting presentationId={joinedPresentation.id} />
        </div>
      )}
    </div>
  );
}

export default ParticipantJoin;
