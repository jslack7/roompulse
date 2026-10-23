
import { useEffect, useState } from "react";

// Import our Supabase connection for database,
// authentication, and real-time operations.
import { supabase } from "../../services/supabaseClient";

// Import CSS Module styling for this component.
import styles from "./ParticipantVoting.module.css";

// --------------------------------------------------
// PARTICIPANT VOTING COMPONENT
// --------------------------------------------------

// This component allows participants to vote
// on the currently active question in a presentation.
//
// presentationId is a prop passed from ParticipantJoin.
// It identifies which presentation the participant joined.
function ParticipantVoting({ presentationId }) {

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores the currently active question.
  // null means there is no active question.
  const [question, setQuestion] = useState(null);

  // Stores the answer choices for the active question.
  const [choices, setChoices] = useState([]);

  // Tracks whether the active question is loading.
  const [isLoading, setIsLoading] = useState(true);

  // Stores error messages displayed to participants.
  const [error, setError] = useState("");

  // Stores the ID of the answer selected by the participant.
  // Starts as an empty string because no answer is selected.
  const [selectedChoiceId, setSelectedChoiceId] = useState("");

  // Tracks whether a vote is being submitted.
  // Used to disable voting controls during submission.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracks whether the participant has already voted
  // on the current question.
  const [hasVoted, setHasVoted] = useState(false);

  // --------------------------------------------------
  // LOAD THE ACTIVE QUESTION
  // --------------------------------------------------

  // useEffect runs when the component first loads
  // and whenever presentationId changes.
  //
  // It also creates a Supabase Realtime subscription
  // so participants can see question changes.
  useEffect(() => {

    // Tracks whether this effect is still active.
    //
    // Helps prevent outdated requests from updating
    // state after the component unmounts.
    let isActive = true;

    // --------------------------------------------------
    // FETCH THE CURRENT ACTIVE QUESTION
    // --------------------------------------------------

    async function fetchActiveQuestion() {

      // Show the loading message while fetching data.
      setIsLoading(true);

      // Clear any previous error message.
      setError("");

      // --------------------------------------------------
      // CHECK PRESENTATION STATUS
      // --------------------------------------------------

      // Fetch the presentation's live status
      // and the ID of its active question.
      const {
        data: presentation,
        error: presentationError,
      } = await supabase
        .from("presentations")
        .select("is_live, active_question_id")
        .eq("id", presentationId)
        .maybeSingle();

      // Ignore the response if this effect is no longer active.
      if (!isActive) return;

      // Handle errors loading the presentation.
      if (presentationError) {
        setError("Unable to load the presentation.");
        setIsLoading(false);
        return;
      }

      // If the presentation is not live or does not
      // have an active question, clear the question
      // and answer choices.
      if (
        !presentation?.is_live ||
        !presentation.active_question_id
      ) {
        setQuestion(null);
        setChoices([]);
        setIsLoading(false);
        return;
      }

      // --------------------------------------------------
      // FETCH THE ACTIVE QUESTION
      // --------------------------------------------------

      // Find the active question in the questions table.
      const {
        data: questionData,
        error: questionError,
      } = await supabase
        .from("questions")

        // Retrieve the question ID, text, and open status.
        .select("id, text, is_open")

        // Match the active question ID.
        .eq("id", presentation.active_question_id)

        // Ensure the question belongs to this presentation.
        .eq("presentation_id", presentationId)

        // Only retrieve questions that are open for voting.
        .eq("is_open", true)

        // Return one question or null.
        .maybeSingle();

      // Ignore the result if the effect is no longer active.
      if (!isActive) return;

      // Handle errors loading the active question.
      if (questionError) {
        setError("Unable to load the active question.");
        setIsLoading(false);
        return;
      }

      // If there is no open question,
      // clear the question and choices.
      if (!questionData) {
        setQuestion(null);
        setChoices([]);
        setIsLoading(false);
        return;
      }

      // --------------------------------------------------
      // FETCH ANSWER CHOICES
      // --------------------------------------------------

      // Retrieve all answer choices for the active question.
      const {
        data: choicesData,
        error: choicesError,
      } = await supabase
        .from("choices")

        // Retrieve only the fields needed for voting.
        .select("id, label, position")

        // Only retrieve choices belonging to this question.
        .eq("question_id", questionData.id)

        // Display choices in their saved order.
        .order("position", { ascending: true });

      if (!isActive) return;

      // Handle errors loading answer choices.
      if (choicesError) {
        setError("Unable to load answer choices.");

      } else {

        // --------------------------------------------------
        // VERIFY PARTICIPANT AUTHENTICATION
        // --------------------------------------------------

        // Get the authenticated participant's user ID.
        //
        // ParticipantJoin creates an anonymous session
        // if the participant does not already have one.
        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (!isActive) return;

        // Stop if the participant cannot be verified.
        if (userError || !userData.user) {
          setError("Unable to verify participant.");
          setIsLoading(false);
          return;
        }

        // --------------------------------------------------
        // CHECK WHETHER THE PARTICIPANT ALREADY VOTED
        // --------------------------------------------------

        // Search the votes table for an existing vote
        // from this participant on the active question.
        const {
          data: existingVote,
          error: voteCheckError,
        } = await supabase
          .from("votes")
          .select("id")

          // Only check votes for this question.
          .eq("question_id", questionData.id)

          // Only check votes belonging to this participant.
          .eq("voter_id", userData.user.id)

          // Return one vote or null if no vote exists.
          .maybeSingle();

        if (!isActive) return;

        // Handle errors checking voting status.
        if (voteCheckError) {
          console.error(
            "Error checking vote:",
            voteCheckError
          );

          setError("Unable to check your voting status.");
          setIsLoading(false);
          return;
        }

        // Clear any previously selected answer.
        //
        // This is important when the organizer
        // activates a different question.
        setSelectedChoiceId("");

        // Boolean() converts the existing vote result
        // into true or false.
        //
        // If a vote exists, hasVoted becomes true.
        // Otherwise, it becomes false.
        setHasVoted(Boolean(existingVote));

        // Store the active question and answer choices.
        //
        // Updating state causes React to display
        // the question and its voting options.
        setQuestion(questionData);
        setChoices(choicesData ?? []);
      }

      // Hide the loading message.
      setIsLoading(false);
    }

    // --------------------------------------------------
    // CHECK FOR A VALID PRESENTATION ID
    // --------------------------------------------------

    // If no presentation ID was provided,
    // do not attempt to fetch questions.
    if (!presentationId) {
      setIsLoading(false);

      return () => {
        isActive = false;
      };
    }

    // Fetch the active question when the component loads.
    fetchActiveQuestion();

    // --------------------------------------------------
    // SUPABASE REALTIME SUBSCRIPTION
    // --------------------------------------------------

    // Create a Realtime channel for this presentation.
    //
    // This allows the participant's screen to update
    // when the organizer changes the active question
    // or updates the presentation's live status.
    const channel = supabase
      .channel(`presentation-${presentationId}`)
      .on(
        "postgres_changes",
        {
          // Listen for UPDATE events.
          event: "UPDATE",

          // Listen to the public database schema.
          schema: "public",

          // Watch changes to the presentations table.
          table: "presentations",

          // Only watch the selected presentation.
          filter: `id=eq.${presentationId}`,
        },

        // When an update is received,
        // fetch the latest active question.
        () => {
          fetchActiveQuestion();
        }
      )
      .subscribe();

    // --------------------------------------------------
    // CLEANUP REALTIME SUBSCRIPTION
    // --------------------------------------------------

    // Runs when the component unmounts
    // or presentationId changes.
    return () => {

      // Prevent outdated requests from updating state.
      isActive = false;

      // Remove the Supabase Realtime subscription.
      // This prevents unnecessary active listeners.
      supabase.removeChannel(channel);
    };

  }, [presentationId]);

  // --------------------------------------------------
  // SUBMIT A PARTICIPANT'S VOTE
  // --------------------------------------------------

  // This function runs when the participant
  // clicks the Submit Vote button.
  async function handleSubmitVote(event) {

    // Prevent the browser from refreshing.
    event.preventDefault();

    // Make sure the participant selected an answer
    // and an active question exists.
    if (!selectedChoiceId || !question) {
      setError(
        "Please select an answer before submitting."
      );
      return;
    }

    // Disable voting controls during submission.
    setIsSubmitting(true);

    // Clear previous errors.
    setError("");

    try {

      // --------------------------------------------------
      // SAVE THE VOTE TO SUPABASE
      // --------------------------------------------------

      // Insert a new record into the votes table.
      //
      // question_id identifies the question being answered.
      // choice_id identifies the selected answer.
      //
      // The database must handle associating the vote
      // with the authenticated participant.
      const { error: voteError } = await supabase
        .from("votes")
        .insert({
          question_id: question.id,
          choice_id: selectedChoiceId,
        });

      // --------------------------------------------------
      // HANDLE VOTING ERRORS
      // --------------------------------------------------

      if (voteError) {
        console.error(
          "Error submitting vote:",
          voteError
        );

        // PostgreSQL error code 23505 means
        // a unique constraint was violated.
        //
        // In this application, it is treated
        // as an attempt to vote more than once.
        if (voteError.code === "23505") {
          setError(
            "You have already voted on this question."
          );
        } else {
          setError(
            "Unable to submit your vote. Please try again."
          );
        }

        return;
      }

      // --------------------------------------------------
      // HANDLE SUCCESSFUL VOTE
      // --------------------------------------------------

      // Mark the participant as having voted.
      //
      // React will hide the answer form and display
      // the Vote Submitted confirmation.
      setHasVoted(true);

    } catch (unexpectedError) {

      // Handle unexpected errors during submission.
      console.error(
        "Unexpected voting error:",
        unexpectedError
      );

      setError(
        "Something went wrong. Please try again."
      );

    } finally {

      // Reset submission state when the request finishes.
      setIsSubmitting(false);
    }
  }

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  // Display a loading message while fetching data.
  if (isLoading) {
    return (
      <p className={styles.loadingMessage}>
        Loading active question...
      </p>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  // If an error exists and no question is available,
  // display the error instead of the voting interface.
  if (error && !question) {
    return (
      <p
        className={styles.errorMessage}
        role="alert"
      >
        {error}
      </p>
    );
  }

  // --------------------------------------------------
  // WAITING FOR A QUESTION
  // --------------------------------------------------

  // If there is no active question, show a waiting message.
  if (!question) {
    return (
      <div className={styles.waitingCard}>
        <h2 className={styles.waitingTitle}>
          Waiting for a Question
        </h2>

        <p className={styles.message}>
          The organizer hasn't activated a question yet.
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // COMPONENT USER INTERFACE (JSX)
  // --------------------------------------------------

  return (
    <div className={styles.container}>

      {/* SECTION HEADING */}
      <h2 className={styles.heading}>
        Live Question
      </h2>

      {/* DISPLAY THE ACTIVE QUESTION */}
      <h3 className={styles.question}>
        {question.text}
      </h3>

      {/* CHECK WHETHER THE PARTICIPANT HAS VOTED */}
      {hasVoted ? (

        // --------------------------------------------------
        // VOTE SUCCESS MESSAGE
        // --------------------------------------------------

        // Show this section after a successful vote
        // or when an existing vote was found.
        <div className={styles.successCard}>

          {/* SUCCESS CHECKMARK */}
          <div className={styles.successIcon}>
            ✓
          </div>

          {/* SUCCESS HEADING */}
          <h3 className={styles.successTitle}>
            Vote Submitted!
          </h3>

          {/* THANK YOU MESSAGE */}
          <p className={styles.message}>
            Thank you for participating in RoomPulse.
          </p>
        </div>

      ) : (

        // --------------------------------------------------
        // VOTING FORM
        // --------------------------------------------------

        // Display the voting form if the participant
        // has not yet voted on this question.
        <form
          className={styles.form}
          onSubmit={handleSubmitVote}
        >

          {/* ANSWER CHOICES */}
          <fieldset
            className={styles.choices}
            aria-label="Answer choices"
          >

            {/* map() creates a radio option
                for every answer choice. */}
            {choices.map((choice) => (
              <label
                key={choice.id}

                // Apply additional styling when
                // this answer is selected.
                className={`${styles.choice} ${
                  selectedChoiceId === choice.id
                    ? styles.choiceSelected
                    : ""
                }`}
              >

                {/* RADIO BUTTON */}
                <input
                  className={styles.choiceInput}
                  type="radio"
                  name="pollAnswer"

                  // Store the choice's unique ID as its value.
                  value={choice.id}

                  // Check the radio button when its ID
                  // matches the selected answer.
                  checked={
                    selectedChoiceId === choice.id
                  }

                  // Update React state when selected.
                  onChange={() =>
                    setSelectedChoiceId(choice.id)
                  }

                  // Prevent changes during submission.
                  disabled={isSubmitting}
                />

                {/* ANSWER CHOICE TEXT */}
                <span className={styles.choiceText}>
                  {choice.label}
                </span>
              </label>
            ))}
          </fieldset>

          {/* SUBMIT VOTE BUTTON */}
          <button
            className={styles.submitButton}
            type="submit"

            // Disable submission if:
            // 1. A vote is currently being submitted.
            // 2. No answer has been selected.
            disabled={
              isSubmitting || !selectedChoiceId
            }
          >
            {/* Change button text during submission. */}
            {isSubmitting
              ? "Submitting..."
              : "Submit Vote"}
          </button>
        </form>
      )}

      {/* ERROR MESSAGE */}

      {/* Display any error while the question
          and voting interface are visible. */}
      {error && (
        <p
          className={styles.errorMessage}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Export so ParticipantJoin can import this component.
export default ParticipantVoting;
