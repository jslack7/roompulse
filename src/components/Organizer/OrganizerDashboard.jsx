import { useState } from "react";
import styles from "./OrganizerDashboard.module.css";
import SurveyForm from "./SurveyForm";

function OrganizerDashboard() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className={styles.dashboard}>
            <div className={styles.heading}>
                <h1>Organizer Dashboard</h1>
                <p>Welcome to RoomPulse! Manage your surveys here.</p>
            </div>
            <section className={styles.presentations}>
                <h2>My Presentations</h2>

                {!showForm && (
                    <button 
                        type="button"
                        onClick={() => setShowForm(true)}
                    >
                        Create Presentation
                    </button>
                )}   

                {showForm && (
                    <SurveyForm onCancel={() => setShowForm(false)} />
                )}
            </section>
        </div>
    );
}

export default OrganizerDashboard;