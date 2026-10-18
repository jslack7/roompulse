import { useState, useEffect } from "react";
import styles from "./OrganizerDashboard.module.css";
import SurveyForm from "./SurveyForm";
import SurveyCard from "./SurveyCard";
import { supabase } from "../../services/supabaseClient";
import LoadingSpinner from "../Shared/LoadingSpinner";
import QuestionForm from "./QuestionForm";

function OrganizerDashboard() {
    const [showForm, setShowForm] = useState(false);
    const [presentations, setPresentations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authMessage, setAuthMessage] = useState("");
    const [fetchError, setFetchError] = useState("");

    useEffect(() => {
        async function fetchPresentations() {

            const { data: userData, error: userError } =
                await supabase.auth.getUser();
            if (userError || !userData.user) {
                console.log("No authenticated organizer found.");
                setAuthMessage("Please sign in to view your presentations.");
                setIsLoading(false);
                return;
            }

            console.log("Signed-in organizer ID:", userData.user.id);
            const { data, error } = await supabase
                .from("presentations")
                .select("*")
                .eq("owner_id", userData.user.id);

            console.log("Presentations:", data);
            console.log("Error:", error);

            if (error) {
                setFetchError("Unable to load presentations. Please try again.");
            } else {
                setPresentations(data);
            }

            setIsLoading(false);
        }

        fetchPresentations();
    }, []);

    return (
        <div className={styles.dashboard}>
            <div className={styles.heading}>
                <h1>Organizer Dashboard</h1>
                <p>Welcome to RoomPulse! Manage your surveys here.</p>
            </div>
            <section className={styles.presentations}>
                <h2>My Presentations</h2>
                <QuestionForm />
                {authMessage && <p>{authMessage}</p>}
                {fetchError && <p role="alert">{fetchError}</p>}
                {isLoading && <LoadingSpinner />}

                {!isLoading && !authMessage && !fetchError && presentations.length === 0 && 
                (
                    <p>You haven't created any presentations yet.</p>
                )}
                {presentations.map((presentation) => (
                    <SurveyCard 
                        key={presentation.id}
                        title={presentation.title}
                    />
                ))}

                {!showForm && !authMessage && (
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