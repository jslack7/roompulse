
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import styles from "./ParticipantVoting.module.css";

function ParticipantVoting({ presentationId }) {



  const [question, setQuestion] = useState(null);
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");


  const [selectedChoiceId, setSelectedChoiceId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasVoted, setHasVoted] = useState(false);


 

  useEffect(() => {
    let isActive = true;

    async function fetchActiveQuestion() {
      setIsLoading(true);
      setError("");

      const { data: presentation, error: presentationError } =
        await supabase
          .from("presentations")
          .select("is_live, active_question_id")
          .eq("id", presentationId)
          .maybeSingle();

      if (!isActive) return;

      if (presentationError) {
        setError("Unable to load the presentation.");
        setIsLoading(false);
        return;
      }

      if (!presentation?.is_live || !presentation.active_question_id) {
        setQuestion(null);
        setChoices([]);
        setIsLoading(false);
        return;
      }

      const { data: questionData, error: questionError } =
        await supabase
          .from("questions")
          .select("id, text, is_open")
          .eq("id", presentation.active_question_id)
          .eq("presentation_id", presentationId)
          .eq("is_open", true)
          .maybeSingle();

      if (!isActive) return;

      if (questionError) {
        setError("Unable to load the active question.");
        setIsLoading(false);
        return;
      }

      if (!questionData) {
        setQuestion(null);
        setChoices([]);
        setIsLoading(false);
        return;
      }

      const { data: choicesData, error: choicesError } =
        await supabase
          .from("choices")
          .select("id, label, position")
          .eq("question_id", questionData.id)
          .order("position", { ascending: true });

      if (!isActive) return;

      if (choicesError) {
        setError("Unable to load answer choices.");
      } else {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (!isActive) return;

        if (userError || !userData.user) {
          setError("Unable to verify participant.");
          setIsLoading(false);
          return;
        }

        const { data: existingVote, error: voteCheckError } =
          await supabase
            .from("votes")
            .select("id")
            .eq("question_id", questionData.id)
            .eq("voter_id", userData.user.id)
            .maybeSingle();
        if (!isActive) return;

        if (voteCheckError) {
          console.error("Error checking vote:", voteCheckError);
          setError("Unable to check your voting status.")
          setIsLoading(false);
          return;
        }

        setSelectedChoiceId("");

        setHasVoted(Boolean(existingVote));

        setQuestion(questionData);
        setChoices(choicesData ?? []);
      }

      setIsLoading(false);
    }

    if (!presentationId) {
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    fetchActiveQuestion();

    const channel = supabase
      .channel(`presentation-${presentationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "presentations",
          filter: `id=eq.${presentationId}`,
        },
        () => {
          fetchActiveQuestion();
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [presentationId]);





  async function handleSubmitVote(event) {
    event.preventDefault();

    if (!selectedChoiceId || !question) {
      setError("Please select an answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { error: voteError } = await supabase
        .from("votes")
        .insert({
          question_id: question.id,
          choice_id: selectedChoiceId,
        });

      if (voteError) {
        console.error("Error submitting vote:", voteError);

        
        if (voteError.code === "23505") {
          setError("You have already voted on this question.");
        } else {
          setError("Unable to submit your vote. Please try again.");
        }

        return;
      }

      
      setHasVoted(true);

    } catch (unexpectedError) {
      console.error("Unexpected voting error:", unexpectedError);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }




  
  if (isLoading) {
    return (
      <p className={styles.loadingMessage}>
        Loading active question...
      </p>
    );
  }

  if (error && !question) {
    return (
      <p className={styles.errorMessage} role="alert">
        {error}
      </p>
    );
  }

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

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Live Question</h2>

      <h3 className={styles.question}>
        {question.text}
      </h3>

      {hasVoted ? (
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>

          <h3 className={styles.successTitle}>
            Vote Submitted!
          </h3>

          <p className={styles.message}>
            Thank you for participating in RoomPulse.
          </p>
        </div>
      ) : (
        <form
          className={styles.form}
          onSubmit={handleSubmitVote}
        >
          <fieldset
            className={styles.choices}
            aria-label="Answer choices"
          >
            {choices.map((choice) => (
              <label
                key={choice.id}
                className={`${styles.choice} ${
                  selectedChoiceId === choice.id
                    ? styles.choiceSelected
                    : ""
                }`}
              >
                <input
                  className={styles.choiceInput}
                  type="radio"
                  name="pollAnswer"
                  value={choice.id}
                  checked={selectedChoiceId === choice.id}
                  onChange={() =>
                    setSelectedChoiceId(choice.id)
                  }
                  disabled={isSubmitting}
                />

                <span className={styles.choiceText}>
                  {choice.label}
                </span>
              </label>
            ))}
          </fieldset>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting || !selectedChoiceId}
          >
            {isSubmitting ? "Submitting..." : "Submit Vote"}
          </button>
        </form>
      )}

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default ParticipantVoting;
