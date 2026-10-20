import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { supabase } from "../services/supabaseClient";

export default function PresentationPage() {
  const { presentationId } = useParams();
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const voteUrl = `${window.location.origin}/vote/${presentationId}`;

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

      <p style={{ marginTop: 16 }}>
        (Next step: we will show the current question and live results here.)
      </p>
    </div>
  );
}