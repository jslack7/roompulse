
import { StrictMode } from "react";

// createRoot connects React to the HTML page.
import { createRoot } from "react-dom/client";

// Global styles for the application.
import "./index.css";

// Main component containing RoomPulse routes.
import App from "./App.jsx";

// Enables navigation using React Router.
import { BrowserRouter } from "react-router-dom";

// Find the root element in index.html and render React.
createRoot(document.getElementById("root")).render(

  // StrictMode checks for potential issues during development.
  <StrictMode>

    {/* BrowserRouter enables navigation between pages
        without requiring a full browser refresh. */}
    <BrowserRouter>

      {/* App contains the routes and authentication logic
          for the RoomPulse application. */}
      <App />

    </BrowserRouter>
  </StrictMode>
);
