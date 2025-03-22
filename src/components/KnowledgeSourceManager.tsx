import { useState, useRef, useEffect } from "react";
import { StorachaNetlifyClient } from "../lib/storacha/StorachaNetlifyClient";
import { ContestantCategory } from "../lib/ContestantData";
import "./KnowledgeSourceManager.css";

interface KnowledgeSourceManagerProps {
  onClose: () => void;
}

interface KnowledgeSource {
  url: string;
  category: string;
  description: string;
  id: string;
  status: string;
}

// Categories for knowledge management
const KNOWLEDGE_CATEGORIES = [
  { label: "Prizes", value: "prize" as ContestantCategory },
  { label: "Sponsors", value: "sponsor" as ContestantCategory },
  { label: "Judges", value: "judge" as ContestantCategory },
  { label: "Contestants", value: "contestant" as ContestantCategory },
  { label: "General", value: "general" as "general" },
];

export function KnowledgeSourceManager({
  onClose,
}: KnowledgeSourceManagerProps) {
  const [knowledgeUrl, setKnowledgeUrl] = useState("");
  const [knowledgeCategory, setKnowledgeCategory] = useState<
    ContestantCategory | "general"
  >("general");
  const [knowledgeDescription, setKnowledgeDescription] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storachaClientRef = useRef<StorachaNetlifyClient | null>(null);

  // Initialize Storacha client and load existing sources
  useEffect(() => {
    const initClient = async () => {
      // Get spaceDid from localStorage, or use undefined to let the server decide in private mode
      const spaceDid = localStorage.getItem("storacha-space-did") || undefined;

      const client = new StorachaNetlifyClient(spaceDid);
      await client.initialize();
      storachaClientRef.current = client;
      loadKnowledgeSources();
    };

    initClient();
  }, []);

  // Load existing knowledge sources
  const loadKnowledgeSources = async () => {
    if (!storachaClientRef.current) return;

    setIsLoading(true);
    try {
      // Try to use the new list method first
      try {
        const result = await storachaClientRef.current.listKnowledgeSources();

        if (result.error) {
          console.warn("List operation returned error:", result.error);
        }

        if (result.note) {
          console.info("List operation note:", result.note);
        }

        // Process sources if available
        if (result.sources && result.sources.length > 0) {
          // Convert the sources to our format
          const sources = result.sources.map((source: any) => ({
            url: source.name || source.cid,
            category: source.category || "general",
            description:
              source.description ||
              `Content added on ${
                source.timestamp
                  ? new Date(source.timestamp).toLocaleDateString()
                  : new Date().toLocaleDateString()
              }`,
            id: source.cid || Date.now().toString(),
            status: "uploaded",
          }));

          setKnowledgeSources(sources);
          return;
        } else if (result.isMockData) {
          console.warn(
            "Using mock data or empty results due to listing limitations"
          );
        }
      } catch (listError) {
        console.warn(
          "List method failed, falling back to download:",
          listError
        );
      }

      // Fallback to the old method
      const result = await storachaClientRef.current.downloadAgentData(
        "knowledge-sources"
      );
      if (result && typeof result === "object" && "sources" in result) {
        setKnowledgeSources((result.sources as KnowledgeSource[]) || []);
      }
    } catch (error) {
      console.error("Failed to load knowledge sources:", error);
      setKnowledgeSources([]);
      setError(
        "Failed to load knowledge sources. Please check your Storacha configuration."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Save knowledge sources
  const saveKnowledgeSources = async () => {
    if (!storachaClientRef.current) return;

    setIsLoading(true);
    try {
      await storachaClientRef.current.uploadAgentData(
        "system",
        "contestant",
        "knowledge-sources.json",
        JSON.stringify({ sources: knowledgeSources }),
        ["Knowledge base sources updated"]
      );
      setSuccessMessage("Knowledge sources saved successfully");
    } catch (error) {
      console.error("Failed to save knowledge sources:", error);
      setError(
        "Failed to save knowledge sources. Please check your Storacha configuration."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new knowledge source
  const addKnowledgeSource = async () => {
    if (!knowledgeUrl.trim()) {
      setError("Please enter a URL or path");
      return;
    }

    // Clear any existing messages
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // Create the new source with initial pending status
      const newSource: KnowledgeSource = {
        url: knowledgeUrl,
        category: knowledgeCategory,
        description:
          knowledgeDescription || `Content for ${knowledgeCategory} category`,
        id: Date.now().toString(),
        status: "pending",
      };

      // Add to state immediately to show pending status in UI
      const updatedSources = [...knowledgeSources, newSource];
      setKnowledgeSources(updatedSources);

      // Save to Storacha
      await storachaClientRef.current.uploadAgentData(
        "system",
        "contestant",
        "knowledge-sources.json",
        JSON.stringify({ sources: updatedSources }),
        ["Knowledge base sources updated"]
      );

      // Update the status to uploaded after successful save
      const finalSources = updatedSources.map((source) =>
        source.id === newSource.id ? { ...source, status: "uploaded" } : source
      );
      setKnowledgeSources(finalSources);

      // Reset form
      setKnowledgeUrl("");
      setKnowledgeDescription("");
      setSuccessMessage("Knowledge source added successfully");
    } catch (error) {
      console.error("Failed to save knowledge sources:", error);

      // Remove the pending source if save failed
      setKnowledgeSources((prev) =>
        prev.filter((source) => source.url !== knowledgeUrl)
      );

      setError(
        "Failed to save knowledge source. Please check your Storacha connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a knowledge source
  const removeKnowledgeSource = async (id: string) => {
    setKnowledgeSources((prev) => prev.filter((source) => source.id !== id));
    await saveKnowledgeSources();
    setSuccessMessage("Knowledge source removed successfully");
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !storachaClientRef.current) return;

    setIsLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Read file content
        const reader = new FileReader();

        const fileContent = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });

        // Upload to Storacha
        const category: ContestantCategory =
          knowledgeCategory === "general"
            ? "contestant"
            : (knowledgeCategory as ContestantCategory);

        await storachaClientRef.current.uploadAgentData(
          "system",
          category,
          file.name,
          fileContent,
          [`File uploaded for ${knowledgeCategory}`]
        );

        // Add to sources list
        const newSource: KnowledgeSource = {
          url: `file:${file.name}`,
          category: knowledgeCategory,
          description: knowledgeDescription || `File: ${file.name}`,
          id: Date.now().toString() + i,
          status: "uploaded",
        };

        setKnowledgeSources((prev) => [...prev, newSource]);
      }

      await saveKnowledgeSources();
      setSuccessMessage("Files uploaded successfully");
    } catch (error) {
      console.error("Error uploading files:", error);
      setError("Error uploading files");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="knowledge-source-manager">
      <h2>Knowledge Source Manager</h2>
      <p className="manager-description">
        Add URLs or documents to the RAG knowledge base for agent learning. All
        data is stored on Storacha decentralized storage.
      </p>

      {storachaClientRef.current && (
        <div className="storage-status-panel">
          <div className="storage-status-header">
            <h3>Storacha Storage Status</h3>
            <div
              className={`connection-indicator ${
                storachaClientRef.current ? "connected" : "disconnected"
              }`}
            >
              {storachaClientRef.current
                ? "Connected to Storacha"
                : "Not connected"}
            </div>
          </div>
          <div className="storage-process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Add Knowledge Source</h4>
                <p>
                  Enter a URL or upload a document to the decentralized
                  knowledge base
                </p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Storage on Storacha</h4>
                <p>
                  Content is uploaded to Storacha and assigned a unique Content
                  ID (CID)
                </p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>AI Agent Access</h4>
                <p>
                  AI agents can now access this knowledge to better assist
                  hackathon participants
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)}>Dismiss</button>
        </div>
      )}

      <div className="knowledge-form">
        <div className="form-group">
          <label htmlFor="knowledge-url">URL or Document Path</label>
          <input
            type="text"
            id="knowledge-url"
            value={knowledgeUrl}
            onChange={(e) => setKnowledgeUrl(e.target.value)}
            placeholder="https://example.com/docs"
          />
          <div className="input-help">
            Enter a public URL to documentation, API reference, or other
            relevant content
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="knowledge-category">Category</label>
          <select
            id="knowledge-category"
            value={knowledgeCategory}
            onChange={(e) =>
              setKnowledgeCategory(
                e.target.value as ContestantCategory | "general"
              )
            }
          >
            {KNOWLEDGE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="input-help">
            Select the category to make this content available to the
            appropriate AI agents
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="knowledge-description">Description</label>
          <input
            type="text"
            id="knowledge-description"
            value={knowledgeDescription}
            onChange={(e) => setKnowledgeDescription(e.target.value)}
            placeholder="Content about hackathon prizes"
          />
          <div className="input-help">
            Describe the content to help identify its purpose (optional)
          </div>
        </div>

        <div className="form-actions">
          <button
            className="add-button"
            onClick={addKnowledgeSource}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner">
                <span className="spinner-icon"></span>
                Saving to Storacha...
              </span>
            ) : (
              "Add URL"
            )}
          </button>

          <div className="file-upload">
            <label
              htmlFor="file-input"
              className={`file-label ${isLoading ? "disabled" : ""}`}
            >
              {isLoading ? "Uploading..." : "Upload Files"}
            </label>
            <input
              type="file"
              id="file-input"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              disabled={isLoading}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>

      <div className="knowledge-list">
        <h3>Knowledge Sources</h3>
        <div className="knowledge-status-legend">
          <div className="status-item">
            <span className="status-marker pending"></span>
            <span className="status-label">
              Pending: Being saved to Storacha
            </span>
          </div>
          <div className="status-item">
            <span className="status-marker uploaded"></span>
            <span className="status-label">
              Uploaded: Stored on decentralized network
            </span>
          </div>
          <div className="status-item">
            <span className="status-marker error"></span>
            <span className="status-label">
              Error: Failed to save to Storacha
            </span>
          </div>
        </div>

        {isLoading && knowledgeSources.length === 0 ? (
          <div className="loading">Loading sources from Storacha...</div>
        ) : knowledgeSources.length === 0 ? (
          <div className="empty-state">No knowledge sources added yet</div>
        ) : (
          <table className="sources-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {knowledgeSources.map((source) => (
                <tr key={source.id}>
                  <td className="source-url">{source.url}</td>
                  <td>{source.category}</td>
                  <td>{source.description}</td>
                  <td>
                    <span className={`status-${source.status}`}>
                      {source.status === "pending"
                        ? "Saving to Storacha..."
                        : source.status === "uploaded"
                        ? "Stored on Storacha"
                        : "Error saving"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="remove-button"
                      onClick={() => removeKnowledgeSource(source.id)}
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="storacha-explainer">
        <h3>About Decentralized Knowledge Storage</h3>
        <p>
          All knowledge sources are stored on Storacha, a decentralized storage
          network built on IPFS. This ensures your data is persistent,
          accessible, and not dependent on a single point of failure. Each file
          receives a unique Content ID (CID) that can be used to retrieve it
          from any IPFS gateway.
        </p>
        <p>
          Content added here will be available to the AI agents to provide more
          accurate and helpful responses related to your hackathon.
        </p>
      </div>
    </div>
  );
}
