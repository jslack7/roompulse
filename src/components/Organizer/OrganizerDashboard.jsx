import { useState, useEffect } from "react";
import styles from "./OrganizerDashboard.module.css";
import SurveyForm from "./SurveyForm";
import SurveyCard from "./SurveyCard";
import { supabase } from "../../services/supabaseClient";
import LoadingSpinner from "../Shared/LoadingSpinner";
import QuestionForm from "./QuestionForm";
import SessionControls from "./SessionControls";
import QuestionList from "./QuestionList";

function OrganizerDashboard() {
    const [showForm, setShowForm] = useState(false);
    const [selectedPresentationId, setSelectedPresentationId] = useState(null);
    const [questionRefreshKey, setQuestionRefreshKey] = useState(0);
    const [presentations, setPresentations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authMessage, setAuthMessage] = useState("");
    const [fetchError, setFetchError] = useState("");

    function handlePresentationCreated(newPresentation) {
       setPresentations((previousPresentations) => {
        const alreadyExists = previousPresentations.some(
            (presentation) => presentation.id === newPresentation.id
        );

        if (alreadyExists) {
            return previousPresentations;
        }

        return [...previousPresentations, newPresentation];
       });

       setShowForm(false);
    }

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

            const { data, error } = await supabase
                .from("presentations")
                .select("*")
                .eq("owner_id", userData.user.id);

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
                
                {selectedPresentationId && (
                    <div>
                        <QuestionForm presentationId={selectedPresentationId} />

                        <QuestionList
                            key={`${selectedPresentationId}-${questionRefreshKey}`} 
                            presentationId={selectedPresentationId} />

                        <SessionControls 
                            key={selectedPresentationId}
                            presentationId={selectedPresentationId}
                            initialIsLive={
                                presentations.find(
                                    (presentation) => 
                                        presentation.id === selectedPresentationId
                                )?.is_live ?? false
                            }
                            onSessionChange={() => {
                                setQuestionRefreshKey((previous) => previous + 1);
                            }}
                        />
                    </div>
                )}
                
                {authMessage && <p>{authMessage}</p>}
                {fetchError && <p role="alert">{fetchError}</p>}
                {isLoading && <LoadingSpinner />}

                {!isLoading && !authMessage && !fetchError && presentations.length === 0 && 
                (
                    <p>You haven't created any presentations yet.</p>
                )}
                {presentations.map((presentation) => (
                    <div key={presentation.id}>
                        <SurveyCard title={presentation.title} />

                        <button
                            type="button"
                            onClick={() => setSelectedPresentationId(presentation.id)}
                        >
                            Add Questions
                        </button>
                    </div>
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
                    <SurveyForm 
                        onCancel={() => setShowForm(false)}
                        onPresentationCreated={handlePresentationCreated} 
                    />
                )}
            </section>
        </div>
    );
}

export default OrganizerDashboard;