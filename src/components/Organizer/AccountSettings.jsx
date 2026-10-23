
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import styles from "./AccountSettings.module.css";

function AccountSettings() {
  const navigate = useNavigate();

  // Controls whether Account Settings is expanded or collapsed.
  const [isExpanded, setIsExpanded] = useState(false);

  // Stores the user's password and DELETE confirmation.
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  // Tracks deletion progress and error messages.
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Enables the delete button only when both fields are valid.
  const canDelete =
    confirmation === "DELETE" &&
    password.length > 0 &&
    !isDeleting;

  // Handles permanent account deletion.
  async function handleDeleteAccount(event) {
    event.preventDefault();

    if (!canDelete) return;

    // Ask for final confirmation before deleting.
    const confirmed = window.confirm(
      "Permanently delete your RoomPulse account and all associated presentations, questions, and votes? This cannot be undone."
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setErrorMessage("");

    try {
      // Call the secure Supabase Edge Function.
      const { data, error } =
        await supabase.functions.invoke("delete-account", {
          body: {
            confirmation,
            password,
          },
        });

      // Handle errors returned by the Edge Function.
      if (error) {
        let message = "Unable to delete your account.";

        if (error.context) {
          try {
            const details = await error.context.json();
            message = details.error || message;
          } catch {
            // Keep the default error message.
          }
        }

        throw new Error(message);
      }

      // Verify that the server confirmed deletion.
      if (
        data?.message !==
        "Your RoomPulse account has been deleted."
      ) {
        throw new Error(
          "Account deletion was not confirmed. Please check your account status."
        );
      }

      // Clear the form after successful deletion.
      setPassword("");
      setConfirmation("");

      // Clear the local authentication session.
      await supabase.auth.signOut({ scope: "local" });

      // Redirect to the login page.
      navigate("/login", { replace: true });
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className={styles.settings}>
      {/* Collapsible Account Settings button */}
      <button
        type="button"
        className={styles.settingsToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="account-settings-content"
        disabled={isDeleting}
      >
        <span>⚙️ Account Settings</span>
        <span aria-hidden="true">
          {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Only show the deletion form when expanded */}
      {isExpanded && (
        <div
          id="account-settings-content"
          className={styles.dangerZone}
        >
          <h3>Delete Account</h3>

          <p>
            Permanently delete your RoomPulse account,
            including your presentations, questions, choices,
            and votes. This action cannot be undone.
          </p>

          <p>
            You must end all live presentations before
            deleting your account.
          </p>

          <form onSubmit={handleDeleteAccount}>
            {/* Password verification */}
            <label htmlFor="deletePassword">
              Confirm your password
            </label>

            <input
              id="deletePassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              disabled={isDeleting}
              required
            />

            {/* DELETE confirmation */}
            <label htmlFor="deleteConfirmation">
              Type DELETE to confirm
            </label>

            <input
              id="deleteConfirmation"
              type="text"
              value={confirmation}
              onChange={(event) =>
                setConfirmation(event.target.value)
              }
              placeholder="DELETE"
              autoComplete="off"
              disabled={isDeleting}
              required
            />

            {/* Display any errors */}
            {errorMessage && (
              <p className={styles.error} role="alert">
                {errorMessage}
              </p>
            )}

            {/* Permanent deletion button */}
            <button
              type="submit"
              className={styles.deleteButton}
              disabled={!canDelete}
            >
              {isDeleting
                ? "Deleting Account..."
                : "Permanently Delete Account"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

export default AccountSettings;
