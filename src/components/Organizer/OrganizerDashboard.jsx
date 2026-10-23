
import { useState, useEffect } from "react";
import styles from "./OrganizerDashboard.module.css";
import SurveyForm from "./SurveyForm";
import SurveyCard from "./SurveyCard";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../Shared/LoadingSpinner";
import QuestionForm from "./QuestionForm";
import SessionControls from "./SessionControls";
import QuestionList from "./QuestionList";
import ResultsChart from "../Shared/ResultsChart";

function OrganizerDashboard() {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [selectedPresentationId, setSelectedPresentationId] = useState(null);
  const [questionRefreshKey, setQuestionRefreshKey] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [presentations, setPresentations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [deletingPresentationId, setDeletingPresentationId] = useState(null);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
      return;
    }

    navigate("/login", { replace: true });
  }

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

  async function fetchActiveQuestion(presentationId) {
    const { data, error } = await supabase
      .from("presentations")
      .select("active_question_id")
      .eq("id", presentationId)
      .single();

    if (error) {
      console.error("Error fetching active question:", error);
      setActiveQuestionId(null);
      return;
    }

    setActiveQuestionId(data.active_question_id);
  }

  async function handleDeletePresentation(presentationId) {
    if (deletingPresentationId !== null) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this presentation? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingPresentationId(presentationId);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        alert("Please sign in before deleting a presentation.");
        return;
      }

      const { data: presentation, error: checkError } = await supabase
        .from("presentations")
        .select("id, is_live, owner_id")
        .eq("id", presentationId)
        .eq("owner_id", userData.user.id)
        .single();

      if (checkError || !presentation) {
        alert("Unable to verify this presentation. Please try again.");
        return;
      }

      if (presentation.is_live) {
        alert("You cannot delete a presentation while it is running.");
        return;
      }

      const { data: deletedPresentation, error: deleteError } = await supabase
        .from("presentations")
        .delete()
        .eq("id", presentationId)
        .eq("owner_id", userData.user.id)
        .eq("is_live", false)
        .select("id")
        .maybeSingle();

      if (deleteError) {
        console.error("Error deleting presentation:", deleteError);
        alert("Unable to delete presentation. Please try again.");
        return;
      }

      if (!deletedPresentation) {
        alert(
          "The presentation was not deleted. It may be running or you may not have permission."
        );
        return;
      }

      setPresentations((previousPresentations) =>
        previousPresentations.filter(
          (item) => item.id !== presentationId
        )
      );

      if (selectedPresentationId === presentationId) {
        setSelectedPresentationId(null);
        setActiveQuestionId(null);
      }
    } finally {
      setDeletingPresentationId(null);
    }
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

  useEffect(() => {
    if (!selectedPresentationId) return;

    const channel = supabase
      .channel(`dashboard-presentation-${selectedPresentationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "presentations",
          filter: `id=eq.${selectedPresentationId}`,
        },
        (payload) => {
          setActiveQuestionId(payload.new.active_question_id);

          setPresentations((previousPresentations) =>
            previousPresentations.map((presentation) =>
              presentation.id === payload.new.id
                ? { ...presentation, ...payload.new }
                : presentation
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPresentationId]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.heading}>
        <div>
          <h1>Organizer Dashboard</h1>
          <p>
            Welcome to RoomPulse! Manage your presentations here.
          </p>
        </div>

        <button
          className={styles.logoutButton}
          type="button"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      <section className={styles.presentations}>
        <div className={styles.sectionHeader}>
          <h2>My Presentations</h2>

          {!showForm && !authMessage && (
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => setShowForm(true)}
            >
              + Create Presentation
            </button>
          )}
        </div>

        {authMessage && (
          <p className={styles.infoMessage}>{authMessage}</p>
        )}

        {fetchError && (
          <p className={styles.errorMessage} role="alert">
            {fetchError}
          </p>
        )}

        {isLoading && <LoadingSpinner />}

        {!isLoading &&
          !authMessage &&
          !fetchError &&
          presentations.length === 0 && (
            <p className={styles.emptyState}>
              You haven't created any presentations yet.
            </p>
          )}

        <div className={styles.presentationGrid}>
          {presentations.map((presentation) => (
            <div
              className={`${styles.presentationCard} ${
                selectedPresentationId === presentation.id
                  ? styles.selectedCard
                  : ""
              }`}
              key={presentation.id}
            >
              <SurveyCard
                title={presentation.title}
                isLive={
                  presentation.is_live ||
                  deletingPresentationId === presentation.id
                }
                onDelete={() =>
                  handleDeletePresentation(presentation.id)
                }
              />

              <button
                className={styles.manageButton}
                type="button"
                onClick={() => {
                  if (selectedPresentationId === presentation.id) {
                    setSelectedPresentationId(null);
                    setActiveQuestionId(null);
                  } else {
                    setSelectedPresentationId(presentation.id);
                    setActiveQuestionId(null);
                    fetchActiveQuestion(presentation.id);
                  }
                }}
              >
                {selectedPresentationId === presentation.id
                  ? "Close Management"
                  : "Manage Presentation"}
              </button>

              <button
                className={styles.openPresentationButton}
                type="button"
                onClick={() => {
                  window.open(
                    `/present/${presentation.id}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                Open Presentation
              </button>
            </div>
          ))}
        </div>

        {showForm && (
          <div className={styles.formSection}>
            <SurveyForm
              onCancel={() => setShowForm(false)}
              onPresentationCreated={handlePresentationCreated}
            />
          </div>
        )}

        {selectedPresentationId && (
          <section className={styles.managementSection}>
            <h2>Manage Selected Presentation</h2>

            <div className={styles.managementContent}>
              <QuestionForm
                presentationId={selectedPresentationId}
              />

              <QuestionList
                key={`${selectedPresentationId}-${questionRefreshKey}`}
                presentationId={selectedPresentationId}
              />

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
                  setQuestionRefreshKey(
                    (previous) => previous + 1
                  );
                  fetchActiveQuestion(selectedPresentationId);

                  supabase
                    .from("presentations")
                    .select("*")
                    .eq("id", selectedPresentationId)
                    .single()
                    .then(({ data, error }) => {
                      if (!error && data) {
                        setPresentations((previousPresentations) =>
                          previousPresentations.map((presentation) =>
                            presentation.id === data.id
                              ? data
                              : presentation
                          )
                        );
                      }
                    });
                }}
              />

              {activeQuestionId && (
                <ResultsChart questionId={activeQuestionId} />
              )}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

export default OrganizerDashboard;
