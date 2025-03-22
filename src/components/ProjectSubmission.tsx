import { useState } from "react";
import { StorachaNetlifyClient } from "../lib/storacha/StorachaNetlifyClient";
import "./ProjectSubmission.css";

interface ProjectSubmissionData {
  teamName: string;
  projectName: string;
  githubUrl: string;
  twitterUrl: string;
  projectDescription: string;
  track: string;
}

interface ProjectSubmissionProps {
  onSubmissionComplete?: (submissionData: ProjectSubmissionData) => void;
  onCancel?: () => void;
  prefilledTeamName?: string;
}

const TRACK_OPTIONS = [
  { value: "ai-ml", label: "AI/ML" },
  { value: "web3", label: "Web3" },
  { value: "gaming", label: "Gaming" },
  { value: "mobile", label: "Mobile" },
  { value: "social-impact", label: "Social Impact" },
];

export function ProjectSubmission({
  onSubmissionComplete,
  onCancel,
  prefilledTeamName = "",
}: ProjectSubmissionProps) {
  const [formData, setFormData] = useState<ProjectSubmissionData>({
    teamName: prefilledTeamName,
    projectName: "",
    githubUrl: "",
    twitterUrl: "",
    projectDescription: "",
    track: TRACK_OPTIONS[0].value,
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
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form inputs
      if (
        !formData.teamName ||
        !formData.projectName ||
        !formData.githubUrl ||
        !formData.projectDescription
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Validate GitHub URL format
      if (!formData.githubUrl.includes("github.com")) {
        throw new Error("Please enter a valid GitHub repository URL");
      }

      // Initialize Storacha client
      const storachaClient = new StorachaNetlifyClient();
      await storachaClient.initialize();

      // Upload submission data to Storacha
      const submissionData = {
        ...formData,
        timestamp: new Date().toISOString(),
        type: "project-submission",
      };

      // Convert to JSON and upload
      const jsonData = JSON.stringify(submissionData);

      // Upload using the StorachaNetlifyClient
      const cid = await storachaClient.uploadAgentData(
        `project-${formData.teamName}`,
        "contestant",
        "project-submission",
        jsonData,
        [
          `Project submission for "${formData.projectName}" by team ${formData.teamName}`,
        ]
      );

      console.log("Project submission data uploaded with CID:", cid);

      // Show success message
      setSuccessMessage(
        `Project "${formData.projectName}" has been successfully submitted!`
      );

      // Call the completion callback if provided
      if (onSubmissionComplete) {
        onSubmissionComplete(formData);
      }

      // Reset form after successful submission
      setFormData({
        teamName: "",
        projectName: "",
        githubUrl: "",
        twitterUrl: "",
        projectDescription: "",
        track: TRACK_OPTIONS[0].value,
      });
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "An error occurred during project submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="project-submission">
      <button onClick={onCancel} className="modal-close-x" aria-label="Close">
        &times;
      </button>

      <h2>Project Submission</h2>

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
          <label htmlFor="projectName">Project Name *</label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            required
            placeholder="Enter your project name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="githubUrl">GitHub Repository URL *</label>
          <input
            type="url"
            id="githubUrl"
            name="githubUrl"
            value={formData.githubUrl}
            onChange={handleChange}
            required
            placeholder="https://github.com/yourusername/your-repo"
          />
          <small>Please make sure your repository is public</small>
        </div>

        <div className="form-group">
          <label htmlFor="twitterUrl">Twitter/X Link to Demo Video</label>
          <input
            type="url"
            id="twitterUrl"
            name="twitterUrl"
            value={formData.twitterUrl}
            onChange={handleChange}
            placeholder="https://twitter.com/yourusername/status/1234567890"
          />
          <small>
            Link to a tweet with your project demo video (recommended but
            optional)
          </small>
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
          <label htmlFor="projectDescription">Project Description *</label>
          <textarea
            id="projectDescription"
            name="projectDescription"
            value={formData.projectDescription}
            onChange={handleChange}
            required
            placeholder="Describe your project, technologies used, and how it works"
            rows={6}
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
            {isSubmitting ? "Submitting..." : "Submit Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
