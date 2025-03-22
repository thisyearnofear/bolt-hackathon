import React, { useState } from "react";
import "./SubmissionManager.css";

interface Submission {
  id: string;
  projectName: string;
  team: string;
  track: string;
  submissionDate: string;
  githubUrl: string;
  demoUrl: string;
  status: "pending" | "approved" | "rejected";
  score: number | null;
}

interface SubmissionManagerProps {
  onClose: () => void;
}

const SAMPLE_SUBMISSIONS: Submission[] = [
  {
    id: "1",
    projectName: "AI Code Assistant",
    team: "Team Alpha",
    track: "AI/ML",
    submissionDate: "2024-03-20",
    githubUrl: "https://github.com/team-alpha/ai-assistant",
    demoUrl: "https://ai-assistant-demo.vercel.app",
    status: "approved",
    score: 85,
  },
  {
    id: "2",
    projectName: "DeFi Exchange",
    team: "Team Beta",
    track: "Web3",
    submissionDate: "2024-03-21",
    githubUrl: "https://github.com/team-beta/defi-exchange",
    demoUrl: "https://defi-exchange-demo.vercel.app",
    status: "pending",
    score: null,
  },
  {
    id: "3",
    projectName: "NFT Marketplace",
    team: "Team Gamma",
    track: "Blockchain",
    submissionDate: "2024-03-22",
    githubUrl: "https://github.com/team-gamma/nft-market",
    demoUrl: "https://nft-market-demo.vercel.app",
    status: "rejected",
    score: 45,
  },
];

export const SubmissionManager: React.FC<SubmissionManagerProps> = ({
  onClose,
}) => {
  const [submissions, setSubmissions] =
    useState<Submission[]>(SAMPLE_SUBMISSIONS);
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<keyof Submission>("submissionDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingSubmission, setEditingSubmission] = useState<string | null>(
    null
  );
  const [editScore, setEditScore] = useState<string>("");

  const handleStatusChange = (
    submissionId: string,
    newStatus: Submission["status"]
  ) => {
    setSubmissions((prevSubmissions) =>
      prevSubmissions.map((submission) =>
        submission.id === submissionId
          ? { ...submission, status: newStatus }
          : submission
      )
    );
  };

  const handleScoreSubmit = (submissionId: string) => {
    const score = parseInt(editScore);
    if (!isNaN(score) && score >= 0 && score <= 100) {
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((submission) =>
          submission.id === submissionId ? { ...submission, score } : submission
        )
      );
      setEditingSubmission(null);
      setEditScore("");
    }
  };

  const handleSort = (key: keyof Submission) => {
    if (sortBy === key) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const filteredSubmissions = submissions
    .filter(
      (submission) =>
        (selectedTrack === "all" || submission.track === selectedTrack) &&
        (searchQuery === "" ||
          submission.projectName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          submission.team.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const order = sortOrder === "asc" ? 1 : -1;
      return aValue < bValue ? -order : aValue > bValue ? order : 0;
    });

  const uniqueTracks = Array.from(new Set(submissions.map((s) => s.track)));

  return (
    <div className="submission-manager">
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="track-filter">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
          >
            <option value="all">All Tracks</option>
            {uniqueTracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="submissions-table">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort("projectName")}>
                Project{" "}
                {sortBy === "projectName" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("team")}>
                Team {sortBy === "team" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("track")}>
                Track {sortBy === "track" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("submissionDate")}>
                Submitted{" "}
                {sortBy === "submissionDate" &&
                  (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th>Links</th>
              <th onClick={() => handleSort("score")}>
                Score {sortBy === "score" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((submission) => (
              <tr key={submission.id}>
                <td>{submission.projectName}</td>
                <td>{submission.team}</td>
                <td>{submission.track}</td>
                <td>{submission.submissionDate}</td>
                <td>
                  <div className="submission-links">
                    <a
                      href={submission.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                    <a
                      href={submission.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Demo
                    </a>
                  </div>
                </td>
                <td>
                  {editingSubmission === submission.id ? (
                    <div className="score-editor">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleScoreSubmit(submission.id)
                        }
                      />
                      <button onClick={() => handleScoreSubmit(submission.id)}>
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingSubmission(null);
                          setEditScore("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      className="score-display"
                      onClick={() => {
                        setEditingSubmission(submission.id);
                        setEditScore(submission.score?.toString() || "");
                      }}
                    >
                      {submission.score !== null
                        ? `${submission.score}/100`
                        : "-"}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${submission.status}`}>
                    {submission.status.charAt(0).toUpperCase() +
                      submission.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {submission.status === "pending" && (
                      <>
                        <button
                          className="approve-button"
                          onClick={() =>
                            handleStatusChange(submission.id, "approved")
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="reject-button"
                          onClick={() =>
                            handleStatusChange(submission.id, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {submission.status === "approved" && (
                      <button
                        className="reject-button"
                        onClick={() =>
                          handleStatusChange(submission.id, "rejected")
                        }
                      >
                        Reject
                      </button>
                    )}
                    {submission.status === "rejected" && (
                      <button
                        className="approve-button"
                        onClick={() =>
                          handleStatusChange(submission.id, "approved")
                        }
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stats">
        <div className="stat-item">
          <span className="stat-label">Total Submissions</span>
          <span className="stat-value">{submissions.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Approved</span>
          <span className="stat-value">
            {submissions.filter((s) => s.status === "approved").length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value">
            {submissions.filter((s) => s.status === "pending").length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rejected</span>
          <span className="stat-value">
            {submissions.filter((s) => s.status === "rejected").length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Score</span>
          <span className="stat-value">
            {Math.round(
              submissions
                .filter((s) => s.score !== null)
                .reduce((acc, s) => acc + (s.score || 0), 0) /
                submissions.filter((s) => s.score !== null).length
            ) || "-"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SubmissionManager;
