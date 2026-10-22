
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import styles from "./QuestionList.module.css";

function QuestionList({ presentationId }) {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activatingQuestionId, setActivatingQuestionId] = useState(null);

  async function handleActivateQuestion(questionId) {
    setActivatingQuestionId(questionId);
    setError("");

    try {
        const { error: activationError } = await supabase.rpc(
            "activate_question",
            {
                p_presentation_id: presentationId,
                p_question_id: questionId,
            }
        );

        if (activationError) {
            console.error("Error activating question:", activationError);
            setError(activationError.message);
            return;
        }

        setQuestions((previousQuestions) =>
            previousQuestions.map((question) => ({
                ...question,
                is_open: question.id === questionId,
            })) 
        );

        alert("Question activated successfully!");
    }   catch (unexpectedError) {
        console.error("Unexpected activation error:", unexpectedError);
        setError("Unable to activate the question. Please try again.");
    }   finally {
        setActivatingQuestionId(null);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function fetchQuestions() {
      setIsLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("id, text, is_open, position")
        .eq("presentation_id", presentationId)
        .order("position", { ascending: true });

      if (!isActive) return;

      if (fetchError) {
        console.error("Error loading questions:", fetchError);
        setError("Unable to load questions.");
      } else {
        setQuestions(data ?? []);
      }

      setIsLoading(false);
    }

    if (presentationId) {
      fetchQuestions();
    }

    return () => {
      isActive = false;
    };
  }, [presentationId]);

  
  if (isLoading) {
    return (
      <p className={styles.loadingMessage}>
        Loading questions...
      </p>
    );
  }

  if (error) {
    return (
      <p className={styles.errorMessage} role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Saved Questions</h3>

      {questions.length === 0 ? (
        <p className={styles.emptyState}>
          No questions have been added yet.
        </p>
      ) : (
        <ul className={styles.questionList}>
          {questions.map((question) => (
            <li
              className={styles.questionCard}
              key={question.id}
            >
              <div className={styles.questionHeader}>
                <p className={styles.questionText}>
                  {question.text}
                </p>

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

              <button
                className={styles.activateButton}
                type="button"
                disabled={
                  activatingQuestionId !== null ||
                  question.is_open
                }
                onClick={() =>
                  handleActivateQuestion(question.id)
                }
              >
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


export default QuestionList;
