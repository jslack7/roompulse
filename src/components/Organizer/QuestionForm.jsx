
import { useState } from "react";

// Import our Supabase connection so we can save data.
import { supabase } from "../../services/supabaseClient";

// Import CSS Module styling for this component.
import styles from "./QuestionForm.module.css";

// This component allows an organizer to create a question
// and multiple answer choices for a selected presentation.
//
// presentationId is a prop passed from OrganizerDashboard.
// It tells us which presentation the question belongs to.
function QuestionForm({ presentationId }) {

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores the question the organizer types.
  // Starts as an empty string.
  const [questionText, setQuestionText] = useState("");

  // Stores all answer choices in an array.
  // We start with two empty choices because each question
  // must have at least two possible answers.
  const [choices, setChoices] = useState(["", ""]);

  // Tracks whether the question is being saved.
  // Used to disable the Save button during the request.
  const [isSaving, setIsSaving] = useState(false);

  // --------------------------------------------------
  // UPDATE AN ANSWER CHOICE
  // --------------------------------------------------

  function handleChoiceChange(index, newValue) {

    // Create a copy of the existing choices array.
    // React state should not be changed directly.
    const updatedChoices = [...choices];

    // Update the answer choice at the specified index.
    updatedChoices[index] = newValue;

    // Save the updated array in React state.
    // React then re-renders the component.
    setChoices(updatedChoices);
  }

  // --------------------------------------------------
  // ADD AN ANSWER CHOICE
  // --------------------------------------------------

  function handleAddChoice() {

    // Create a new array containing all existing choices
    // plus one new empty choice.
    setChoices([...choices, ""]);
  }

  // --------------------------------------------------
  // REMOVE AN ANSWER CHOICE
  // --------------------------------------------------

  function handleRemoveChoice(index) {

    // Do not allow fewer than two answer choices.
    if (choices.length <= 2) {
      return;
    }

    // filter() creates a new array.
    // Keep every choice except the one being removed.
    const updatedChoices = choices.filter(
      (choice, choiceIndex) => {
        return choiceIndex !== index;
      }
    );

    // Update React state with the remaining choices.
    setChoices(updatedChoices);
  }

  // --------------------------------------------------
  // SAVE THE QUESTION TO SUPABASE
  // --------------------------------------------------

  async function handleSubmit(event) {

    // Prevent the browser from refreshing when
    // the organizer submits the form.
    event.preventDefault();

    // Make sure a presentation has been selected.
    if (!presentationId) {
      alert(
        "Please select a presentation before saving a question."
      );
      return;
    }

    // trim() removes extra whitespace from both ends.
    // Reject questions that are empty or only spaces.
    if (questionText.trim() === "") {
      alert("Please enter a question.");
      return;
    }

    // Require at least two answer choices.
    if (choices.length < 2) {
      alert("Please provide at least two answer choices.");
      return;
    }

    // some() checks whether at least one choice
    // is empty after removing extra whitespace.
    if (choices.some((choice) => choice.trim() === "")) {
      alert("Please fill in all answer choices.");
      return;
    }

    // Mark the form as saving.
    // This prevents repeated submissions.
    setIsSaving(true);

    try {

      // Log submitted information for debugging.
      console.log("Question submitted:", questionText);
      console.log("Answer Choices:", choices);

      // Call a Supabase PostgreSQL database function.
      //
      // rpc() means Remote Procedure Call.
      // It lets our React app execute a database function
      // instead of making separate insert requests.
      //
      // create_question_with_choices is the name
      // of the function in our Supabase database.
      const { data, error } = await supabase.rpc(
        "create_question_with_choices",
        {
          // ID of the presentation receiving this question.
          p_presentation_id: presentationId,

          // Question text without extra surrounding spaces.
          p_question_text: questionText.trim(),

          // map() creates an array of trimmed answer choices.
          p_choices: choices.map((choice) => choice.trim()),
        }
      );

      // Check whether Supabase returned an error.
      if (error) {
        console.error("Error saving question:", error);

        alert(
          "Unable to save the question. Please try again."
        );

        return;
      }

      // The database function completed successfully.
      console.log("Question saved successfully:", data);

      // Notify the organizer.
      alert("Question saved successfully!");

      // Clear the question input.
      setQuestionText("");

      // Reset answer choices to two empty inputs.
      setChoices(["", ""]);

    } catch (error) {

      // Handle unexpected errors during the save process.
      console.error(
        "Unexpected error when saving question:",
        error
      );

      alert("Something went wrong. Please try again.");

    } finally {

      // finally runs whether the request succeeds,
      // fails, or returns from inside the try block.
      //
      // Reset the saving state so the Save button
      // can be used again.
      setIsSaving(false);
    }
  }

  // --------------------------------------------------
  // COMPONENT USER INTERFACE (JSX)
  // --------------------------------------------------

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <h3 className={styles.title}>
        Create a Question
      </h3>

      {/* QUESTION INPUT */}
      <div>
        <label
          className={styles.label}
          htmlFor="questionText"
        >
          Question
        </label>

        <input
          className={styles.input}
          type="text"
          id="questionText"
          placeholder="Enter your question"

          // Controlled input:
          // Its displayed value comes from React state.
          value={questionText}

          // Update state whenever the organizer types.
          onChange={(event) =>
            setQuestionText(event.target.value)
          }
        />
      </div>

      <h4 className={styles.choicesTitle}>
        Answer Choices
      </h4>

      {/* ANSWER CHOICES LIST */}
      <div className={styles.choicesList}>

        {/* map() loops through the choices array.
            Each item creates its own input and Remove button. */}
        {choices.map((choice, index) => (
          <div
            className={styles.choiceRow}
            key={index}
          >
            <label
              className={styles.label}
              htmlFor={`choice-${index}`}
            >
              {/* index starts at 0, so add 1 for display. */}
              Choice {index + 1}
            </label>

            <div className={styles.choiceControls}>
              <input
                className={styles.input}
                type="text"
                id={`choice-${index}`}

                // Display the current choice text.
                value={choice}

                // Update the correct choice when typing.
                onChange={(event) =>
                  handleChoiceChange(
                    index,
                    event.target.value
                  )
                }
              />

              {/* REMOVE CHOICE BUTTON */}
              <button
                className={styles.removeButton}
                type="button"

                // Remove the choice at this index.
                onClick={() =>
                  handleRemoveChoice(index)
                }

                // Disable removal when only two choices remain.
                disabled={choices.length <= 2}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FORM ACTION BUTTONS */}
      <div className={styles.actions}>

        {/* ADD CHOICE BUTTON */}
        <button
          className={styles.addButton}
          type="button"
          onClick={handleAddChoice}
        >
          + Add Choice
        </button>

        {/* SAVE QUESTION BUTTON */}
        <button
          className={styles.saveButton}
          type="submit"

          // Prevent another submission while saving.
          disabled={isSaving}
        >
          {/* Display different text based on saving state. */}
          {isSaving ? "Saving..." : "Save Question"}
        </button>
      </div>
    </form>
  );
}

// Export the component so other files can import it.
export default QuestionForm;
