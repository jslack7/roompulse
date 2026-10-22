
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import ParticipantVoting from "./ParticipantVoting";
import styles from "./ParticipantJoin.module.css";

function ParticipantJoin() {
  const [searchParams] = useSearchParams();
  const [sessionCode, setSessionCode] = useState(
    searchParams.get("session") ?? ""
  );
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
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.brand}>RoomPulse</p>

          <h2 className={styles.title}>Join a Session</h2>

          <p className={styles.description}>
            Enter your session code to participate in a live poll.
          </p>

          <form className={styles.form} onSubmit={handleJoin}>
            <label className={styles.label} htmlFor="sessionCode">
              Session Code
            </label>

            <input
              className={styles.input}
              id="sessionCode"
              type="text"
              value={sessionCode}
              onChange={(event) => setSessionCode(event.target.value)}
              placeholder="Enter session code"
            />

            <button
              className={styles.joinButton}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Joining..." : "Join Session"}
            </button>
          </form>

          {error && (
            <p className={styles.errorMessage} role="alert">
              {error}
            </p>
          )}
        </div>

        {joinedPresentation && (
          <div className={styles.successCard}>
            <h3 className={styles.successTitle}>
              Successfully Joined!
            </h3>

            <p className={styles.presentationName}>
              <strong>Presentation:</strong> {joinedPresentation.title}
            </p>

            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              Session Live
            </span>

            <div className={styles.votingSection}>
              <ParticipantVoting
                presentationId={joinedPresentation.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default ParticipantJoin;
