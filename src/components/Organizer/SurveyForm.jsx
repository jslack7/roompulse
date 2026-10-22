import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import styles from "./SurveyForm.module.css";
function SurveyForm({ onCancel, onPresentationCreated }) {
  const [title, setTitle] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (title.trim() === "") {
      alert("Please enter a presentation title.");
      return;
    }

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      alert("Please sign in before creating a presentation.");
      return;
    }

    console.log("Organizer ID:", data.user.id);
    console.log("Presentation title:", title);


    const { data: newPresentation, error: saveError } = await supabase
      .from("presentations")
      .insert({
        title: title.trim(),
        owner_id: data.user.id,
      })
      .select()
      .single();
    
    if (saveError) {
      console.error("Error creating presentation:", saveError);
      alert("Unable to create presentation. Please try again.");
      return;
    }

    console.log("presentation created:", newPresentation);
    alert("Presentation created sucessfully!");
    setTitle("");
    onPresentationCreated(newPresentation);

  }


  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Create New Presentation</h3>

      <label
        className={styles.label}
        htmlFor="presentationTitle"
      >
        Presentation Title
      </label>

      <input
        className={styles.input}
        type="text"
        id="presentationTitle"
        placeholder="Enter presentation title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          type="submit"
        >
          Save Presentation
        </button>

        <button
          className={styles.cancelButton}
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default SurveyForm;
