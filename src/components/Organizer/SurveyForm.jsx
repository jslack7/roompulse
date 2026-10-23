
import { useState } from "react";

// Import our Supabase connection for authentication
// and database operations.
import { supabase } from "../../services/supabaseClient";

// Import CSS Module styling for this component.
import styles from "./SurveyForm.module.css";

// --------------------------------------------------
// SURVEY FORM COMPONENT
// --------------------------------------------------

// This component allows an organizer to create
// a new presentation in RoomPulse.
//
// It receives two props from OrganizerDashboard:
//
// onCancel: A callback function that closes the form
// when the organizer clicks the Cancel button.
//
// onPresentationCreated: A callback function that sends
// the newly created presentation back to OrganizerDashboard.
function SurveyForm({ onCancel, onPresentationCreated }) {

  // --------------------------------------------------
  // REACT STATE
  // --------------------------------------------------

  // Stores the presentation title entered by the organizer.
  //
  // Starts as an empty string because the input
  // should be blank when the form first opens.
  const [title, setTitle] = useState("");

  // --------------------------------------------------
  // CREATE A NEW PRESENTATION
  // --------------------------------------------------

  // This function runs when the organizer submits the form.
  //
  // async allows us to use await when communicating
  // with Supabase.
  async function handleSubmit(event) {

    // Prevent the browser from refreshing the page
    // when the form is submitted.
    event.preventDefault();

    // --------------------------------------------------
    // VALIDATE THE PRESENTATION TITLE
    // --------------------------------------------------

    // trim() removes extra whitespace from the
    // beginning and end of the title.
    //
    // This prevents organizers from submitting
    // an empty title or a title containing only spaces.
    if (title.trim() === "") {
      alert("Please enter a presentation title.");
      return;
    }

    // --------------------------------------------------
    // VERIFY THE ORGANIZER IS SIGNED IN
    // --------------------------------------------------

    // Get the currently authenticated user from Supabase.
    //
    // getUser() retrieves the user's information,
    // including their unique user ID.
    const { data, error } = await supabase.auth.getUser();

    // If Supabase returns an error or no user exists,
    // stop the process and ask the organizer to sign in.
    if (error || !data.user) {
      alert("Please sign in before creating a presentation.");
      return;
    }

    // Log information to the browser console for debugging.
    console.log("Organizer ID:", data.user.id);
    console.log("Presentation title:", title);

    // --------------------------------------------------
    // SAVE THE PRESENTATION TO SUPABASE
    // --------------------------------------------------

    // Insert a new record into the presentations table.
    const {
      data: newPresentation,
      error: saveError,
    } = await supabase
      .from("presentations")

      // Create a new presentation with:
      // title: The name entered by the organizer.
      // owner_id: The authenticated organizer's user ID.
      .insert({
        title: title.trim(),
        owner_id: data.user.id,
      })

      // Return the newly created presentation record.
      .select()

      // Expect a single presentation object.
      .single();

    // --------------------------------------------------
    // HANDLE DATABASE ERRORS
    // --------------------------------------------------

    // Check whether Supabase failed to save the presentation.
    if (saveError) {
      console.error(
        "Error creating presentation:",
        saveError
      );

      alert(
        "Unable to create presentation. Please try again."
      );

      return;
    }

    // --------------------------------------------------
    // HANDLE SUCCESSFUL PRESENTATION CREATION
    // --------------------------------------------------

    // Log the new presentation for debugging.
    console.log(
      "presentation created:",
      newPresentation
    );

    // Notify the organizer that the presentation was saved.
    alert("Presentation created sucessfully!");

    // Clear the title input after a successful save.
    setTitle("");

    // Call the function passed from OrganizerDashboard.
    //
    // This sends the newly created presentation
    // back to the parent component.
    //
    // OrganizerDashboard then adds it to the
    // presentations array and closes this form.
    onPresentationCreated(newPresentation);
  }

  // --------------------------------------------------
  // COMPONENT USER INTERFACE (JSX)
  // --------------------------------------------------

  return (
    <form
      className={styles.form}

      // Run handleSubmit when the form is submitted.
      onSubmit={handleSubmit}
    >

      {/* FORM HEADING */}
      <h3 className={styles.title}>
        Create New Presentation
      </h3>

      {/* PRESENTATION TITLE LABEL */}
      <label
        className={styles.label}
        htmlFor="presentationTitle"
      >
        Presentation Title
      </label>

      {/* PRESENTATION TITLE INPUT */}
      <input
        className={styles.input}
        type="text"
        id="presentationTitle"
        placeholder="Enter presentation title"

        // Controlled input:
        // The displayed value comes from React state.
        value={title}

        // Update the title state whenever the organizer types.
        //
        // event.target.value gets the current
        // text inside the input field.
        onChange={(event) =>
          setTitle(event.target.value)
        }
      />

      {/* FORM ACTION BUTTONS */}
      <div className={styles.actions}>

        {/* SAVE PRESENTATION BUTTON */}
        <button
          className={styles.saveButton}
          type="submit"
        >
          {/* Because this button has type="submit",
              clicking it triggers the form's
              onSubmit event and runs handleSubmit. */}
          Save Presentation
        </button>

        {/* CANCEL BUTTON */}
        <button
          className={styles.cancelButton}
          type="button"

          // Call the onCancel function from OrganizerDashboard.
          // This closes the form without saving.
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Export the component so OrganizerDashboard
// can import and use it.
export default SurveyForm;
