import styles from "./SurveyCard.module.css";

function SurveyCard({ title }) {
  return (
    <div className={styles.card}>
      <div className={styles.icon} aria-hidden="true">
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
          <rect x="3" y="3" width="18" height="14" rx="2" />
          <path d="M8 21h8M12 17v4M7 12l3-3 3 2 4-4" />
        </svg>
      </div>

      <h3 className={styles.title}>{title}</h3>

      <p className={styles.description}>
        Manage your presentation here.
      </p>
    </div>
  );
}

export default SurveyCard;
