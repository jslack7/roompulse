import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [presentations, setPresentations] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function loadPresentations() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setPresentations(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPresentations();
  }, []);

  async function createPresentation() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("presentations")
      .insert({ title, owner_id: user.id })
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setTitle("");
    setPresentations((prev) => [data, ...prev]);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>My presentations</h2>
      <button onClick={handleLogout}>Log out</button>

      <div style={{ margin: "16px 0" }}>
        <input
          placeholder="Presentation title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button onClick={createPresentation} disabled={!title.trim()}>
          Create
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : presentations.length === 0 ? (
        <p>No presentations yet.</p>
      ) : (
        <ul>
          {presentations.map((p) => (
            <li key={p.id}>
              {p.title} —{" "}
              <Link to={`/present/${p.id}`}>Presenter view</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}