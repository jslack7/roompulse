
import styles from "./LoadingSpinner.module.css";

// This component displays a loading animation
// while RoomPulse retrieves information.
function LoadingSpinner() {
  return (
    <div className={styles.loadingContainer}>
      <div
        className={styles.spinner}
        role="status"
        aria-label="Loading"
      />
      <p className={styles.loadingText}>
        Loading...
      </p>
    </div>
  );
}

export default LoadingSpinner;
