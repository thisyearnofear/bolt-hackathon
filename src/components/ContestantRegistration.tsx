import { useState } from "react";
import { StorachaNetlifyClient } from "../lib/storacha/StorachaNetlifyClient";
import "./ContestantRegistration.css";

interface RegistrationFormData {
  name: string;
  teamName: string;
  twitterHandle: string;
  projectDescription: string;
  track: string;
  members: number;
}

interface ContestantRegistrationProps {
  onRegistrationComplete?: (registrationData: RegistrationFormData) => void;
  onCancel?: () => void;
}

const TRACK_OPTIONS = [
  { value: "ai-ml", label: "AI/ML" },
  { value: "web3", label: "Web3" },
  { value: "gaming", label: "Gaming" },
  { value: "mobile", label: "Mobile" },
  { value: "social-impact", label: "Social Impact" },
];

export function ContestantRegistration({
  onRegistrationComplete,
  onCancel,
}: ContestantRegistrationProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: "",
    teamName: "",
    twitterHandle: "",
    projectDescription: "",
    track: TRACK_OPTIONS[0].value,
    members: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "members" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form inputs
      if (
        !formData.name ||
        !formData.teamName ||
        !formData.projectDescription
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.twitterHandle && !formData.twitterHandle.startsWith("@")) {
        setFormData((prev) => ({
          ...prev,
          twitterHandle: `@${prev.twitterHandle}`,
        }));
      }

      // Initialize Storacha client
      const storachaClient = new StorachaNetlifyClient();
      await storachaClient.initialize();

      // Upload registration data to Storacha
      const registrationData = {
        ...formData,
        timestamp: new Date().toISOString(),
        type: "contestant-registration",
      };

      // Convert to JSON and upload
      const jsonData = JSON.stringify(registrationData);
      const blob = new Blob([jsonData], { type: "application/json" });

      // Create and upload file
      const file = new File(
        [blob],
        `registration-${formData.teamName}-${Date.now()}.json`,
        {
          type: "application/json",
        }
      );

      // Upload using the StorachaNetlifyClient
      const cid = await storachaClient.uploadAgentData(
        `registration-${formData.teamName}`,
        "contestant",
        "contestant-registration",
        jsonData,
        [`Registration for team ${formData.teamName}`]
      );

      console.log("Registration data uploaded with CID:", cid);

      // Show success message
      setSuccessMessage(
        `Registration successful! Your team "${formData.teamName}" has been registered.`
      );

      // Call the completion callback if provided
      if (onRegistrationComplete) {
        onRegistrationComplete(formData);
      }

      // Reset form after successful submission
      setFormData({
        name: "",
        teamName: "",
        twitterHandle: "",
        projectDescription: "",
        track: TRACK_OPTIONS[0].value,
        members: 1,
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contestant-registration">
      <button onClick={onCancel} className="modal-close-x" aria-label="Close">
        &times;
      </button>

      <h2>Registration</h2>

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)}>Close</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="teamName">Team Name *</label>
          <input
            type="text"
            id="teamName"
            name="teamName"
            value={formData.teamName}
            onChange={handleChange}
            required
            placeholder="Enter your team name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="twitterHandle">Twitter/X Handle</label>
          <input
            type="text"
            id="twitterHandle"
            name="twitterHandle"
            value={formData.twitterHandle}
            onChange={handleChange}
            placeholder="@yourusername"
          />
        </div>

        <div className="form-group">
          <label htmlFor="track">Hackathon Track *</label>
          <select
            id="track"
            name="track"
            value={formData.track}
            onChange={handleChange}
            required
          >
            {TRACK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="members">Team Size</label>
          <input
            type="number"
            id="members"
            name="members"
            min="1"
            max="10"
            value={formData.members}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="projectDescription">Project Description *</label>
          <textarea
            id="projectDescription"
            name="projectDescription"
            value={formData.projectDescription}
            onChange={handleChange}
            required
            placeholder="Briefly describe your project idea"
            rows={4}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
    </div>
  );
}
