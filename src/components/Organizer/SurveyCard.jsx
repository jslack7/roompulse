
 // Import CSS Module styling for this component.
import styles from "./SurveyCard.module.css";

// --------------------------------------------------
// SURVEY CARD COMPONENT
// --------------------------------------------------

// This component displays an individual presentation
// as a card on the Organizer Dashboard.
//
// It receives three props from OrganizerDashboard:
//
// title: The name of the presentation.
//
// isLive: A Boolean that determines whether the
// presentation is currently live.
//
// onDelete: A callback function passed from the
// parent component that handles deleting a presentation.
function SurveyCard({ title, isLive, onDelete }) {

  // --------------------------------------------------
  // COMPONENT USER INTERFACE (JSX)
  // --------------------------------------------------

  return (
    // Main container for the presentation card.
    <div className={styles.card}>

      {/* PRESENTATION ICON */}

      {/* This div contains an SVG icon.
          aria-hidden="true" tells screen readers
          to ignore the decorative icon. */}
      <div
        className={styles.icon}
        aria-hidden="true"
      >

        {/* SVG stands for Scalable Vector Graphics.
            It creates an icon using shapes and lines
            instead of an image file.

            width and height control its displayed size.
            viewBox defines the internal drawing area.
            stroke controls the line color.
            strokeWidth controls line thickness. */}
        <svg
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >

          {/* Draws the rectangular presentation screen.
              rx="2" gives the corners a rounded appearance. */}
          <rect
            x="3"
            y="3"
            width="18"
            height="14"
            rx="2"
          />

          {/* Draws the presentation stand and
              the chart-like line inside the screen. */}
          <path
            d="M8 21h8M12 17v4M7 12l3-3 3 2 4-4"
          />
        </svg>
      </div>

      {/* PRESENTATION TITLE */}

      {/* Displays the title received from the parent.
          The curly braces allow JavaScript values
          to be displayed inside JSX. */}
      <h3 className={styles.title}>
        {title}
      </h3>

      {/* PRESENTATION DESCRIPTION */}

      <p className={styles.description}>
        Manage your presentation here.
      </p>

      {/* DELETE PRESENTATION BUTTON */}

      <button
        type="button"
        className={styles.deleteButton}

        // Calls the deletion function provided
        // by OrganizerDashboard when clicked.
        onClick={onDelete}

        // Disable the button if isLive is true.
        // This prevents deletion through this button
        // while the presentation is running.
        disabled={isLive}
      >
        Delete Presentation
      </button>
    </div>
  );
}

// Export this component so OrganizerDashboard
// can import and display presentation cards.
export default SurveyCard;
