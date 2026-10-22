import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import styles from "./QuestionForm.module.css";

function QuestionForm({ presentationId }) {

  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [isSaving, setIsSaving] = useState(false);

  function handleChoiceChange(index, newValue) {
    const updatedChoices = [...choices];
    updatedChoices[index] = newValue;
    setChoices(updatedChoices);
  }

  function handleAddChoice() {
    setChoices([...choices, ""]);
  }

  function handleRemoveChoice(index) {
    if (choices.length <= 2) {
      return;
    }

    const updatedChoices = choices.filter((choice, choiceIndex) => {
      return choiceIndex !== index;
    });

    setChoices(updatedChoices);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!presentationId) {
      alert("Please select a presentation before saving a question.");
      return;
    }

    if (questionText.trim() === "") {
      alert("Please enter a question.");
      return;
    }
    if (choices.length < 2) {
      alert("Please provide at least two answer choices.");
      return;
    }
    if (choices.some((choice) => choice.trim() === "")) {
      alert("Please fill in all answer choices.");
      return;
    }

    setIsSaving(true);

    try {
      console.log("Question submitted:", questionText);
      console.log("Answer Choices:", choices);
    

  
    const { data, error } = await supabase.rpc(
      "create_question_with_choices",
      {
        p_presentation_id: presentationId,
        p_question_text: questionText.trim(),
        p_choices: choices.map((choice) => choice.trim()),
      }
    );
      
    if (error) {
      console.error("Error saving question:", error);
      alert("Unable to save the question. Please try again.");
      return;
    }

    console.log("Question saved successfully:", data);
    alert("Question saved successfully!");

    setQuestionText("");
    setChoices(["", ""]);

  } catch (error) {
    console.error("Unexpected error when saving question:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    setIsSaving(false);
  }
  }

  
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Create a Question</h3>

      <div>
        <label className={styles.label} htmlFor="questionText">
          Question
        </label>

        <input
          className={styles.input}
          type="text"
          id="questionText"
          placeholder="Enter your question"
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
        />
      </div>

      <h4 className={styles.choicesTitle}>Answer Choices</h4>

      <div className={styles.choicesList}>
        {choices.map((choice, index) => (
          <div className={styles.choiceRow} key={index}>
            <label
              className={styles.label}
              htmlFor={`choice-${index}`}
            >
              Choice {index + 1}
            </label>

            <div className={styles.choiceControls}>
              <input
                className={styles.input}
                type="text"
                id={`choice-${index}`}
                value={choice}
                onChange={(event) =>
                  handleChoiceChange(index, event.target.value)
                }
              />

              <button
                className={styles.removeButton}
                type="button"
                onClick={() => handleRemoveChoice(index)}
                disabled={choices.length <= 2}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.addButton}
          type="button"
          onClick={handleAddChoice}
        >
          + Add Choice
        </button>

        <button
          className={styles.saveButton}
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Question"}
        </button>
      </div>
    </form>
  );
}

export default QuestionForm;
