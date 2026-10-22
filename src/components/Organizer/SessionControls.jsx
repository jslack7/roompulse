import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import styles from "./SessionControls.module.css";

function SessionControls({
  presentationId,
  initialIsLive = false,
  onSessionChange,

}) {
  const [isLive, setIsLive] = useState(initialIsLive);

  const [isUpdating, setIsUpdating] = useState(false);

  async function handleSessionChange(newStatus) {
    if (!presentationId) {
      alert("Please select a presentation first.");
      return;
    }

    setIsUpdating(true);

    try {
      let error = null;
      let updatedStatus = newStatus;

      if (newStatus === false) {
        const result = await supabase.rpc("end_polling_session", {
          p_presentation_id: presentationId,
        });

        error = result.error;
        updatedStatus = false;
      } else {
        const result = await supabase
          .from("presentations")
          .update({ is_live: true })
          .eq("id", presentationId)
          .select("id, is_live")
          .single();
        
          error = result.error;

          if (!error) {
            updatedStatus = result.data.is_live;
          }
      }

      if (error) {
        console.error("Error updating session:", error);
        alert("Unable to update the session.");
        return;
      }

      setIsLive(updatedStatus);
      onSessionChange?.();
    } catch (error) {
      console.error("Unexpected session error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsUpdating(false);
    }
      
  }

  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Session Controls</h2>

      <div className={styles.statusRow}>
        <p className={styles.statusLabel}>Session Status:</p>

        <span
          className={
            isLive ? styles.statusLive : styles.statusInactive
          }
        >
          <span className={styles.statusDot} />
          {isLive ? "Live" : "Not Live"}
        </span>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.startButton}
          type="button"
          onClick={() => handleSessionChange(true)}
          disabled={isUpdating || isLive}
        >
          {isUpdating ? "Updating..." : "Start Session"}
        </button>

        <button
          className={styles.endButton}
          type="button"
          onClick={() => handleSessionChange(false)}
          disabled={isUpdating || !isLive}
        >
          {isUpdating ? "Updating..." : "End Session"}
        </button>
      </div>
    </div>
  );
}

export default SessionControls;

