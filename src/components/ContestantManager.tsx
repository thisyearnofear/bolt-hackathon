import React, { useState, useEffect } from "react";
import "./ContestantManager.css";

interface Contestant {
  id: string;
  name: string;
  email: string;
  team: string;
  track: string;
  registrationDate: string;
  status: "pending" | "approved" | "rejected";
}

interface ContestantManagerProps {
  onClose: () => void;
}

const SAMPLE_CONTESTANTS: Contestant[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    team: "Team Alpha",
    track: "AI/ML",
    registrationDate: "2024-03-15",
    status: "approved",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    team: "Team Beta",
    track: "Web3",
    registrationDate: "2024-03-16",
    status: "pending",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    team: "Team Gamma",
    track: "Blockchain",
    registrationDate: "2024-03-17",
    status: "rejected",
  },
];

export const ContestantManager: React.FC<ContestantManagerProps> = ({
  onClose,
}) => {
  const [contestants, setContestants] =
    useState<Contestant[]>(SAMPLE_CONTESTANTS);
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<keyof Contestant>("registrationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleStatusChange = (
    contestantId: string,
    newStatus: Contestant["status"]
  ) => {
    setContestants((prevContestants) =>
      prevContestants.map((contestant) =>
        contestant.id === contestantId
          ? { ...contestant, status: newStatus }
          : contestant
      )
    );
  };

  const handleSort = (key: keyof Contestant) => {
    if (sortBy === key) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const filteredContestants = contestants
    .filter(
      (contestant) =>
        (selectedTrack === "all" || contestant.track === selectedTrack) &&
        (searchQuery === "" ||
          contestant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contestant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contestant.team.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const order = sortOrder === "asc" ? 1 : -1;
      return aValue < bValue ? -order : aValue > bValue ? order : 0;
    });

  const uniqueTracks = Array.from(new Set(contestants.map((c) => c.track)));

  return (
    <div className="contestant-manager">
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search contestants..."
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

      <div className="contestants-table">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort("name")}>
                Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("email")}>
                Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("team")}>
                Team {sortBy === "team" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("track")}>
                Track {sortBy === "track" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("registrationDate")}>
                Registration Date{" "}
                {sortBy === "registrationDate" &&
                  (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContestants.map((contestant) => (
              <tr key={contestant.id}>
                <td>{contestant.name}</td>
                <td>{contestant.email}</td>
                <td>{contestant.team}</td>
                <td>{contestant.track}</td>
                <td>{contestant.registrationDate}</td>
                <td>
                  <span className={`status-badge ${contestant.status}`}>
                    {contestant.status.charAt(0).toUpperCase() +
                      contestant.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {contestant.status === "pending" && (
                      <>
                        <button
                          className="approve-button"
                          onClick={() =>
                            handleStatusChange(contestant.id, "approved")
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="reject-button"
                          onClick={() =>
                            handleStatusChange(contestant.id, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {contestant.status === "approved" && (
                      <button
                        className="reject-button"
                        onClick={() =>
                          handleStatusChange(contestant.id, "rejected")
                        }
                      >
                        Reject
                      </button>
                    )}
                    {contestant.status === "rejected" && (
                      <button
                        className="approve-button"
                        onClick={() =>
                          handleStatusChange(contestant.id, "approved")
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
          <span className="stat-label">Total Contestants</span>
          <span className="stat-value">{contestants.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Approved</span>
          <span className="stat-value">
            {contestants.filter((c) => c.status === "approved").length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value">
            {contestants.filter((c) => c.status === "pending").length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rejected</span>
          <span className="stat-value">
            {contestants.filter((c) => c.status === "rejected").length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContestantManager;
