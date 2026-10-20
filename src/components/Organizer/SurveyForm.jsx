import { useState } from "react";
import { supabase } from "../../services/supabaseClient";

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
   <form onSubmit={handleSubmit}>
    <h3>Create New Presentation</h3>

    <label htmlFor="presentationTitle">
      Presentation Title
    </label>

    <input 
      type="text"
      id="presentationTitle"
      placeholder="Enter Presentation title"
      value={title}
      onChange={(event) => setTitle(event.target.value)}
    />

    <button type="submit">
      Save Presentation
    </button>

    <button type="button" onClick={onCancel}>
      Cancel
    </button>
   </form>
  );
}

export default SurveyForm;
