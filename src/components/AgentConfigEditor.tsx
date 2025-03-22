import { useState, useEffect } from "react";
import { AIPersona, ContestantCategory, TRACKS } from "../lib/ContestantData";
import { StorachaNetlifyClient } from "../lib/storacha/StorachaNetlifyClient";
import "./AgentConfigEditor.css";

// Default agent configuration options
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_CONTEXT_WINDOW = 8;
const DEFAULT_RESPONSE_LENGTH = "medium";
const DEFAULT_FORMALITY = "neutral";

interface AgentConfigEditorProps {
  category: ContestantCategory;
  onConfigSaved: (config: AgentConfig) => void;
  onCancel: () => void;
}

export interface AgentConfig {
  persona: AIPersona;
  temperature: number;
  contextWindow: number;
  responseLength: string;
  formality: string;
  systemPrompt: string;
  category: ContestantCategory;
}

export function AgentConfigEditor({
  category,
  onConfigSaved,
  onCancel,
}: AgentConfigEditorProps) {
  const [persona, setPersona] = useState<AIPersona>({
    role: "",
    background: "",
    expertise: [""],
    greeting: "",
    contextPrompt: "",
  });
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [contextWindow, setContextWindow] = useState(DEFAULT_CONTEXT_WINDOW);
  const [responseLength, setResponseLength] = useState(DEFAULT_RESPONSE_LENGTH);
  const [formality, setFormality] = useState(DEFAULT_FORMALITY);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [isTestMode, setIsTestMode] = useState(false);
  const [storachaClient, setStorachaClient] =
    useState<StorachaNetlifyClient | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  // Category labels for UI display
  const categoryLabels: Record<ContestantCategory, string> = {
    prize: "Prize Track Agent",
    sponsor: "Sponsor Resources Agent",
    judge: "Judging Criteria Agent",
    contestant: "Team Collaboration Agent",
  };

  // Initialize Storacha client and load existing config if available
  useEffect(() => {
    const initClient = async () => {
      const client = new StorachaNetlifyClient();
      await client.initialize();
      setStorachaClient(client);

      // Try to load existing configuration
      try {
        const data = await client.downloadAgentData(`agent-config-${category}`);
        if (data && typeof data === "object") {
          // Check if the data has the expected structure for an AgentConfig
          const configData = data as any;
          if (configData.persona && configData.category) {
            // It appears to be an AgentConfig, so use it
            setPersona(configData.persona);
            setTemperature(configData.temperature || DEFAULT_TEMPERATURE);
            setContextWindow(
              configData.contextWindow || DEFAULT_CONTEXT_WINDOW
            );
            setResponseLength(
              configData.responseLength || DEFAULT_RESPONSE_LENGTH
            );
            setFormality(configData.formality || DEFAULT_FORMALITY);
            setSystemPrompt(configData.systemPrompt || "");
          } else {
            // Not a valid AgentConfig, use defaults
            setupDefaultConfig();
          }
        }
      } catch (error) {
        console.warn(`No existing config found for ${category}`, error);
        // Set sensible defaults based on category
        setupDefaultConfig();
      }
    };

    initClient();
  }, [category]);

  // Setup default configuration based on category
  const setupDefaultConfig = () => {
    // Set defaults based on category
    const defaultPersona: AIPersona = {
      role: categoryLabels[category],
      background: getDefaultBackground(category),
      expertise: getDefaultExpertise(category),
      greeting: getDefaultGreeting(category),
      contextPrompt: getDefaultContextPrompt(category),
    };

    setPersona(defaultPersona);
    setSystemPrompt(getDefaultSystemPrompt(category));
  };

  // Helper functions for default values
  const getDefaultBackground = (cat: ContestantCategory): string => {
    switch (cat) {
      case "prize":
        return "I help participants understand prize categories and submission requirements.";
      case "sponsor":
        return "I help teams leverage sponsor technologies and resources effectively.";
      case "judge":
        return "I help teams understand judging criteria and evaluation standards.";
      case "contestant":
        return "I help teams optimize their project development and collaboration.";
      default:
        return "I provide assistance and information to hackathon participants.";
    }
  };

  const getDefaultExpertise = (cat: ContestantCategory): string[] => {
    switch (cat) {
      case "prize":
        return [
          "Prize Categories",
          "Submission Guidelines",
          "Project Requirements",
        ];
      case "sponsor":
        return ["Technical Resources", "API Integration", "Platform Features"];
      case "judge":
        return [
          "Evaluation Criteria",
          "Project Feedback",
          "Innovation Assessment",
        ];
      case "contestant":
        return [
          "Project Planning",
          "Team Coordination",
          "Development Best Practices",
        ];
      default:
        return [
          "Hackathon Information",
          "Project Development",
          "Technical Support",
        ];
    }
  };

  const getDefaultGreeting = (cat: ContestantCategory): string => {
    switch (cat) {
      case "prize":
        return "Hi! I can help you understand our prize tracks and optimize your submission.";
      case "sponsor":
        return "Hello! I can help you access and implement sponsor technologies in your project.";
      case "judge":
        return "Welcome! I can help you understand how projects are evaluated and how to strengthen your submission.";
      case "contestant":
        return "Hi! I can help your team organize and optimize your development process.";
      default:
        return "Hello! I'm here to help with your hackathon project.";
    }
  };

  const getDefaultContextPrompt = (cat: ContestantCategory): string => {
    switch (cat) {
      case "prize":
        return "Focus on explaining prize requirements and helping participants align their ideas with prize criteria.";
      case "sponsor":
        return "Focus on explaining available sponsor resources and how to best utilize them in projects.";
      case "judge":
        return "Help participants understand judging criteria and compare their ideas against existing projects. Do NOT provide actual judging scores or decisions.";
      case "contestant":
        return "Focus on helping teams improve their project planning and execution.";
      default:
        return "Provide helpful information and guidance to hackathon participants.";
    }
  };

  const getDefaultSystemPrompt = (cat: ContestantCategory): string => {
    switch (cat) {
      case "prize":
        return `You are the Prize Track Agent for a hackathon. Your role is to help participants understand the various prize categories, submission requirements, and evaluation criteria. Be encouraging and enthusiastic about the possibilities, while being clear about the rules. Provide specific details about prize amounts, categories, and deadlines when asked. Do not make up information - if you don't know, say so.`;
      case "sponsor":
        return `You are the Sponsor Resources Agent for a hackathon. Your role is to help participants understand and utilize the technologies, APIs, and resources provided by the hackathon sponsors. Be technical and precise when explaining integration steps, but remain approachable. Focus on how teams can best leverage sponsor resources in their projects. Provide specific information about available credits, services, and support channels when asked. Do not make up information - if you don't know, say so.`;
      case "judge":
        return `You are the Judging Criteria Agent for a hackathon. Your role is to help participants understand how their projects will be evaluated. Be fair and balanced in your advice. Explain the evaluation rubric clearly and provide insights into what judges typically look for. Give constructive suggestions on how projects can be improved to score better, but do NOT provide any judging decisions or scores. Do not make up information - if you don't know, say so.`;
      case "contestant":
        return `You are the Team Collaboration Agent for a hackathon. Your role is to help teams work together effectively, plan their projects, and optimize their development process. Be supportive and practical in your advice. Suggest workflows, tools, and approaches that can help teams maximize their productivity during the limited hackathon timeframe. Focus on helping teams break down their ideas into manageable components. Do not make up information - if you don't know, say so.`;
      default:
        return `You are an AI assistant for a hackathon. Your role is to provide helpful information and guidance to participants. Be supportive, accurate, and concise in your responses. Do not make up information - if you don't know, say so.`;
    }
  };

  // Handle adding an expertise item
  const handleAddExpertise = () => {
    if (expertiseInput.trim()) {
      setPersona({
        ...persona,
        expertise: [...persona.expertise, expertiseInput.trim()],
      });
      setExpertiseInput("");
    }
  };

  // Handle removing an expertise item
  const handleRemoveExpertise = (index: number) => {
    setPersona({
      ...persona,
      expertise: persona.expertise.filter((_, i) => i !== index),
    });
  };

  // Handle saving the configuration
  const handleSave = async () => {
    setSaveStatus("saving");
    setIsLoading(true);

    // Create the config object
    const config: AgentConfig = {
      persona,
      temperature,
      contextWindow,
      responseLength,
      formality,
      systemPrompt,
      category,
    };

    try {
      if (storachaClient) {
        // Save to Storacha
        await storachaClient.uploadAgentData(
          "system",
          category,
          `agent-config-${category}`,
          JSON.stringify(config),
          ["Agent configuration updated"]
        );
        setSaveStatus("success");
        onConfigSaved(config);
      } else {
        throw new Error("Storacha client not initialized");
      }
    } catch (error) {
      console.error("Failed to save agent configuration:", error);
      setSaveStatus("error");
    } finally {
      setIsLoading(false);
      // Reset status after a delay
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="agent-config-editor">
      <h2>Configure {categoryLabels[category]}</h2>

      <div className="toggle-test-mode">
        <label>
          <input
            type="checkbox"
            checked={isTestMode}
            onChange={() => setIsTestMode(!isTestMode)}
          />
          Advanced Settings
        </label>
      </div>

      <div className="config-form">
        <div className="form-section personality-section">
          <h3>Agent Personality</h3>

          <div className="form-group">
            <label htmlFor="agent-role">Role</label>
            <input
              id="agent-role"
              type="text"
              value={persona.role}
              onChange={(e) => setPersona({ ...persona, role: e.target.value })}
              placeholder="e.g. Prize Track Guide"
            />
          </div>

          <div className="form-group">
            <label htmlFor="agent-background">Background</label>
            <textarea
              id="agent-background"
              value={persona.background}
              onChange={(e) =>
                setPersona({ ...persona, background: e.target.value })
              }
              placeholder="Describe the agent's background and purpose..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="agent-greeting">Greeting Message</label>
            <textarea
              id="agent-greeting"
              value={persona.greeting}
              onChange={(e) =>
                setPersona({ ...persona, greeting: e.target.value })
              }
              placeholder="Initial message the agent will send..."
              rows={2}
            />
          </div>

          <div className="form-group expertise-group">
            <label>Areas of Expertise</label>
            <div className="expertise-items">
              {persona.expertise.map((item, index) => (
                <div key={index} className="expertise-item">
                  <span>{item}</span>
                  {item && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExpertise(index)}
                      className="remove-expertise"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="add-expertise">
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                placeholder="Add area of expertise..."
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                disabled={!expertiseInput.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {isTestMode && (
          <div className="form-section advanced-section">
            <h3>Advanced Settings</h3>

            <div className="form-group">
              <label htmlFor="agent-temperature">
                Temperature:{" "}
                <span className="temp-value">{temperature.toFixed(1)}</span>
              </label>
              <div className="slider-container">
                <span className="slider-label">Precise</span>
                <input
                  id="agent-temperature"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
                <span className="slider-label">Creative</span>
              </div>
              <p className="setting-description">
                Controls how creative vs. predictable the agent's responses will
                be.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="context-window">Context Window</label>
              <select
                id="context-window"
                value={contextWindow}
                onChange={(e) => setContextWindow(parseInt(e.target.value))}
              >
                <option value="4">4 messages</option>
                <option value="8">8 messages</option>
                <option value="16">16 messages</option>
                <option value="32">32 messages</option>
              </select>
              <p className="setting-description">
                Number of previous messages the agent considers when responding.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="response-length">Response Length</label>
              <select
                id="response-length"
                value={responseLength}
                onChange={(e) => setResponseLength(e.target.value)}
              >
                <option value="concise">Concise</option>
                <option value="medium">Medium</option>
                <option value="detailed">Detailed</option>
              </select>
              <p className="setting-description">
                Preferred length of the agent's responses.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="formality">Tone</label>
              <select
                id="formality"
                value={formality}
                onChange={(e) => setFormality(e.target.value)}
              >
                <option value="casual">Casual & Friendly</option>
                <option value="neutral">Balanced & Helpful</option>
                <option value="formal">Professional & Technical</option>
              </select>
              <p className="setting-description">
                The overall tone and style of the agent's communication.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="system-prompt">System Prompt</label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Instructions that guide the agent's behavior..."
                rows={6}
              />
              <p className="setting-description">
                Core instructions that define how the agent behaves and
                responds.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="context-prompt">Context Prompt</label>
              <textarea
                id="context-prompt"
                value={persona.contextPrompt}
                onChange={(e) =>
                  setPersona({ ...persona, contextPrompt: e.target.value })
                }
                placeholder="Additional context for agent responses..."
                rows={3}
              />
              <p className="setting-description">
                Additional context that helps focus the agent's responses.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      {saveStatus === "success" && (
        <div className="save-status success">
          Configuration saved successfully!
        </div>
      )}

      {saveStatus === "error" && (
        <div className="save-status error">
          Error saving configuration. Please try again.
        </div>
      )}
    </div>
  );
}
