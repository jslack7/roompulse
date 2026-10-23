
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Dashboard styling
import styles from "./OrganizerDashboard.module.css";

// Organizer components
import SurveyForm from "./SurveyForm";
import SurveyCard from "./SurveyCard";
import QuestionForm from "./QuestionForm";
import SessionControls from "./SessionControls";
import QuestionList from "./QuestionList";
import AccountSettings from "./AccountSettings";

// Shared components
import LoadingSpinner from "../Shared/LoadingSpinner";
import ResultsChart from "../Shared/ResultsChart";

// Supabase database and authentication connection
import { supabase } from "../../services/supabaseClient";

function OrganizerDashboard() {
  // Allows us to navigate to another page.
  const navigate = useNavigate();

  // Controls whether the Create Presentation form is visible.
  const [showForm, setShowForm] = useState(false);

  // Stores the ID of the presentation being managed.
  const [selectedPresentationId, setSelectedPresentationId] =
    useState(null);

  // Forces QuestionList to refresh after session changes.
  const [questionRefreshKey, setQuestionRefreshKey] = useState(0);

  // Stores the question currently active in a presentation.
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  // Stores the organizer's presentations from Supabase.
  const [presentations, setPresentations] = useState([]);

  // Tracks whether presentations are loading.
  const [isLoading, setIsLoading] = useState(true);

  // Stores authentication and database error messages.
  const [authMessage, setAuthMessage] = useState("");
  const [fetchError, setFetchError] = useState("");

  // Tracks which presentation is currently being deleted.
  const [deletingPresentationId, setDeletingPresentationId] =
    useState(null);

  // --------------------------------------------------
  // LOG OUT
  // --------------------------------------------------

  async function handleLogout() {
    // End the organizer's Supabase authentication session.
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
      return;
    }

    // Redirect to the login page after logging out.
    navigate("/login", { replace: true });
  }

  // --------------------------------------------------
  // ADD A NEW PRESENTATION
  // --------------------------------------------------

  function handlePresentationCreated(newPresentation) {
    setPresentations((previousPresentations) => {
      // Prevent the same presentation from appearing twice.
      const alreadyExists = previousPresentations.some(
        (presentation) =>
          presentation.id === newPresentation.id
      );

      if (alreadyExists) {
        return previousPresentations;
      }

      // Add the newly created presentation to the dashboard.
      return [...previousPresentations, newPresentation];
    });

    // Hide the creation form after the presentation is added.
    setShowForm(false);
  }

  // --------------------------------------------------
  // FETCH THE ACTIVE QUESTION
  // --------------------------------------------------

  async function fetchActiveQuestion(presentationId) {
    // Retrieve the active question ID for a presentation.
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

    // Update the active question in React state.
    setActiveQuestionId(data.active_question_id);
  }

  // --------------------------------------------------
  // DELETE A PRESENTATION
  // --------------------------------------------------

  async function handleDeletePresentation(presentationId) {
    // Prevent multiple deletion requests at the same time.
    if (deletingPresentationId !== null) {
      return;
    }

    // Ask the organizer to confirm permanent deletion.
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this presentation? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    // Mark the presentation as being deleted.
    setDeletingPresentationId(presentationId);

    try {
      // Verify that the organizer is signed in.
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        alert("Please sign in before deleting a presentation.");
        return;
      }

      // Confirm that this presentation belongs to the organizer.
      const { data: presentation, error: checkError } =
        await supabase
          .from("presentations")
          .select("id, is_live, owner_id")
          .eq("id", presentationId)
          .eq("owner_id", userData.user.id)
          .single();

      if (checkError || !presentation) {
        alert(
          "Unable to verify this presentation. Please try again."
        );
        return;
      }

      // Live presentations cannot be deleted.
      if (presentation.is_live) {
        alert(
          "You cannot delete a presentation while it is running."
        );
        return;
      }

      // Delete only a presentation owned by this organizer
      // that is not currently live.
      const {
        data: deletedPresentation,
        error: deleteError,
      } = await supabase
        .from("presentations")
        .delete()
        .eq("id", presentationId)
        .eq("owner_id", userData.user.id)
        .eq("is_live", false)
        .select("id")
        .maybeSingle();

      if (deleteError) {
        console.error(
          "Error deleting presentation:",
          deleteError
        );
        alert("Unable to delete presentation. Please try again.");
        return;
      }

      // Check whether Supabase actually deleted a record.
      if (!deletedPresentation) {
        alert(
          "The presentation was not deleted. It may be running or you may not have permission."
        );
        return;
      }

      // Remove the deleted presentation from the dashboard.
      setPresentations((previousPresentations) =>
        previousPresentations.filter(
          (item) => item.id !== presentationId
        )
      );

      // Close the management section if its presentation
      // was the one that was deleted.
      if (selectedPresentationId === presentationId) {
        setSelectedPresentationId(null);
        setActiveQuestionId(null);
      }
    } finally {
      // Reset deletion state when the request finishes.
      setDeletingPresentationId(null);
    }
  }

  // --------------------------------------------------
  // LOAD PRESENTATIONS WHEN THE DASHBOARD OPENS
  // --------------------------------------------------

  useEffect(() => {
    async function fetchPresentations() {
      // Get the currently signed-in organizer.
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.log("No authenticated organizer found.");

        setAuthMessage(
          "Please sign in to view your presentations."
        );

        setIsLoading(false);
        return;
      }

      // Fetch only presentations owned by this organizer.
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("owner_id", userData.user.id);

      if (error) {
        setFetchError(
          "Unable to load presentations. Please try again."
        );
      } else {
        // Store the returned presentations in React state.
        setPresentations(data);
      }

      // Stop displaying the loading spinner.
      setIsLoading(false);
    }

    fetchPresentations();
  }, []);

  // --------------------------------------------------
  // LISTEN FOR REAL-TIME PRESENTATION UPDATES
  // --------------------------------------------------

  useEffect(() => {
    // Only subscribe when a presentation is selected.
    if (!selectedPresentationId) return;

    // Create a Supabase Realtime channel.
    const channel = supabase
      .channel(
        `dashboard-presentation-${selectedPresentationId}`
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "presentations",
          filter: `id=eq.${selectedPresentationId}`,
        },
        (payload) => {
          // Update the active question when it changes.
          setActiveQuestionId(
            payload.new.active_question_id
          );

          // Update the changed presentation in state.
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

    // Remove the subscription when the selected
    // presentation changes or the component unmounts.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPresentationId]);

  // --------------------------------------------------
  // DASHBOARD USER INTERFACE
  // --------------------------------------------------

  return (
    <div className={styles.dashboard}>
      {/* Dashboard heading and logout button */}
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

      {/* PRESENTATIONS SECTION */}
      <section className={styles.presentations}>
        <div className={styles.sectionHeader}>
          <h2>My Presentations</h2>

          {/* Display the Create Presentation button
              when the form is closed and there is no auth error. */}
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

        {/* Authentication message */}
        {authMessage && (
          <p className={styles.infoMessage}>
            {authMessage}
          </p>
        )}

        {/* Error message if presentations cannot load */}
        {fetchError && (
          <p
            className={styles.errorMessage}
            role="alert"
          >
            {fetchError}
          </p>
        )}

        {/* Display a spinner while data is loading */}
        {isLoading && <LoadingSpinner />}

        {/* Empty state for organizers with no presentations */}
        {!isLoading &&
          !authMessage &&
          !fetchError &&
          presentations.length === 0 && (
            <p className={styles.emptyState}>
              You haven't created any presentations yet.
            </p>
          )}

        {/* PRESENTATION CARDS */}
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
              {/* Display the presentation's title and status */}
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

              {/* Open or close presentation management */}
              <button
                className={styles.manageButton}
                type="button"
                onClick={() => {
                  if (
                    selectedPresentationId === presentation.id
                  ) {
                    // Close the currently selected presentation.
                    setSelectedPresentationId(null);
                    setActiveQuestionId(null);
                  } else {
                    // Select a presentation and load its active question.
                    setSelectedPresentationId(
                      presentation.id
                    );
                    setActiveQuestionId(null);
                    fetchActiveQuestion(presentation.id);
                  }
                }}
              >
                {selectedPresentationId === presentation.id
                  ? "Close Management"
                  : "Manage Presentation"}
              </button>

              {/* Open the presentation in a new browser tab */}
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

        {/* CREATE PRESENTATION FORM */}
        {showForm && (
          <div className={styles.formSection}>
            <SurveyForm
              onCancel={() => setShowForm(false)}
              onPresentationCreated={
                handlePresentationCreated
              }
            />
          </div>
        )}

        {/* SELECTED PRESENTATION MANAGEMENT */}
        {selectedPresentationId && (
          <section className={styles.managementSection}>
            <h2>Manage Selected Presentation</h2>

            <div className={styles.managementContent}>
              {/* Form for adding questions */}
              <QuestionForm
                presentationId={selectedPresentationId}
              />

              {/* List of questions for this presentation */}
              <QuestionList
                key={`${selectedPresentationId}-${questionRefreshKey}`}
                presentationId={selectedPresentationId}
              />

              {/* Controls for starting and stopping sessions */}
              <SessionControls
                key={selectedPresentationId}
                presentationId={selectedPresentationId}
                initialIsLive={
                  presentations.find(
                    (presentation) =>
                      presentation.id ===
                      selectedPresentationId
                  )?.is_live ?? false
                }
                onSessionChange={() => {
                  // Refresh questions after a session change.
                  setQuestionRefreshKey(
                    (previous) => previous + 1
                  );

                  // Fetch the latest active question.
                  fetchActiveQuestion(
                    selectedPresentationId
                  );

                  // Refresh presentation data from Supabase.
                  supabase
                    .from("presentations")
                    .select("*")
                    .eq("id", selectedPresentationId)
                    .single()
                    .then(({ data, error }) => {
                      if (!error && data) {
                        setPresentations(
                          (previousPresentations) =>
                            previousPresentations.map(
                              (presentation) =>
                                presentation.id === data.id
                                  ? data
                                  : presentation
                            )
                        );
                      }
                    });
                }}
              />

              {/* Display results for the active question */}
              {activeQuestionId && (
                <ResultsChart
                  questionId={activeQuestionId}
                />
              )}
            </div>
          </section>
        )}
      </section>

      {/* ACCOUNT SETTINGS
          This component manages its own expand/collapse state.
          Keep it outside the presentations section.
          Only show it after successful authentication. */}
      {!authMessage && !isLoading && (
        <AccountSettings />
      )}
    </div>
  );
}

export default OrganizerDashboard;
