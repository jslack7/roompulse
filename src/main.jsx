import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import VotePage from "./pages/VotePage.jsx";
import PresentationPage from "./pages/PresentationPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* landing page */}
        <Route path="/" element={<HomePage />} />

        {/* organizer auth + dashboard */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* presenter + voter */}
        <Route path="/present/:presentationId" element={<PresentationPage />} />
        <Route path="/vote/:presentationId" element={<VotePage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);