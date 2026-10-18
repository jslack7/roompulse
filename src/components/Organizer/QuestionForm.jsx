import { useState } from "react";
import { supabase } from "../../services/supabaseClient";


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
    if (choices.some((choice) => choice.trim() === "")) {
      alert("Please fill in all answer choices.");
      return;
    }

    setIsSaving(true);

    try {
      console.log("Question submitted:", questionText);
      console.log("Answer Choices:", choices);
    

  
    const { data, error } = await supabase 
      .from("questions")
      .insert({
        presentation_id: presentationId,
        text: questionText.trim(),
        type: "multiple_choice",
        is_open: false,
      })
        .select()
        .single();
    if (error) {
      console.error("Error saving question:", error);
      alert("Unable to save the question. Please try again.");
      return;
    }

    const choicesToSave = choices.map((choice, index) => {
      return {
        question_id: data.id,
        label: choice.trim(),
        position: index,
      };
    });

    const { error: choicesError } = await supabase
      .from("choices")
      .insert(choicesToSave);

    if (choicesError) {
      console.error("Error saving answer choices:", choicesError);
      alert("The question was saved, but its answer choices could not be saved.");
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
    <form onSubmit={handleSubmit}>
      <h3>Create a Question</h3>

      <label htmlFor="questionText">Question</label>

      <input
        type="text"
        id="questionText"
        placeholder="Enter your question"
        value={questionText}
        onChange={(event) => setQuestionText(event.target.value)}
      />

      <h4>Answer Choices</h4>

      {choices.map((choice, index) => (
        <div key={index}>
          <label htmlFor={`choice-${index}`}>
            Choice {index +1}
          </label>

          <input  
            type="text"
            id={`choice-${index}`}
            value={choice}
            onChange={(event) => 
              handleChoiceChange(index, event.target.value)
            }
          />

          <button 
            type="button"
            onClick={() => handleRemoveChoice(index)}
            disabled={choices.length <= 2}
          >
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={handleAddChoice}>
        Add Choice
      </button>

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Question"}
      </button>
    </form>
  );
}

export default QuestionForm;
