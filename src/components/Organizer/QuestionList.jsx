
import { useEffect, useState } from "react";

// Import our Supabase connection for database operations.
import { supabase } from "../../services/supabaseClient";

// Import CSS Module styling for this component.
import styles from "./QuestionList.module.css";

// This component displays the saved questions for a presentation.
//
// presentationId is a prop passed from OrganizerDashboard.
// It identifies which presentation's questions should be loaded.
function QuestionList({ presentationId }) {

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores the questions retrieved from Supabase.
  // Starts as an empty array.
  const [questions, setQuestions] = useState([]);

  // Tracks whether questions are being loaded.
  const [isLoading, setIsLoading] = useState(true);

  // Stores any error message that needs to be displayed.
  const [error, setError] = useState("");

  // Stores the ID of the question currently being activated.
  // null means no activation request is in progress.
  const [activatingQuestionId, setActivatingQuestionId] =
    useState(null);

  // --------------------------------------------------
  // ACTIVATE A QUESTION
  // --------------------------------------------------

  // This function runs when an organizer clicks
  // the Activate Question button.
  async function handleActivateQuestion(questionId) {

    // Remember which question is being activated.
    // This allows the button to display "Activating..."
    setActivatingQuestionId(questionId);

    // Clear any previous error message.
    setError("");

    try {

      // Call a PostgreSQL database function through Supabase.
      //
      // rpc() stands for Remote Procedure Call.
      // activate_question is the name of the database function.
      //
      // We pass two arguments:
      // 1. The presentation ID
      // 2. The question ID we want to activate
      const { error: activationError } = await supabase.rpc(
        "activate_question",
        {
          p_presentation_id: presentationId,
          p_question_id: questionId,
        }
      );

      // If Supabase returns an error, display it.
      if (activationError) {
        console.error(
          "Error activating question:",
          activationError
        );

        setError(activationError.message);
        return;
      }

      // Update the questions array in React state.
      //
      // map() loops through each saved question.
      // The spread operator (...) keeps its existing properties.
      //
      // Only the activated question receives is_open: true.
      // Every other question receives is_open: false.
      setQuestions((previousQuestions) =>
        previousQuestions.map((question) => ({
          ...question,
          is_open: question.id === questionId,
        }))
      );

      // Notify the organizer that activation succeeded.
      alert("Question activated successfully!");

    } catch (unexpectedError) {

      // Handle unexpected errors during activation.
      console.error(
        "Unexpected activation error:",
        unexpectedError
      );

      setError(
        "Unable to activate the question. Please try again."
      );

    } finally {

      // Reset the activation state when the request finishes.
      // This allows the organizer to activate another question.
      setActivatingQuestionId(null);
    }
  }

  // --------------------------------------------------
  // LOAD SAVED QUESTIONS FROM SUPABASE
  // --------------------------------------------------

  // useEffect runs when the component first loads
  // and whenever presentationId changes.
  useEffect(() => {

    // Tracks whether this effect is still active.
    // Helps prevent an outdated request from updating state
    // after the component unmounts or its ID changes.
    let isActive = true;

    async function fetchQuestions() {

      // Show the loading message while fetching data.
      setIsLoading(true);

      // Clear previous errors.
      setError("");

      // Fetch saved questions from the questions table.
      const { data, error: fetchError } = await supabase
        .from("questions")

        // Retrieve only the columns needed by this component.
        .select("id, text, is_open, position")

        // Only fetch questions belonging to this presentation.
        .eq("presentation_id", presentationId)

        // Sort questions by their position, lowest first.
        .order("position", { ascending: true });

      // Ignore the response if this effect is no longer active.
      if (!isActive) return;

      // Handle database errors.
      if (fetchError) {
        console.error(
          "Error loading questions:",
          fetchError
        );

        setError("Unable to load questions.");

      } else {

        // Store the returned questions in React state.
        //
        // ?? [] means:
        // Use an empty array if data is null or undefined.
        setQuestions(data ?? []);
      }

      // Hide the loading message.
      setIsLoading(false);
    }

    // Only fetch questions if a presentation is selected.
    if (presentationId) {
      fetchQuestions();
    }

    // Cleanup function.
    // Runs when the component unmounts or presentationId changes.
    return () => {
      isActive = false;
    };

  }, [presentationId]);

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  // Display this message while questions are loading.
  if (isLoading) {
    return (
      <p className={styles.loadingMessage}>
        Loading questions...
      </p>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  // Display an error if one occurred.
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
  // COMPONENT USER INTERFACE (JSX)
  // --------------------------------------------------

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Saved Questions
      </h3>

      {/* Check whether any questions exist. */}
      {questions.length === 0 ? (

        // Show this message if no questions have been saved.
        <p className={styles.emptyState}>
          No questions have been added yet.
        </p>

      ) : (

        // Otherwise, display the saved questions in a list.
        <ul className={styles.questionList}>

          {/* map() creates a list item for each question. */}
          {questions.map((question) => (
            <li
              className={styles.questionCard}

              // React uses the key to identify each question.
              key={question.id}
            >
              <div className={styles.questionHeader}>

                {/* Display the question text. */}
                <p className={styles.questionText}>
                  {question.text}
                </p>

                {/* Display whether the question is open or closed. */}
                <span
                  className={
                    question.is_open
                      ? styles.statusOpen
                      : styles.statusClosed
                  }
                >
                  {question.is_open ? "Open" : "Closed"}
                </span>
              </div>

              {/* ACTIVATE QUESTION BUTTON */}
              <button
                className={styles.activateButton}
                type="button"

                // Disable activation if:
                // 1. Another activation request is running.
                // 2. This question is already open.
                disabled={
                  activatingQuestionId !== null ||
                  question.is_open
                }

                // Pass this question's ID to the activation function.
                onClick={() =>
                  handleActivateQuestion(question.id)
                }
              >

                {/* Display different text based on the state. */}
                {activatingQuestionId === question.id
                  ? "Activating..."
                  : question.is_open
                    ? "Question Open"
                    : "Activate Question"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Export so OrganizerDashboard can import this component.
export default QuestionList;
