import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { supabase } from "../services/supabaseClient";
import ResultsChart from "../components/Shared/ResultsChart";

export default function PresentationPage() {
  const { id: presentationId } = useParams();
  const [presentation, setPresentation] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const voteUrl = `${window.location.origin}/join?session=${presentationId}`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("id", presentationId)
        .single();

      if (error) {
        console.error(error);
        setErrorMsg("Could not load presentation.");
      } else {
        setPresentation(data);
      }

      setLoading(false);
    })();
  }, [presentationId]);

    useEffect(() => {
      if (!presentationId) return;

      let isActive = true;

      async function fetchActiveQuestion() {
        const { data: presentationData, error: presentationError } =
          await supabase
            .from("presentations")
            .select("active_question_id")
            .eq("id", presentationId)
            .single();

        if (presentationError || !isActive) return;

        if (!presentationData.active_question_id) {
          setActiveQuestion(null);
          return;
        }

        const { data: questionData, error: questionError } =
          await supabase
            .from("questions")
            .select("id, text")
            .eq("id", presentationData.active_question_id)
            .single();

        if (questionError || !isActive) return;

        setActiveQuestion(questionData);
      }

      fetchActiveQuestion();

      const channel = supabase
        .channel(`presenter-${presentationId}`)
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

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (errorMsg) return <div style={{ padding: 20 }}>{errorMsg}</div>;
  if (!presentation) return <div style={{ padding: 20 }}>Not found.</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Presenter view</h1>
      <h2>{presentation.title}</h2>

      <h3>Ask the audience to scan this QR code to vote</h3>
      <div style={{ background: "white", padding: 16, display: "inline-block" }}>
        <QRCode value={voteUrl} size={256} />
      </div>
      <p>Or open: {voteUrl}</p>

      <div style={{ marginTop: 32 }}>
        {activeQuestion ? (
          <>
            <h2>{activeQuestion.text}</h2>
            <ResultsChart questionId={activeQuestion.id} />
          </>
        ) : (
          <p>Waiting for the organizer to activate a question...</p>
        )}
      </div>
    </div>
  );
}