import { useState } from "react";
import { supabase } from "../../services/supabaseClient";

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
    <div>
      <h2>Session Controls</h2>

      <p>
        Session Status: {isLive ? "Live" : "Not Live"}
      </p>


      <button
        type="button"
        onClick={() => handleSessionChange(true)}
        disabled={isUpdating || isLive}
      >
        Start Session
      </button>

      <button
        type="button"
        onClick={() => handleSessionChange(false)}
        disabled={isUpdating || !isLive}
      >
        End Session
      </button>

    </div>
  );
}

export default SessionControls;

