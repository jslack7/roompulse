
import { useState } from "react";

// Import our Supabase connection for database operations.
import { supabase } from "../../services/supabaseClient";

// Import CSS Module styling for this component.
import styles from "./SessionControls.module.css";

// This component allows an organizer to start or end
// a live polling session for a selected presentation.
//
// It receives three props from OrganizerDashboard:
//
// presentationId: The ID of the selected presentation.
//
// initialIsLive: The presentation's current live status.
// Defaults to false if no value is provided.
//
// onSessionChange: A callback function that notifies
// the parent component when the session status changes.
function SessionControls({
  presentationId,
  initialIsLive = false,
  onSessionChange,
}) {

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores whether the polling session is currently live.
  //
  // The initial value comes from the initialIsLive prop.
  // true = Live
  // false = Not Live
  const [isLive, setIsLive] = useState(initialIsLive);

  // Tracks whether a request to update the session
  // is currently being processed.
  //
  // This prevents the organizer from clicking
  // Start or End repeatedly during a request.
  const [isUpdating, setIsUpdating] = useState(false);

  // --------------------------------------------------
  // START OR END A POLLING SESSION
  // --------------------------------------------------

  // This function handles both starting and ending a session.
  //
  // newStatus determines the requested action:
  // true = Start Session
  // false = End Session
  async function handleSessionChange(newStatus) {

    // Make sure a presentation has been selected.
    if (!presentationId) {
      alert("Please select a presentation first.");
      return;
    }

    // Mark the session as updating.
    // This disables both buttons while the request runs.
    setIsUpdating(true);

    try {

      // Store any error returned by Supabase.
      let error = null;

      // Start with the requested status.
      let updatedStatus = newStatus;

      // --------------------------------------------------
      // END SESSION
      // --------------------------------------------------

      if (newStatus === false) {

        // Call a PostgreSQL database function through Supabase.
        //
        // rpc() stands for Remote Procedure Call.
        //
        // end_polling_session is a database function
        // that handles ending the selected polling session.
        //
        // We pass the presentation ID so the function
        // knows which session to end.
        const result = await supabase.rpc(
          "end_polling_session",
          {
            p_presentation_id: presentationId,
          }
        );

        // Store any error returned by the function.
        error = result.error;

        // The requested session status is now inactive.
        updatedStatus = false;

      } else {

        // --------------------------------------------------
        // START SESSION
        // --------------------------------------------------

        // Update the selected presentation in Supabase.
        //
        // .from("presentations") selects the database table.
        //
        // .update({ is_live: true }) sets its live status.
        //
        // .eq("id", presentationId) updates only the
        // presentation with the matching ID.
        //
        // .select() returns the updated presentation data.
        //
        // .single() expects one matching record.
        const result = await supabase
          .from("presentations")
          .update({ is_live: true })
          .eq("id", presentationId)
          .select("id, is_live")
          .single();

        // Check whether Supabase returned an error.
        error = result.error;

        // If the update succeeded, use the live status
        // returned by the database.
        if (!error) {
          updatedStatus = result.data.is_live;
        }
      }

      // --------------------------------------------------
      // HANDLE DATABASE ERRORS
      // --------------------------------------------------

      // If either database operation failed,
      // display an error and stop the function.
      if (error) {
        console.error("Error updating session:", error);
        alert("Unable to update the session.");
        return;
      }

      // --------------------------------------------------
      // UPDATE THE USER INTERFACE
      // --------------------------------------------------

      // Update React state after the database operation
      // completes successfully.
      //
      // This changes the displayed session status
      // between Live and Not Live.
      setIsLive(updatedStatus);

      // Notify OrganizerDashboard that the session changed.
      //
      // The parent component uses this callback to refresh
      // presentation information and active question data.
      //
      // ?. is optional chaining.
      // It calls the function only if one was provided.
      onSessionChange?.();

    } catch (error) {

      // Handle unexpected errors during the request.
      console.error(
        "Unexpected session error:",
        error
      );

      alert("Something went wrong. Please try again.");

    } finally {

      // finally runs whether the request succeeds or fails.
      //
      // Reset the updating state so the buttons
      // can be used again.
      setIsUpdating(false);
    }
  }

  // --------------------------------------------------
  // COMPONENT USER INTERFACE (JSX)
  // --------------------------------------------------

  return (
    <div className={styles.container}>

      {/* SECTION HEADING */}
      <h2 className={styles.title}>
        Session Controls
      </h2>

      {/* SESSION STATUS DISPLAY */}
      <div className={styles.statusRow}>

        <p className={styles.statusLabel}>
          Session Status:
        </p>

        {/* Apply different CSS classes based on
            whether the presentation is live. */}
        <span
          className={
            isLive
              ? styles.statusLive
              : styles.statusInactive
          }
        >

          {/* Decorative status indicator dot */}
          <span className={styles.statusDot} />

          {/* Display the current session status. */}
          {isLive ? "Live" : "Not Live"}
        </span>
      </div>

      {/* SESSION ACTION BUTTONS */}
      <div className={styles.actions}>

        {/* START SESSION BUTTON */}
        <button
          className={styles.startButton}
          type="button"

          // Pass true to start the polling session.
          onClick={() => handleSessionChange(true)}

          // Disable this button if:
          // 1. A request is already running.
          // 2. The session is already live.
          disabled={isUpdating || isLive}
        >
          {/* Show Updating... during a request. */}
          {isUpdating
            ? "Updating..."
            : "Start Session"}
        </button>

        {/* END SESSION BUTTON */}
        <button
          className={styles.endButton}
          type="button"

          // Pass false to end the polling session.
          onClick={() => handleSessionChange(false)}

          // Disable this button if:
          // 1. A request is already running.
          // 2. The session is already inactive.
          disabled={isUpdating || !isLive}
        >
          {/* Show Updating... during a request. */}
          {isUpdating
            ? "Updating..."
            : "End Session"}
        </button>
      </div>
    </div>
  );
}

// Export so OrganizerDashboard can use this component.
export default SessionControls;
