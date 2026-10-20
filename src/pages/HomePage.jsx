import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div style={{ padding: 20, background: "lightgreen" }}>
      <h1>Roompulse Home</h1>
      <p>If you see this, routing with your pages works.</p>
      <p>
        <Link to="/login">Go to Login</Link>
      </p>
    </div>
  );
}