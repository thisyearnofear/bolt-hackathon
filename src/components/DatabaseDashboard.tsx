import React from "react";
import { StorachaSettings } from "./StorachaConfig";
import styles from "./DatabaseDashboard.module.css";

interface KnowledgeSource {
  url: string;
  category: string;
  description: string;
  id: string;
  status: string;
}

interface DatabaseDashboardProps {
  storachaSettings: StorachaSettings;
  onStorachaConfigOpen: () => void;
  onKnowledgeManagerOpen: () => void;
  onContestantManagerOpen: () => void;
  onSubmissionManagerOpen: () => void;
  onDiagnosticsOpen: () => void;
  storachaStats: {
    uploads: number;
    downloads: number;
  };
  knowledgeSources: KnowledgeSource[];
}

export function DatabaseDashboard({
  storachaSettings,
  onStorachaConfigOpen,
  onKnowledgeManagerOpen,
  onContestantManagerOpen,
  onSubmissionManagerOpen,
  onDiagnosticsOpen,
  storachaStats,
  knowledgeSources,
}: DatabaseDashboardProps) {
  const totalKnowledgeSources = knowledgeSources.length;
  const categoryCounts = knowledgeSources.reduce((acc, source) => {
    acc[source.category] = (acc[source.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2
            style={{ marginBottom: "6px", fontSize: "22px", color: "#1a1a1a" }}
          >
            Database Management
          </h2>
          <p style={{ color: "#4a4a4a", fontSize: "14px" }}>
            Manage your hackathon's data through Storacha's decentralized
            storage
          </p>
        </div>

        {/* System Tools */}
        <div style={{ display: "flex", gap: "8px" }}>
          <SystemButton
            icon="⚙️"
            label="Settings"
            onClick={onStorachaConfigOpen}
          />
          <SystemButton
            icon="🔍"
            label="Diagnostics"
            onClick={onDiagnosticsOpen}
          />
        </div>
      </div>

      {/* Stats Overview - More Compact */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatCard
          title="Storage Activity"
          value={`${storachaStats.uploads + storachaStats.downloads}`}
          subtitle={`${storachaStats.uploads} uploads • ${storachaStats.downloads} downloads`}
          icon="📊"
        />
        <StatCard
          title="Knowledge Sources"
          value={totalKnowledgeSources.toString()}
          subtitle="Total indexed sources"
          icon="📚"
        />
        <StatCard
          title="Storage Status"
          value={storachaSettings.isConnected ? "Connected" : "Disconnected"}
          subtitle={
            storachaSettings.mode === "private" ? "Private Mode" : "Public Mode"
          }
          icon="🔌"
          status={storachaSettings.isConnected ? "success" : "error"}
        />
      </div>

      {/* Main Actions Grid - More Compact */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        <ActionCard
          title="Knowledge Base"
          description="Manage AI knowledge sources"
          icon="🧠"
          onClick={onKnowledgeManagerOpen}
          stats={[
            { label: "Sources", value: totalKnowledgeSources },
            { label: "Categories", value: Object.keys(categoryCounts).length },
          ]}
        />

        <ActionCard
          title="Contestant Data"
          description="Manage teams and participants"
          icon="👥"
          onClick={onContestantManagerOpen}
          stats={[
            { label: "Teams", value: categoryCounts["contestant"] || 0 },
            { label: "Active", value: storachaStats.uploads },
          ]}
        />

        <ActionCard
          title="Submissions"
          description="Track project submissions"
          icon="📝"
          onClick={onSubmissionManagerOpen}
          stats={[
            { label: "Total", value: storachaStats.uploads },
            { label: "Processed", value: storachaStats.downloads },
          ]}
        />
      </div>
    </div>
  );
}

// Update StatCard for better contrast and more compact design
function StatCard({
  title,
  value,
  subtitle,
  icon,
  status,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  status?: "success" | "error";
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "6px",
        padding: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div style={{ fontSize: "22px" }}>{icon}</div>
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#4a4a4a",
            fontWeight: "500",
          }}
        >
          {title}
        </h3>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color:
              status === "success"
                ? "#2e7d32"
                : status === "error"
                ? "#c62828"
                : "#2c3e50",
            marginTop: "2px",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: "12px", color: "#4a4a4a", marginTop: "2px" }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

// Update ActionCard for better contrast and more compact design
function ActionCard({
  title,
  description,
  icon,
  onClick,
  stats,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  stats: Array<{ label: string; value: number }>;
}) {
  return (
    <div
      onClick={onClick}
      className={styles.actionCard}
      style={{
        backgroundColor: "white",
        borderRadius: "6px",
        padding: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <div style={{ fontSize: "18px" }}>{icon}</div>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              color: "#2c3e50",
              fontWeight: "600",
            }}
          >
            {title}
          </h3>
          <p
            style={{ margin: "3px 0 0 0", color: "#4a4a4a", fontSize: "13px" }}
          >
            {description}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "14px",
          borderTop: "1px solid #eee",
          paddingTop: "10px",
        }}
      >
        {stats.map((stat, index) => (
          <div key={index}>
            <div
              style={{ fontSize: "16px", fontWeight: "600", color: "#2c3e50" }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "12px", color: "#4a4a4a" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Update SystemButton for better contrast
function SystemButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={styles.systemButton}
      style={{
        padding: "8px 14px",
        fontSize: "13px",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
