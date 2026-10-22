
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import styles from "./ResultsChart.module.css";

function ResultsChart({ questionId }) {

  
  const [votes, setVotes] = useState([]);  
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    

    async function fetchVotes() {
      setIsLoading(true);
      setError("");

      
      const { data, error: fetchError } = await supabase
        .from("votes")
        .select("id, question_id, choice_id")
        .eq("question_id", questionId);

      const { data: choicesData, error: choicesError } = await supabase
        .from("choices")
        .select("id, label, position")
        .eq("question_id", questionId)
        .order("position", {ascending: true});


      if (!isActive) return;

      if (fetchError || choicesError) {
        console.error("Error fetching results:", fetchError || choicesError);
        setError("Unable to load voting results.");
      } else {
        setVotes(data ?? []);
        setChoices(choicesData ?? []);
      }

      setIsLoading(false);
    }

    if (questionId) {
      fetchVotes();

      const channel = supabase
        .channel(`results-${questionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "votes",
            filter: `question_id=eq.${questionId}`,
          },
          (payload) => {
            console.log("New vote received:", payload);
            fetchVotes();
          }
        )
        .subscribe((status, error) => {
          console.log("Results Realtime status:", status);

          if (error) {
            console.error("Results Realtime error:", error)
          }
        });

      return () => {
        isActive = false;
        supabase.removeChannel(channel);
      };
    } else {
      setVotes([]);
      setChoices([]);
      setIsLoading(false);
    }

    return () => {
      isActive = false;
    };
  }, [questionId]);

  

  
  if (isLoading) {
    return (
      <p className={styles.loadingMessage}>
        Loading voting results...
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
      <div className={styles.header}>
        <h2 className={styles.title}>Live Results</h2>

        <p className={styles.totalVotes}>
          Total votes: {votes.length}
        </p>
      </div>

      {choices.length === 0 ? (
        <p className={styles.emptyState}>
          No answer choices available.
        </p>
      ) : (
        <div className={styles.resultsList}>
          {choices.map((choice) => {
            const voteCount = votes.filter(
              (vote) => vote.choice_id === choice.id
            ).length;

            const percentage =
              votes.length > 0
                ? Math.round((voteCount / votes.length) * 100)
                : 0;

            return (
              <div className={styles.resultItem} key={choice.id}>
                <div className={styles.resultHeader}>
                  <span className={styles.choiceLabel}>
                    {choice.label}
                  </span>

                  <span className={styles.voteDetails}>
                    {voteCount} votes ({percentage}%)
                  </span>
                </div>

                <div
                  className={styles.progressTrack}
                  role="progressbar"
                  aria-label={`${choice.label} vote percentage`}
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={styles.progressFill}
                    style={{ width: `${percentage}%` }}
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


export default ResultsChart;
