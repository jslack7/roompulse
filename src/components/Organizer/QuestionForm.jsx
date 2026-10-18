import { useState } from "react";


function QuestionForm() {

  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState(["", ""]);

  function handleSubmit(event) {
    event.preventDefault();

    if (questionText.trim() === "") {
      alert("Please enter a question.");
      return;
    }
    console.log("Question submitted:", questionText);
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
            readOnly
          />
        </div>
      ))}
      <button type="submit">
        Save Question
      </button>
    </form>
  );
}

export default QuestionForm;
