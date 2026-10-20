
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";

function ResultsChart({ questionId }) {

  
  const [votes, setVotes] = useState([]);

  
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

      if (!isActive) return;

      if (fetchError) {
        console.error("Error fetching votes:", fetchError);
        setError("Unable to load voting results.");
      } else {
        setVotes(data ?? []);
      }

      setIsLoading(false);
    }

    if (questionId) {
      fetchVotes();
    } else {
      setVotes([]);
      setIsLoading(false);
    }

    return () => {
      isActive = false;
    };
  }, [questionId]);

  if (isLoading) {
    return <p>Loading voting results...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div>
      <h2>Live Results</h2>

      <p>Total votes: {votes.length}</p>
    </div>
  );
}

export default ResultsChart;
