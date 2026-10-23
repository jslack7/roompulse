
import { useEffect, useState } from "react";

// Import our Supabase connection for database
// queries and real-time updates.
import { supabase } from "../../services/supabaseClient";

// Import CSS Module styling for this component.
import styles from "./ResultsChart.module.css";

// --------------------------------------------------
// RESULTS CHART COMPONENT
// --------------------------------------------------

// This component displays the voting results
// for a selected question.
//
// questionId is a prop passed from the parent
// component (OrganizerDashboard).
//
// It tells ResultsChart which question's
// votes and answer choices to retrieve.
function ResultsChart({ questionId }) {

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores all votes submitted for the selected question.
  // Starts as an empty array.
  const [votes, setVotes] = useState([]);

  // Stores the answer choices for the selected question.
  const [choices, setChoices] = useState([]);

  // Tracks whether voting results are being loaded.
  const [isLoading, setIsLoading] = useState(true);

  // Stores any error messages.
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD VOTING RESULTS
  // --------------------------------------------------

  // useEffect runs when the component first loads
  // and whenever questionId changes.
  //
  // It fetches voting results and subscribes
  // to new votes through Supabase Realtime.
  useEffect(() => {

    // Tracks whether this effect is still active.
    //
    // This helps prevent outdated requests from
    // updating state after the component unmounts
    // or the selected question changes.
    let isActive = true;

    // --------------------------------------------------
    // FETCH VOTES AND ANSWER CHOICES
    // --------------------------------------------------

    async function fetchVotes() {

      // Show the loading message while fetching results.
      setIsLoading(true);

      // Clear any previous error messages.
      setError("");

      // --------------------------------------------------
      // FETCH VOTES FROM SUPABASE
      // --------------------------------------------------

      // Retrieve all votes belonging to the selected question.
      const {
        data,
        error: fetchError,
      } = await supabase
        .from("votes")

        // Retrieve the vote ID, question ID,
        // and selected answer choice ID.
        .select("id, question_id, choice_id")

        // Only retrieve votes for the selected question.
        .eq("question_id", questionId);

      // --------------------------------------------------
      // FETCH ANSWER CHOICES FROM SUPABASE
      // --------------------------------------------------

      // Retrieve the answer choices for the same question.
      const {
        data: choicesData,
        error: choicesError,
      } = await supabase
        .from("choices")

        // Retrieve each choice's ID, label, and position.
        .select("id, label, position")

        // Only retrieve choices for the selected question.
        .eq("question_id", questionId)

        // Sort choices by their position,
        // starting with the lowest number.
        .order("position", { ascending: true });

      // Ignore the results if this effect is no longer active.
      if (!isActive) return;

      // --------------------------------------------------
      // HANDLE DATABASE ERRORS
      // --------------------------------------------------

      // If either query fails, display an error message.
      if (fetchError || choicesError) {
        console.error(
          "Error fetching results:",
          fetchError || choicesError
        );

        setError("Unable to load voting results.");

      } else {

        // Store the retrieved votes in React state.
        //
        // ?? [] ensures an empty array is used
        // if Supabase returns null or undefined.
        setVotes(data ?? []);

        // Store the answer choices in React state.
        setChoices(choicesData ?? []);
      }

      // Hide the loading message.
      setIsLoading(false);
    }

    // --------------------------------------------------
    // CHECK FOR A SELECTED QUESTION
    // --------------------------------------------------

    // Only fetch results if a question ID exists.
    if (questionId) {

      // Fetch the initial voting results.
      fetchVotes();

      // --------------------------------------------------
      // SUPABASE REALTIME SUBSCRIPTION
      // --------------------------------------------------

      // Create a Realtime channel for this question.
      //
      // This allows RoomPulse to receive updates
      // when participants submit new votes.
      const channel = supabase
        .channel(`results-${questionId}`)
        .on(
          "postgres_changes",
          {
            // Listen for new records being inserted.
            event: "INSERT",

            // Watch the public database schema.
            schema: "public",

            // Listen for changes to the votes table.
            table: "votes",

            // Only listen for votes belonging
            // to the selected question.
            filter: `question_id=eq.${questionId}`,
          },

          // This callback runs when a new vote is received.
          (payload) => {

            // Log the Realtime event for debugging.
            console.log(
              "New vote received:",
              payload
            );

            // Fetch the updated vote totals.
            fetchVotes();
          }
        )

        // Start listening for Realtime events.
        .subscribe((status, error) => {

          // Log the subscription status.
          console.log(
            "Results Realtime status:",
            status
          );

          // Log any subscription errors.
          if (error) {
            console.error(
              "Results Realtime error:",
              error
            );
          }
        });

      // --------------------------------------------------
      // CLEANUP REALTIME SUBSCRIPTION
      // --------------------------------------------------

      // Runs when the component unmounts
      // or questionId changes.
      return () => {

        // Prevent old requests from updating state.
        isActive = false;

        // Remove the Realtime channel so the app
        // does not keep unnecessary subscriptions open.
        supabase.removeChannel(channel);
      };

    } else {

      // --------------------------------------------------
      // NO QUESTION SELECTED
      // --------------------------------------------------

      // Clear results if no question ID was provided.
      setVotes([]);
      setChoices([]);
      setIsLoading(false);
    }

    // Cleanup when there is no active subscription.
    return () => {
      isActive = false;
    };

  }, [questionId]);

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  // Display a loading message while retrieving results.
  if (isLoading) {
    return (
      <p className={styles.loadingMessage}>
        Loading voting results...
      </p>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  // Display an error if the results could not be loaded.
  if (error) {
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
  // RESULTS CHART USER INTERFACE
  // --------------------------------------------------

  return (
    <div className={styles.container}>

      {/* RESULTS HEADER */}
      <div className={styles.header}>

        <h2 className={styles.title}>
          Live Results
        </h2>

        {/* Display the total number of votes.
            votes.length counts how many vote
            records are stored in the votes array. */}
        <p className={styles.totalVotes}>
          Total votes: {votes.length}
        </p>
      </div>

      {/* CHECK WHETHER ANSWER CHOICES EXIST */}
      {choices.length === 0 ? (

        // Show this message if there are no choices.
        <p className={styles.emptyState}>
          No answer choices available.
        </p>

      ) : (

        // --------------------------------------------------
        // DISPLAY VOTING RESULTS
        // --------------------------------------------------

        <div className={styles.resultsList}>

          {/* map() loops through the answer choices
              and creates a result row for each one. */}
          {choices.map((choice) => {

            // --------------------------------------------------
            // CALCULATE VOTES FOR THIS CHOICE
            // --------------------------------------------------

            // filter() creates a new array containing
            // only votes that match this choice's ID.
            //
            // .length counts how many matching votes exist.
            const voteCount = votes.filter(
              (vote) => vote.choice_id === choice.id
            ).length;

            // --------------------------------------------------
            // CALCULATE VOTE PERCENTAGE
            // --------------------------------------------------

            // Divide the number of votes for this choice
            // by the total number of votes, then multiply
            // by 100 to calculate the percentage.
            //
            // Math.round() rounds to the nearest whole number.
            //
            // If there are no votes, use 0 to avoid
            // dividing by zero.
            const percentage =
              votes.length > 0
                ? Math.round(
                    (voteCount / votes.length) * 100
                  )
                : 0;

            // --------------------------------------------------
            // DISPLAY EACH ANSWER'S RESULTS
            // --------------------------------------------------

            return (
              <div
                className={styles.resultItem}
                key={choice.id}
              >

                {/* RESULT HEADER */}
                <div className={styles.resultHeader}>

                  {/* DISPLAY ANSWER CHOICE */}
                  <span className={styles.choiceLabel}>
                    {choice.label}
                  </span>

                  {/* DISPLAY VOTE COUNT AND PERCENTAGE */}
                  <span className={styles.voteDetails}>
                    {voteCount} votes ({percentage}%)
                  </span>
                </div>

                {/* --------------------------------------------------
                    PROGRESS BAR
                    -------------------------------------------------- */}

                {/* This div represents the full progress bar.

                    role="progressbar" identifies it
                    as a progress indicator.

                    aria-valuenow gives its current percentage.

                    aria-valuemin and aria-valuemax
                    define the range from 0 to 100. */}
                <div
                  className={styles.progressTrack}
                  role="progressbar"
                  aria-label={
                    `${choice.label} vote percentage`
                  }
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >

                  {/* The inner div is the filled portion
                      of the progress bar.

                      Its width is calculated dynamically
                      using the vote percentage.

                      For example:
                      75% of votes = width: "75%"

                      This makes the visual bar reflect
                      the number of votes received. */}
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Export this component so OrganizerDashboard
// can display the live voting results.
export default ResultsChart;
