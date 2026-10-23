
import { useEffect, useState } from "react";

// useParams allows us to retrieve information
// from the URL, such as a presentation ID.
import { useParams } from "react-router-dom";

// Import the QR code component from react-qr-code.
// This library generates a scannable QR code.
import QRCode from "react-qr-code";

// Import our Supabase connection for database
// queries and real-time updates.
import { supabase } from "../services/supabaseClient";

// Import the ResultsChart component to display
// live voting results for the active question.
import ResultsChart from "../components/Shared/ResultsChart";

// --------------------------------------------------
// PRESENTATION PAGE COMPONENT
// --------------------------------------------------

// This component displays the presenter view.
//
// It allows the presenter to:
// 1. See the presentation title.
// 2. Display a QR code for participants to join.
// 3. See the currently active question.
// 4. View live voting results.
export default function PresentationPage() {

  // --------------------------------------------------
  // REACT ROUTER PARAMETERS
  // --------------------------------------------------

  // useParams retrieves dynamic values from the URL.
  //
  // For example, if the route is:
  // /presentation/abc123
  //
  // useParams() returns an object containing:
  // { id: "abc123" }
  //
  // We rename id to presentationId for clarity.
  const { id: presentationId } = useParams();

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores the presentation retrieved from Supabase.
  // null means no presentation has been loaded yet.
  const [presentation, setPresentation] = useState(null);

  // Stores the currently active question.
  // null means no question is currently active.
  const [activeQuestion, setActiveQuestion] = useState(null);

  // Tracks whether the presentation is loading.
  const [loading, setLoading] = useState(true);

  // Stores an error message if the presentation
  // cannot be loaded.
  const [errorMsg, setErrorMsg] = useState("");

  // --------------------------------------------------
  // GENERATE PARTICIPANT JOIN URL
  // --------------------------------------------------

  // window.location.origin returns the website's
  // base address, including its protocol and domain.
  //
  // For example:
  // https://example.com
  //
  // We combine that address with the join route
  // and the current presentation ID.
  //
  // Example result:
  // https://example.com/join?session=abc123
  //
  // This URL is used to generate the QR code.
  const voteUrl =
    `${window.location.origin}/join?session=${presentationId}`;

  // --------------------------------------------------
  // LOAD PRESENTATION INFORMATION
  // --------------------------------------------------

  // This effect runs when the page first loads
  // and whenever presentationId changes.
  useEffect(() => {

    // This is an immediately invoked async function.
    //
    // It allows us to use await inside useEffect
    // without making the effect callback itself async.
    (async () => {

      // Show the loading message.
      setLoading(true);

      // Clear any previous error.
      setErrorMsg("");

      // --------------------------------------------------
      // FETCH PRESENTATION FROM SUPABASE
      // --------------------------------------------------

      // Retrieve the presentation matching the URL ID.
      const { data, error } = await supabase
        .from("presentations")

        // Select all columns from the presentation record.
        .select("*")

        // Only retrieve the matching presentation.
        .eq("id", presentationId)

        // Expect exactly one presentation record.
        .single();

      // --------------------------------------------------
      // HANDLE FETCH RESULTS
      // --------------------------------------------------

      if (error) {

        // Log the database error for debugging.
        console.error(error);

        // Display a user-friendly error message.
        setErrorMsg("Could not load presentation.");

      } else {

        // Save the presentation in React state.
        //
        // This allows the title to appear on the page.
        setPresentation(data);
      }

      // Hide the loading message.
      setLoading(false);

    })();

  }, [presentationId]);

  // --------------------------------------------------
  // LOAD AND MONITOR THE ACTIVE QUESTION
  // --------------------------------------------------

  // This second useEffect handles the active question
  // separately from the presentation information.
  //
  // It also listens for Supabase Realtime updates
  // when the organizer activates a different question.
  useEffect(() => {

    // Stop if no presentation ID exists.
    if (!presentationId) return;

    // Tracks whether this effect is still active.
    //
    // This helps prevent outdated requests from
    // updating state after the component unmounts.
    let isActive = true;

    // --------------------------------------------------
    // FETCH ACTIVE QUESTION
    // --------------------------------------------------

    async function fetchActiveQuestion() {

      // First, retrieve the ID of the currently
      // active question from the presentations table.
      const {
        data: presentationData,
        error: presentationError,
      } = await supabase
        .from("presentations")
        .select("active_question_id")
        .eq("id", presentationId)
        .single();

      // Stop if the query fails or the effect
      // is no longer active.
      if (presentationError || !isActive) return;

      // --------------------------------------------------
      // CHECK WHETHER A QUESTION IS ACTIVE
      // --------------------------------------------------

      // If active_question_id is empty,
      // there is no active question to display.
      if (!presentationData.active_question_id) {

        // Clear the previously displayed question.
        setActiveQuestion(null);
        return;
      }

      // --------------------------------------------------
      // FETCH QUESTION INFORMATION
      // --------------------------------------------------

      // Retrieve the question matching the active ID.
      const {
        data: questionData,
        error: questionError,
      } = await supabase
        .from("questions")

        // Retrieve the question ID and text.
        .select("id, text")

        // Match the active question ID.
        .eq("id", presentationData.active_question_id)

        // Expect one question.
        .single();

      // Stop if the query fails or the effect
      // is no longer active.
      if (questionError || !isActive) return;

      // Store the active question in React state.
      //
      // React will display its text and ResultsChart.
      setActiveQuestion(questionData);
    }

    // --------------------------------------------------
    // INITIAL QUESTION FETCH
    // --------------------------------------------------

    // Load the active question when this effect starts.
    fetchActiveQuestion();

    // --------------------------------------------------
    // SUPABASE REALTIME SUBSCRIPTION
    // --------------------------------------------------

    // Create a Realtime channel for this presentation.
    //
    // The channel listens for changes to the
    // presentations table.
    const channel = supabase
      .channel(`presenter-${presentationId}`)
      .on(
        "postgres_changes",
        {
          // Listen for UPDATE events.
          event: "UPDATE",

          // Listen to the public schema.
          schema: "public",

          // Watch the presentations table.
          table: "presentations",

          // Only watch this specific presentation.
          filter: `id=eq.${presentationId}`,
        },

        // This callback runs when Supabase detects
        // an update to the presentation.
        () => {

          // Fetch the latest active question.
          fetchActiveQuestion();
        }
      )

      // Start listening for database updates.
      .subscribe();

    // --------------------------------------------------
    // CLEANUP REALTIME SUBSCRIPTION
    // --------------------------------------------------

    // Runs when the component unmounts
    // or presentationId changes.
    return () => {

      // Prevent outdated requests from updating state.
      isActive = false;

      // Remove the Supabase channel to avoid
      // leaving unnecessary subscriptions active.
      supabase.removeChannel(channel);
    };

  }, [presentationId]);

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  // Show this message while loading the presentation.
  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        Loading...
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------

  // Display an error if the presentation failed to load.
  if (errorMsg) {
    return (
      <div style={{ padding: 20 }}>
        {errorMsg}
      </div>
    );
  }

  // --------------------------------------------------
  // PRESENTATION NOT FOUND
  // --------------------------------------------------

  // If there is no presentation to display,
  // show a fallback message.
  if (!presentation) {
    return (
      <div style={{ padding: 20 }}>
        Not found.
      </div>
    );
  }

  // --------------------------------------------------
  // PRESENTER VIEW USER INTERFACE
  // --------------------------------------------------

  return (
    <div style={{ padding: 20 }}>

      {/* PAGE HEADING */}
      <h1>
        Presenter view
      </h1>

      {/* DISPLAY PRESENTATION TITLE */}
      <h2>
        {presentation.title}
      </h2>

      {/* --------------------------------------------------
          PARTICIPANT JOIN QR CODE
          -------------------------------------------------- */}

      <h3>
        Ask the audience to scan this QR code to vote
      </h3>

      {/* White background provides contrast
          so the QR code is easier to scan. */}
      <div
        style={{
          background: "white",
          padding: 16,
          display: "inline-block",
        }}
      >

        {/* QRCode generates a scannable code
            using the participant join URL.

            value determines the encoded URL.
            size determines its dimensions in pixels. */}
        <QRCode
          value={voteUrl}
          size={256}
        />
      </div>

      {/* Display the join URL as a text alternative
          for participants who cannot scan the code. */}
      <p>
        Or open: {voteUrl}
      </p>

      {/* --------------------------------------------------
          ACTIVE QUESTION AND RESULTS
          -------------------------------------------------- */}

      <div style={{ marginTop: 32 }}>

        {/* Check whether an active question exists. */}
        {activeQuestion ? (

          // React Fragment groups multiple elements
          // without adding another HTML container.
          <>

            {/* DISPLAY ACTIVE QUESTION TEXT */}
            <h2>
              {activeQuestion.text}
            </h2>

            {/* DISPLAY LIVE VOTING RESULTS */}

            {/* Pass the active question's ID
                to ResultsChart through props.

                ResultsChart uses that ID to retrieve
                votes and calculate the results. */}
            <ResultsChart
              questionId={activeQuestion.id}
            />
          </>

        ) : (

          // Show this message until the organizer
          // activates a question.
          <p>
            Waiting for the organizer to activate a question...
          </p>
        )}
      </div>
    </div>
  );
}
