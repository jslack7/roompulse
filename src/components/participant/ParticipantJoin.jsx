
import { useState } from "react";

// useSearchParams allows us to read information
// from the URL's query parameters.
import { useSearchParams } from "react-router-dom";

// Import our Supabase connection.
import { supabase } from "../../services/supabaseClient";

// Import the component that allows participants to vote.
import ParticipantVoting from "./ParticipantVoting";

// Import CSS Module styling.
import styles from "./ParticipantJoin.module.css";

// --------------------------------------------------
// PARTICIPANT JOIN COMPONENT
// --------------------------------------------------

// This component allows audience members to join
// an active RoomPulse polling session.
//
// Participants enter a session code, and the app:
// 1. Checks whether the presentation exists.
// 2. Verifies that the presentation is live.
// 3. Ensures the participant has a Supabase session.
// 4. Displays the voting component after joining.
function ParticipantJoin() {

  // --------------------------------------------------
  // URL SEARCH PARAMETERS
  // --------------------------------------------------

  // useSearchParams reads query parameters from the URL.
  //
  // For example:
  // /join?session=abc123
  //
  // searchParams.get("session") returns "abc123".
  const [searchParams] = useSearchParams();

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores the session code entered by the participant.
  //
  // If the URL contains a "session" parameter,
  // use it as the initial value.
  //
  // ?? "" provides an empty string if the parameter
  // does not exist.
  const [sessionCode, setSessionCode] = useState(
    searchParams.get("session") ?? ""
  );

  // Stores error messages shown to participants.
  const [error, setError] = useState("");

  // Tracks whether the app is processing a join request.
  const [isLoading, setIsLoading] = useState(false);

  // Stores the presentation after a successful join.
  //
  // null means the participant has not joined yet.
  const [joinedPresentation, setJoinedPresentation] =
    useState(null);

  // --------------------------------------------------
  // JOIN A LIVE POLLING SESSION
  // --------------------------------------------------

  // This function runs when the participant submits
  // the Join Session form.
  async function handleJoin(event) {

    // Prevent the browser from refreshing the page.
    event.preventDefault();

    // Remove extra spaces from the session code.
    const cleanedCode = sessionCode.trim();

    // --------------------------------------------------
    // VALIDATE SESSION CODE
    // --------------------------------------------------

    // Make sure the participant entered a code.
    if (!cleanedCode) {
      setError("Please enter a session code.");
      return;
    }

    // Clear any previous error message.
    setError("");

    // Show that the join request is processing.
    setIsLoading(true);

    // Clear any previously joined presentation.
    setJoinedPresentation(null);

    try {

      // --------------------------------------------------
      // FIND THE PRESENTATION IN SUPABASE
      // --------------------------------------------------

      // Search the presentations table for a record
      // whose ID matches the participant's session code.
      const { data, error: fetchError } = await supabase
        .from("presentations")

        // Retrieve only the fields needed for joining.
        .select("id, title, is_live")

        // Find the presentation with the matching ID.
        .eq("id", cleanedCode)

        // Return one record or null if none exists.
        .maybeSingle();

      // Handle errors from the database request.
      if (fetchError) {
        console.error(
          "Error joining session:",
          fetchError
        );

        setError(
          "Unable to join this session. Check your code."
        );

        return;
      }

      // --------------------------------------------------
      // CHECK WHETHER THE SESSION EXISTS
      // --------------------------------------------------

      // If no presentation was found, display an error.
      if (!data) {
        setError("Session not found.");
        return;
      }

      // --------------------------------------------------
      // CHECK WHETHER THE SESSION IS LIVE
      // --------------------------------------------------

      // Participants can only join active presentations.
      //
      // is_live is a Boolean stored in Supabase.
      // true = Live
      // false = Not Live
      if (!data.is_live) {
        setError("This session is not currently live.");
        return;
      }

      // --------------------------------------------------
      // CHECK PARTICIPANT AUTHENTICATION
      // --------------------------------------------------

      // Check whether the participant already has
      // an existing Supabase authentication session.
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      // Handle errors when checking authentication.
      if (sessionError) {
        console.error(
          "Error checking participant session:",
          sessionError
        );

        setError(
          "Unable to verify your session. Please try again."
        );

        return;
      }

      // --------------------------------------------------
      // ANONYMOUS SIGN-IN
      // --------------------------------------------------

      // If the participant does not already have
      // a Supabase session, sign them in anonymously.
      //
      // Anonymous authentication allows audience members
      // to participate without creating an account
      // with an email address and password.
      if (!sessionData.session) {

        // Request an anonymous authentication session.
        const { error: signInError } =
          await supabase.auth.signInAnonymously();

        // Handle anonymous sign-in errors.
        if (signInError) {
          console.error(
            "Anonymous sign-in error:",
            signInError
          );

          setError(
            "Unable to join as a participant. Please try again."
          );

          return;
        }
      }

      // --------------------------------------------------
      // JOIN SUCCESSFULLY
      // --------------------------------------------------

      // All checks passed:
      // - The presentation exists.
      // - The presentation is live.
      // - The participant has an authentication session.
      //
      // Store the presentation in React state.
      //
      // This causes React to display the success
      // message and ParticipantVoting component.
      setJoinedPresentation(data);

    } catch (unexpectedError) {

      // Handle unexpected errors during the join process.
      console.error(
        "Unexpected join error:",
        unexpectedError
      );

      setError(
        "Something went wrong. Please try again."
      );

    } finally {

      // finally runs whether the request succeeds or fails.
      //
      // Reset the loading state so the Join button
      // becomes available again.
      setIsLoading(false);
    }
  }

  // --------------------------------------------------
  // COMPONENT USER INTERFACE (JSX)
  // --------------------------------------------------

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* JOIN SESSION CARD */}
        <div className={styles.card}>

          {/* ROOMPULSE BRAND */}
          <p className={styles.brand}>
            RoomPulse
          </p>

          {/* PAGE HEADING */}
          <h2 className={styles.title}>
            Join a Session
          </h2>

          {/* INSTRUCTIONS */}
          <p className={styles.description}>
            Enter your session code to participate in a live poll.
          </p>

          {/* JOIN SESSION FORM */}
          <form
            className={styles.form}
            onSubmit={handleJoin}
          >

            {/* SESSION CODE LABEL */}
            <label
              className={styles.label}
              htmlFor="sessionCode"
            >
              Session Code
            </label>

            {/* SESSION CODE INPUT */}
            <input
              className={styles.input}
              id="sessionCode"
              type="text"

              // Controlled input:
              // Its value comes from React state.
              value={sessionCode}

              // Update state whenever the participant types.
              onChange={(event) =>
                setSessionCode(event.target.value)
              }

              placeholder="Enter session code"
            />

            {/* JOIN SESSION BUTTON */}
            <button
              className={styles.joinButton}
              type="submit"

              // Disable the button while joining.
              disabled={isLoading}
            >

              {/* Display Joining... during the request. */}
              {isLoading
                ? "Joining..."
                : "Join Session"}
            </button>
          </form>

          {/* ERROR MESSAGE */}

          {/* Only display an error message
              when the error state contains text. */}
          {error && (
            <p
              className={styles.errorMessage}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        {/* SUCCESSFUL JOIN SECTION */}

        {/* This section only appears after
            joinedPresentation contains a presentation. */}
        {joinedPresentation && (
          <div className={styles.successCard}>

            {/* SUCCESS MESSAGE */}
            <h3 className={styles.successTitle}>
              Successfully Joined!
            </h3>

            {/* DISPLAY PRESENTATION TITLE */}
            <p className={styles.presentationName}>
              <strong>Presentation:</strong>{" "}
              {joinedPresentation.title}
            </p>

            {/* LIVE SESSION INDICATOR */}
            <span className={styles.liveBadge}>

              {/* Decorative live status dot */}
              <span className={styles.liveDot} />

              Session Live
            </span>

            {/* PARTICIPANT VOTING COMPONENT */}
            <div className={styles.votingSection}>

              {/* Pass the joined presentation's ID
                  to ParticipantVoting.

                  That component handles displaying
                  questions and submitting votes. */}
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

// Export this component so it can be used
// in the RoomPulse application.
export default ParticipantJoin;
