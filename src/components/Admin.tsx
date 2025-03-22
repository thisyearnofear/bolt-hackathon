import React, { useState, useEffect, useRef } from "react";
import { Demo } from "../Demo";
import { ContestantData, ContestantCategory } from "../lib/ContestantData";
import { StorachaNetlifyClient } from "../lib/storacha/StorachaNetlifyClient";
import { ContentManager } from "./ContentManager";
import { AgentConfigEditor, AgentConfig } from "./AgentConfigEditor";
import { KnowledgeSourceManager } from "./KnowledgeSourceManager";
import { ContestantManager } from "./ContestantManager";
import { SubmissionManager } from "./SubmissionManager";
import "./Admin.css";
import { StorachaConfig, StorachaSettings } from "./StorachaConfig";
import { DatabaseDashboard } from "./DatabaseDashboard";

// Navigation links for different contestant categories
const NAV_LINKS = [
  { label: "Prizes", category: "prize" },
  { label: "Sponsors", category: "sponsor" },
  { label: "Judges", category: "judge" },
  { label: "Teams", category: "contestant" },
];

// Categories for knowledge management
const KNOWLEDGE_CATEGORIES = [
  { label: "Prizes", value: "prize" as ContestantCategory },
  { label: "Sponsors", value: "sponsor" as ContestantCategory },
  { label: "Judges", value: "judge" as ContestantCategory },
  { label: "Contestants", value: "contestant" as ContestantCategory },
  { label: "General", value: "general" as "general" },
];

// Extend ContestantCategory to include "general" for knowledge management
type KnowledgeCategory = ContestantCategory | "general";

// Define a custom type for knowledge sources
interface KnowledgeSource {
  url: string;
  category: string;
  description: string;
  id: string;
  status: string;
}

// Define admin dashboard sections for better organization
const ADMIN_SECTIONS = [
  {
    id: "database",
    title: "Database Management",
    description: "Manage contestant data and knowledge sources in Storacha",
    icon: "📊",
  },
  {
    id: "content",
    title: "Content Management",
    description: "Add and manage prizes, sponsors, and judges information",
    icon: "🏆",
  },
  {
    id: "agents",
    title: "Agent Testing",
    description: "Test agent interactions and behaviors before launching",
    icon: "🤖",
  },
];

// Define information panels for Storacha education
const STORACHA_INFO = {
  intro: {
    title: "Storacha Integration",
    description:
      "This hackathon platform uses Storacha for decentralized storage, enabling AI agents to access and store data securely.",
    bullets: [
      "Decentralized storage for hackathon data",
      "Secure management of contestant information",
      "RAG knowledge base for AI agents",
      "Persistent storage for agent learning",
    ],
  },
  architecture: {
    title: "Storacha Architecture",
    description:
      "The platform integrates with Storacha through Netlify functions for security and ease of use.",
    flow: [
      "Frontend → Netlify Functions → Storacha Network",
      "Data is content-addressed with CIDs",
      "IPFS-compatible storage and retrieval",
      "Agent knowledge is organized by category",
    ],
  },
  usage: {
    title: "Managing Storacha Data",
    description:
      "Use these tools to manage your hackathon's decentralized data:",
    actions: [
      {
        name: "Knowledge Manager",
        description: "Add URLs and documents to the agent knowledge base",
      },
      {
        name: "Contestant Management",
        description: "Store and manage contestant information",
      },
      {
        name: "Agent Learning",
        description: "View and manage agent interactions and learning",
      },
    ],
  },
};

export function Admin() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [activeContestant, setActiveContestant] =
    useState<ContestantData | null>(null);
  const [agentPosition, setAgentPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // State for UI components
  const [showRegistration, setShowRegistration] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const [showKnowledgeManager, setShowKnowledgeManager] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true); // New tutorial visibility state
  const [activeSection, setActiveSection] = useState<
    "content" | "agent" | "database"
  >("content");
  const [registeredTeam, setRegisteredTeam] = useState<string | null>(null);
  const [netlifyServerStatus, setNetlifyServerStatus] = useState<
    "unknown" | "running" | "not-running"
  >("unknown");

  // State for knowledge base management
  const [knowledgeUrl, setKnowledgeUrl] = useState("");
  const [knowledgeCategory, setKnowledgeCategory] =
    useState<KnowledgeCategory>("general");
  const [knowledgeDescription, setKnowledgeDescription] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  // State for Storacha usage statistics
  const [storachaStats, setStorachaStats] = useState({
    uploads: 0,
    downloads: 0,
  });

  // New state for Storacha information panel
  const [showStorachaInfo, setShowStorachaInfo] = useState(false);
  const [storachaInfoType, setStorachaInfoType] = useState<
    "intro" | "architecture" | "usage"
  >("intro");

  // New state for tracking storage data
  const [storachaDetails, setStorachaDetails] = useState({
    spaceInfo: "Not connected",
    totalUploads: 0,
    totalDownloads: 0,
    categories: {
      prize: 0,
      sponsor: 0,
      judge: 0,
      contestant: 0,
      general: 0,
    },
  });

  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [activeAgentCategory, setActiveAgentCategory] =
    useState<ContestantCategory | null>(null);
  const [agentConfigs, setAgentConfigs] = useState<
    Record<ContestantCategory, AgentConfig | null>
  >({
    prize: null,
    sponsor: null,
    judge: null,
    contestant: null,
  });
  const [showContentManager, setShowContentManager] = useState(false);
  const [activeContentCategory, setActiveContentCategory] =
    useState<ContestantCategory | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoRef = useRef<Demo | null>(null);
  const storachaClientRef = useRef<StorachaNetlifyClient | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for contestant and submission manager modals
  const [showContestantManager, setShowContestantManager] = useState(false);
  const [showSubmissionManager, setShowSubmissionManager] = useState(false);

  // Add new state for save confirmation
  const [saveConfirmation, setSaveConfirmation] = useState<
    string | React.ReactNode | null
  >(null);

  // Add state for Storacha settings modal and configuration
  const [showStorachaConfig, setShowStorachaConfig] = useState(false);
  const [storachaSettings, setStorachaSettings] = useState<StorachaSettings>({
    mode:
      (localStorage.getItem("storacha-mode") as "public" | "private") ||
      "private", // Default to private mode
    spaceDid: localStorage.getItem("storacha-space-did") || null, // No hard-coded default DID - will use server's in private mode
    isConnected: false,
  });

  // Add state for diagnostics modal
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Add a contentRefreshTrigger state at the top component level
  const [contentRefreshTrigger, setContentRefreshTrigger] = useState<number>(
    Date.now()
  );

  // Debug mode flag - set to false to reduce console noise
  const DEBUG_MODE = false;

  // Helper function to conditionally log only in debug mode
  const debugLog = (message: string, ...args: any[]) => {
    if (DEBUG_MODE) {
      console.log(message, ...args);
    }
  };

  // Initialize the Demo and Storacha client when the component mounts
  useEffect(() => {
    // Create a minimal Demo instance for the Admin page
    if (canvasRef.current) {
      demoRef.current = new Demo(canvasRef.current, { lightweight: true });
      console.log(
        "Created minimal Demo instance in Admin component (without 3D scene)"
      );

      // Create a visually appealing placeholder instead of just text
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Make canvas responsive
        const resizeCanvas = () => {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
          renderAdminCanvas(ctx, canvas.width, canvas.height);
        };

        // Initial sizing
        resizeCanvas();

        // Handle resize
        window.addEventListener("resize", resizeCanvas);

        // Clean up event listener
        return () => {
          window.removeEventListener("resize", resizeCanvas);
          if (demoRef.current) {
            demoRef.current.dispose();
            demoRef.current = null;
            console.log("Fully disposed Demo instance in Admin component");
          }
        };
      }
    }

    // Initialize Storacha client
    if (!storachaClientRef.current) {
      // Initialize with space DID from settings
      storachaClientRef.current = new StorachaNetlifyClient(
        storachaSettings.spaceDid
      );
      storachaClientRef.current
        .initialize()
        .then(() => {
          console.log(
            "Storacha client initialized with settings:",
            storachaSettings
          );

          // Test connection and update connection status
          storachaClientRef.current
            ?.testConnection()
            .then((result) => {
              setStorachaSettings((prev) => ({
                ...prev,
                isConnected: result.success,
              }));

              // Load knowledge sources if connected
              if (result.success) {
                loadKnowledgeSources();
              }
            })
            .catch((err) => {
              console.error("Failed to test Storacha connection:", err);
            });
        })
        .catch((err) => {
          console.error("Failed to initialize Storacha client:", err);
        });
    }

    // Cleanup function if canvas wasn't initialized
    return () => {
      if (demoRef.current) {
        // Fully dispose the Demo instance
        demoRef.current.dispose();
        demoRef.current = null;
        console.log("Fully disposed Demo instance in Admin component");
      }
    };
  }, [storachaSettings.spaceDid]);

  // Function to render an appealing admin canvas
  const renderAdminCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Get theme colors from your app (modify as needed)
    const isDarkMode = document.body.classList.contains("dark-theme");
    const colors = {
      background: isDarkMode ? "#1a1a1a" : "#f0f0f0",
      primary: "#0066cc",
      secondary: "#4d94ff",
      text: isDarkMode ? "#ffffff" : "#333333",
      grid: isDarkMode ? "#333333" : "#dddddd",
    };

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Draw grid pattern
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    const gridSize = Math.min(width, height) / 20;

    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw admin panel with gradient
    const centerX = width / 2;
    const centerY = height / 2;
    const panelWidth = Math.min(width * 0.8, 400);
    const panelHeight = Math.min(height * 0.3, 150);
    const cornerRadius = 10;

    // Create gradient
    const gradient = ctx.createLinearGradient(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      centerX + panelWidth / 2,
      centerY + panelHeight / 2
    );
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(1, colors.secondary);

    // Draw rounded rectangle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(
      centerX - panelWidth / 2 + cornerRadius,
      centerY - panelHeight / 2
    );
    ctx.lineTo(
      centerX + panelWidth / 2 - cornerRadius,
      centerY - panelHeight / 2
    );
    ctx.quadraticCurveTo(
      centerX + panelWidth / 2,
      centerY - panelHeight / 2,
      centerX + panelWidth / 2,
      centerY - panelHeight / 2 + cornerRadius
    );
    ctx.lineTo(
      centerX + panelWidth / 2,
      centerY + panelHeight / 2 - cornerRadius
    );
    ctx.quadraticCurveTo(
      centerX + panelWidth / 2,
      centerY + panelHeight / 2,
      centerX + panelWidth / 2 - cornerRadius,
      centerY + panelHeight / 2
    );
    ctx.lineTo(
      centerX - panelWidth / 2 + cornerRadius,
      centerY + panelHeight / 2
    );
    ctx.quadraticCurveTo(
      centerX - panelWidth / 2,
      centerY + panelHeight / 2,
      centerX - panelWidth / 2,
      centerY + panelHeight / 2 - cornerRadius
    );
    ctx.lineTo(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2 + cornerRadius
    );
    ctx.quadraticCurveTo(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      centerX - panelWidth / 2 + cornerRadius,
      centerY - panelHeight / 2
    );
    ctx.closePath();
    ctx.fill();

    // Add text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Dashboard", centerX, centerY - 15);

    ctx.font = "14px Arial, sans-serif";
    ctx.fillText("hackers ASSEMBLE", centerX, centerY + 15);

    // Draw small hackathon icon
    const iconSize = Math.min(width, height) * 0.1;
    const iconX = centerX;
    const iconY = centerY - panelHeight / 2 - iconSize / 2;

    // Draw hackathon logo/icon (simplified)
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${iconSize / 2}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("H", iconX, iconY);
  };

  // Update CSS to make the canvas responsive
  useEffect(() => {
    if (canvasRef.current) {
      // Set responsive styling for the canvas
      canvasRef.current.style.width = "100%";
      canvasRef.current.style.height = "100%";
    }
  }, []);

  // Load knowledge sources from Storacha
  const loadKnowledgeSources = async () => {
    if (!storachaClientRef.current) return;

    setIsLoading(true);
    try {
      // Check if Netlify server is running
      try {
        // Use a simple fetch to check if the Netlify server is running
        const netlifyUrl =
          process.env.NODE_ENV === "development"
            ? "http://localhost:8888/.netlify/functions/storacha-client"
            : "/api/storacha-client";

        // Use POST with ping action instead of HEAD (which was failing)
        const response = await fetch(netlifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "ping",
            data: {
              spaceDid: storachaSettings.spaceDid,
            },
          }),
        });

        if (response.ok) {
          setNetlifyServerStatus("running");
        }
      } catch (error) {
        console.warn("Netlify server may not be running:", error);
        setNetlifyServerStatus("not-running");
        setIsLoading(false);
        return;
      }

      // Use the new list method to retrieve knowledge sources
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

      // Fallback to the old download method
      const result = await storachaClientRef.current.downloadAgentData(
        "knowledge-sources"
      );
      if (result && typeof result === "object" && "sources" in result) {
        setKnowledgeSources((result.sources as KnowledgeSource[]) || []);
      }
    } catch (error) {
      console.error("Failed to load knowledge sources:", error);
      // Initialize with empty array if there's an error
      setKnowledgeSources([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save knowledge sources to Storacha
  const saveKnowledgeSources = async () => {
    if (!storachaClientRef.current) return;

    setIsLoading(true);
    try {
      await storachaClientRef.current.uploadAgentData(
        "system",
        "contestant", // Use a valid ContestantCategory
        "knowledge-sources",
        JSON.stringify({ sources: knowledgeSources }),
        ["Knowledge base sources updated"]
      );
      console.log("Knowledge sources saved successfully");
    } catch (error) {
      console.error("Failed to save knowledge sources:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new knowledge source
  const addKnowledgeSource = async () => {
    if (!knowledgeUrl.trim()) {
      alert("Please enter a URL or path");
      return;
    }

    const newSource: KnowledgeSource = {
      url: knowledgeUrl,
      category: knowledgeCategory,
      description:
        knowledgeDescription || `Content for ${knowledgeCategory} category`,
      id: Date.now().toString(),
      status: "pending",
    };

    // Add to state
    const updatedSources = [...knowledgeSources, newSource];
    setKnowledgeSources(updatedSources);

    // Save to Storacha
    await saveKnowledgeSources();

    // Reset form
    setKnowledgeUrl("");
    setKnowledgeDescription("");
  };

  // Remove a knowledge source
  const removeKnowledgeSource = async (id: string) => {
    const updatedSources = knowledgeSources.filter(
      (source) => source.id !== id
    );
    setKnowledgeSources(updatedSources);
    await saveKnowledgeSources();
  };

  // Handle file upload for knowledge base
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

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
        if (storachaClientRef.current) {
          // Convert knowledge category to a valid ContestantCategory if needed
          const category: ContestantCategory =
            knowledgeCategory === "general" ? "contestant" : knowledgeCategory;

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
      }

      await saveKnowledgeSources();
      alert("Files uploaded successfully");
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Function to update Storacha connection status
  const updateStorachaConnection = async () => {
    if (storachaClientRef.current) {
      try {
        // Check Netlify server status first
        try {
          const netlifyUrl =
            process.env.NODE_ENV === "development"
              ? "http://localhost:8888/.netlify/functions/storacha-client"
              : "/api/storacha-client";

          // Use POST with ping action instead of HEAD
          const response = await fetch(netlifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "ping",
              data: {
                spaceDid: storachaSettings.spaceDid,
              },
            }),
          });

          // If we get any response at all, the server is running
          setNetlifyServerStatus("running");

          // Only proceed with connection test if Netlify is running
          // Test the connection
          const result = await storachaClientRef.current.testConnection();

          // Update connection status
          setStorachaSettings((prev) => ({
            ...prev,
            isConnected: result.success,
          }));
        } catch (error) {
          console.warn("Netlify server may not be running:", error);
          setNetlifyServerStatus("not-running");
        }
      } catch (error) {
        console.error("Failed to check Storacha connection:", error);
        setStorachaSettings((prev) => ({
          ...prev,
          isConnected: false,
        }));
      }
    }
  };

  // Update Storacha statistics and connection status periodically
  useEffect(() => {
    const TWO_MINUTES = 2 * 60 * 1000; // 2 minutes in milliseconds

    // Initial update
    if (storachaClientRef.current) {
      const stats = storachaClientRef.current.getUsageStats();
      setStorachaStats(stats);
      updateStorachaStats();
      updateStorachaConnection();
    }

    // Set up periodic updates
    const statsInterval = setInterval(() => {
      if (storachaClientRef.current) {
        // Update both stats and connection status in one go
        const stats = storachaClientRef.current.getUsageStats();
        setStorachaStats(stats);
        updateStorachaStats();
        updateStorachaConnection();
      }
    }, TWO_MINUTES);

    return () => clearInterval(statsInterval);
  }, [storachaSettings.spaceDid]);

  // Update the active category in the Demo when it changes
  useEffect(() => {
    if (demoRef.current && activeCategory) {
      // Check if activeCategory is a valid ContestantCategory
      const validCategory = [
        "prize",
        "sponsor",
        "judge",
        "contestant",
      ].includes(activeCategory);
      if (validCategory) {
        demoRef.current.setActiveCategory(activeCategory as ContestantCategory);
      }
    }
  }, [activeCategory]);

  // Handle category selection
  const handleCategoryClick = (category: string) => {
    if (activeCategory === category) {
      // If clicking the active category, deactivate it
      setActiveCategory(null);

      // Also close chat if open
      if (showChat) {
        setShowChat(false);
        setActiveContestant(null);
      }
    } else {
      // Activate the new category and close chat if open
      setActiveCategory(category);
      if (showChat) {
        setShowChat(false);
        setActiveContestant(null);
      }
    }
  };

  // Simulate a contestant click to test the chat interface
  const handleTestChat = () => {
    // Create a mock contestant for testing
    const mockContestant: ContestantData = {
      id: 999,
      name: "Test Contestant",
      teamName: "Test Team",
      project: "Test Project",
      description: "This is a test contestant for chat testing",
      track: "AI/ML",
      members: 3,
      progress: 0.75,
      colorIndex: 0,
      category: "contestant",
      aiPersona: {
        role: "Team Collaboration Guide",
        background:
          "I help teams optimize their project development and collaboration.",
        expertise: [
          "Project Planning",
          "Team Coordination",
          "Development Best Practices",
        ],
        greeting:
          "Hi! I can help your team organize and optimize your development process.",
        contextPrompt:
          "Focus on helping teams improve their project planning and execution.",
      },
      chatHistory: [],
    };

    // Set the mock contestant as active
    setActiveContestant(mockContestant);
    setShowChat(true);

    // Position the chat in the center of the screen with slight offset for visibility
    const centerX = window.innerWidth / 2 - 150; // Offset for better visibility
    const centerY = window.innerHeight / 2 - 100; // Offset for better visibility
    setAgentPosition({ x: centerX, y: centerY });
  };

  // Handle chat close action
  const handleChatClose = () => {
    setShowChat(false);
    setActiveContestant(null);
  };

  // Handle registration form toggle
  const handleToggleRegistration = () => {
    setShowRegistration(!showRegistration);
    setShowKnowledgeManager(false);
    setShowSubmission(false);
  };

  // Handle submission form toggle
  const handleToggleSubmission = () => {
    setShowSubmission(!showSubmission);
    setShowRegistration(false);
    setShowKnowledgeManager(false);
  };

  // Handle knowledge manager toggle
  const handleToggleKnowledgeManager = () => {
    setShowKnowledgeManager(!showKnowledgeManager);
    setShowRegistration(false);
    setShowSubmission(false);
  };

  // Handle registration complete
  const handleRegistrationComplete = (formData: any) => {
    setShowRegistration(false);
    setRegisteredTeam(formData.teamName);

    // Show a confirmation modal or message
    alert(`Registration successful! Welcome, Team ${formData.teamName}!`);
  };

  // Handle project submission complete
  const handleSubmissionComplete = (formData: any) => {
    setShowSubmission(false);

    // Show a confirmation modal or message
    alert(
      `Your project "${formData.projectName}" has been submitted successfully!`
    );
  };

  // Handle navigation back to main app
  const handleBackToApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (demoRef.current) {
      // Fully dispose the instance when navigating away
      demoRef.current.dispose();
      demoRef.current = null;
    }
  };

  // Check if tutorial should be shown on component mount
  useEffect(() => {
    const tutorialSeen = localStorage.getItem("adminTutorialSeen") === "true";
    setShowTutorial(!tutorialSeen);
  }, []);

  // New function to update Storacha statistics with more details
  const updateStorachaStats = () => {
    if (storachaClientRef.current) {
      const stats = storachaClientRef.current.getUsageStats();

      // In a real app, we would fetch these details from Storacha
      // For now, generate mock stats based on knowledge sources
      const categoryCounts = knowledgeSources.reduce(
        (counts, source) => {
          const category = source.category as keyof typeof counts;
          if (counts[category] !== undefined) {
            counts[category]++;
          }
          return counts;
        },
        {
          prize: 0,
          sponsor: 0,
          judge: 0,
          contestant: 0,
          general: 0,
        }
      );

      setStorachaStats(stats);
      setStorachaDetails({
        spaceInfo: "Connected to Storacha Space",
        totalUploads: stats.uploads,
        totalDownloads: stats.downloads,
        categories: categoryCounts,
      });
    }
  };

  // Update Storacha details when knowledge sources change
  useEffect(() => {
    updateStorachaStats();
  }, [knowledgeSources]);

  // Toggle Storacha information panel
  const handleToggleStorachaInfo = (
    type: "intro" | "architecture" | "usage"
  ) => {
    if (showStorachaInfo && storachaInfoType === type) {
      setShowStorachaInfo(false);
    } else {
      setShowStorachaInfo(true);
      setStorachaInfoType(type);
    }
  };

  // Handle opening the agent configuration editor
  const handleConfigureAgent = (category: ContestantCategory) => {
    setActiveAgentCategory(category);
    setShowAgentConfig(true);
    setShowChat(false);
  };

  // Handle saving agent configuration
  const handleAgentConfigSaved = (config: AgentConfig) => {
    setAgentConfigs((prev) => ({
      ...prev,
      [config.category]: config,
    }));
    setShowAgentConfig(false);

    // Show confirmation message
    const message = `${config.persona.role} configuration saved successfully!`;
    setSaveConfirmation(message);

    // Clear the confirmation after 5 seconds
    setTimeout(() => {
      setSaveConfirmation(null);
    }, 5000);
  };

  // Handle selecting a category card (in content section)
  const handleCategoryCardClick = (category: string) => {
    setActiveCategory(category);
  };

  // Add a new handler for agent chat
  const handleChatWithAgent = (category: ContestantCategory) => {
    setActiveCategory(category);
    handleTestChat();
  };

  // Create a ref to hold the forceUpdateMappings function from ContentDashboard
  const forceUpdateMappingsRef = useRef<(() => Promise<void>) | null>(null);

  // Function to call forceUpdateMappings if available
  const callForceUpdateMappings = async () => {
    if (forceUpdateMappingsRef.current) {
      await forceUpdateMappingsRef.current();
    } else {
      console.warn("forceUpdateMappings function not available");
      // Clear mappings cache as fallback
      StorachaNetlifyClient.clearContentMappingsCache();
    }
  };

  // Handle content manager save
  const handleContentSaved = async () => {
    // Hide the content manager modal
    setShowContentManager(false);

    // Clear all Storacha caches to ensure fresh data is loaded
    StorachaNetlifyClient.clearContentMappingsCache();

    // Clear any localStorage cached data
    if (typeof window !== "undefined" && window.localStorage) {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("content-") || key.includes("mapping"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }

    // Force update mappings from server to get latest content references
    await forceUpdateMappings();

    // Trigger content refresh with a more significant delay to allow server updates
    console.log(
      `Content saved for category: ${activeContentCategory}. Triggering refresh at ${Date.now()}`
    );

    // Force a state update to trigger child component refresh
    setTimeout(() => {
      setContentRefreshTrigger(Date.now());
    }, 1000); // Add delay to ensure server has time to update

    // Show a success message
    const message = `${activeContentCategory} content has been saved successfully!`;
    setSaveConfirmation(message);

    // Clear the confirmation after 5 seconds
    setTimeout(() => {
      setSaveConfirmation(null);
    }, 5000);
  };

  // Handler for Storacha settings save
  const handleStorachaConfigSaved = (newSettings: StorachaSettings) => {
    setStorachaSettings(newSettings);

    // Reinitialize client if space DID changed
    if (
      newSettings.spaceDid !== storachaSettings.spaceDid &&
      storachaClientRef.current
    ) {
      storachaClientRef.current = new StorachaNetlifyClient(
        newSettings.spaceDid
      );
      storachaClientRef.current
        .initialize()
        .then(() => {
          console.log("Storacha client reinitialized with new settings");
          loadKnowledgeSources();
        })
        .catch((err) => {
          console.error("Failed to reinitialize Storacha client:", err);
        });
    }
  };

  // Check if we have real data vs demo data
  const hasRealData = (category: string): boolean => {
    // Check if we have actual content stored for this category based on connection status
    if (!storachaSettings.isConnected) {
      return false;
    }

    switch (category) {
      case "storage":
        return storachaSettings.isConnected && storachaStats.uploads > 0;
      case "contestants":
        // This would check if we have contestant data in Storacha
        return knowledgeSources.some(
          (source) => source.category === "contestant"
        );
      case "submissions":
        // This would check if we have submission data in Storacha
        return knowledgeSources.some(
          (source) =>
            source.url.includes("submission") ||
            source.description.includes("submission")
        );
      case "knowledge":
        return knowledgeSources.length > 0;
      default:
        return false;
    }
  };

  // Function to forcefully update content mappings from the server
  const forceUpdateMappings = async () => {
    // Force reload mappings from server
    try {
      StorachaNetlifyClient.clearContentMappingsCache();

      // Fetch with unique timestamp to bust cache
      const timestamp = Date.now();
      const netlifyUrl =
        process.env.NODE_ENV === "development"
          ? `http://localhost:8888/.netlify/functions/storacha-client?t=${timestamp}`
          : `/api/storacha-client?t=${timestamp}`;

      // Send explicit request to reload mappings
      const response = await fetch(netlifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get-mappings",
          data: {
            forceRefresh: true,
            timestamp: timestamp,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.mappings) {
          console.log(
            "Received updated mappings from server:",
            result.mappings
          );

          // Force these mappings into localStorage
          localStorage.setItem(
            "content-mappings",
            JSON.stringify(result.mappings)
          );

          // Wait a moment for things to update
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error("Error forcing mappings update:", error);
    }
  };

  // Replace rendering function with a proper component for better state handling
  function ContentDashboard({ refreshTrigger }: { refreshTrigger: number }) {
    const [realPrizes, setRealPrizes] = useState<any[]>([]);
    const [prizesLoaded, setPrizesLoaded] = useState(false);

    // Add new state for other content types
    const [sponsors, setSponsors] = useState<any[]>([]);
    const [sponsorsLoaded, setSponsorsLoaded] = useState(false);

    const [judges, setJudges] = useState<any[]>([]);
    const [judgesLoaded, setJudgesLoaded] = useState(false);

    const [contestants, setContestants] = useState<any[]>([]);
    const [contestantsLoaded, setContestantsLoaded] = useState(false);

    const [loading, setLoading] = useState(false);

    // Use ref to track if data has been loaded to prevent multiple loads
    const dataLoadedRef = useRef({
      prize: false,
      sponsor: false,
      judge: false,
      contestant: false,
    });

    // Generic function to load content for any category
    const loadCategoryContent = async (
      category: ContestantCategory,
      forceRefresh = false
    ) => {
      // Skip if already loaded and not forcing refresh
      if (!forceRefresh && dataLoadedRef.current[category]) {
        return;
      }

      if (!storachaClientRef.current) return;

      try {
        const contentId = `content-${category}`;

        // Clear mappings cache if forced refresh
        if (forceRefresh) {
          StorachaNetlifyClient.clearContentMappingsCache();

          // Add a server-side refresh request to update content mappings
          try {
            const netlifyUrl =
              process.env.NODE_ENV === "development"
                ? "http://localhost:8888/.netlify/functions/storacha-client"
                : "/api/storacha-client";

            // Send refresh request to server
            console.log(
              `Requesting content mapping refresh from server for ${category}`
            );
            await fetch(netlifyUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "refresh-mappings",
                data: {
                  category: category,
                },
              }),
            });

            // Add a small delay to allow server to process
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            console.warn("Failed to request server mapping refresh:", error);
          }
        }

        // Get the CID from mapping - with timestamp to bust cache
        const timestamp = Date.now();
        const mapping = await storachaClientRef.current.getContentMapping(
          `nocache=${timestamp}`
        );
        const cid = mapping[contentId];

        console.log(
          `[DEBUG ${new Date().toISOString()}] Content mapping for ${contentId}: ${cid}`
        );

        // If no CID is found, try to fetch the mappings directly from the server
        if (!cid) {
          debugLog(
            `No CID mapping found for ${contentId}, trying to fetch mappings directly`
          );

          try {
            const netlifyUrl =
              process.env.NODE_ENV === "development"
                ? "http://localhost:8888/.netlify/functions/storacha-client"
                : "/api/storacha-client";

            const response = await fetch(netlifyUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "get-mappings",
                data: { forceRefresh: true },
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.mappings && result.mappings[contentId]) {
                const freshCid = result.mappings[contentId];
                console.log(`Found fresh CID for ${contentId}: ${freshCid}`);

                // Update local storage with the new mapping
                const mappings = { ...mapping, [contentId]: freshCid };
                localStorage.setItem(
                  "content-mappings",
                  JSON.stringify(mappings)
                );

                // Use this fresh CID
                const contentData =
                  await storachaClientRef.current.downloadAgentData(freshCid);

                // Process the data
                if (typeof contentData === "string") {
                  try {
                    const directParsed = JSON.parse(contentData);
                    processContentData(directParsed, category);
                    // Skip the rest of the function since we've processed the data
                    dataLoadedRef.current[category] = true;
                    return;
                  } catch (e) {
                    try {
                      const decodedContent = atob(contentData);
                      const parsedContent = JSON.parse(decodedContent);
                      processContentData(parsedContent, category);
                      // Skip the rest of the function since we've processed the data
                      dataLoadedRef.current[category] = true;
                      return;
                    } catch (decodeErr) {
                      console.error(
                        "Failed to decode or parse directly fetched content",
                        decodeErr
                      );
                    }
                  }
                } else if (typeof contentData === "object") {
                  processContentData(contentData, category);
                  // Skip the rest of the function since we've processed the data
                  dataLoadedRef.current[category] = true;
                  return;
                }
              }
            }
          } catch (error) {
            console.error("Error fetching mappings directly:", error);
          }

          return; // Use sample data if we couldn't find a CID
        }

        // Download the data
        const contentData = await storachaClientRef.current.downloadAgentData(
          cid
        );

        // Process string data (likely Base64 encoded)
        if (typeof contentData === "string") {
          try {
            // Try direct JSON parsing first
            const directParsed = JSON.parse(contentData);
            processContentData(directParsed, category);
          } catch (e) {
            // If that fails, try Base64 decoding
            try {
              const decodedContent = atob(contentData);
              const parsedContent = JSON.parse(decodedContent);
              processContentData(parsedContent, category);
            } catch (decodeErr) {
              console.error("Failed to decode or parse content", decodeErr);
            }
          }
        }
        // Process object data directly
        else if (typeof contentData === "object") {
          processContentData(contentData, category);
        }

        // Mark as loaded to avoid redundant loads
        dataLoadedRef.current[category] = true;
      } catch (error) {
        console.error(`Could not load ${category} data: ${error}`);
      }
    };

    // Define loadPrizeData as a specific case of loadCategoryContent
    const loadPrizeData = (forceRefresh = false) =>
      loadCategoryContent("prize", forceRefresh);

    // Helper function to process content data consistently for any category
    const processContentData = (data: any, category: ContestantCategory) => {
      let extractedItems: any[] = [];

      // Case 1: Direct items array
      if (data.items && Array.isArray(data.items)) {
        extractedItems = data.items;
      }
      // Case 2: The object itself is an array
      else if (Array.isArray(data)) {
        extractedItems = data;
      }
      // Case 3: Content property contains the array
      else if (data.content && Array.isArray(data.content)) {
        extractedItems = data.content;
      }
      // Case 4: No array found, but object exists - create single item array
      else if (typeof data === "object" && data !== null) {
        extractedItems = [data];
      }

      // Update state based on category
      if (extractedItems.length > 0) {
        switch (category) {
          case "prize":
            setRealPrizes(extractedItems);
            setPrizesLoaded(true);
            break;
          case "sponsor":
            setSponsors(extractedItems);
            setSponsorsLoaded(true);
            break;
          case "judge":
            setJudges(extractedItems);
            setJudgesLoaded(true);
            break;
          case "contestant":
            setContestants(extractedItems);
            setContestantsLoaded(true);
            break;
        }
      }
    };

    // Load all content categories when refreshTrigger changes
    useEffect(() => {
      const loadAllContent = async () => {
        setLoading(true);
        try {
          // Load each content type in parallel
          await Promise.all([
            loadCategoryContent("prize", true),
            loadCategoryContent("sponsor", true),
            loadCategoryContent("judge", true),
            loadCategoryContent("contestant", true),
          ]);
        } catch (error) {
          console.error("Error loading content:", error);
        } finally {
          setLoading(false);
        }
      };

      loadAllContent();

      // Reset the loaded flags when refreshTrigger changes to ensure we reload
      return () => {
        dataLoadedRef.current = {
          prize: false,
          sponsor: false,
          judge: false,
          contestant: false,
        };
      };
    }, [refreshTrigger]); // Only depend on refreshTrigger

    // Function to forcefully update content mappings from the server
    const forceUpdateMappings = async () => {
      // Force reload mappings from server
      try {
        StorachaNetlifyClient.clearContentMappingsCache();

        // Fetch with unique timestamp to bust cache
        const timestamp = Date.now();
        const netlifyUrl =
          process.env.NODE_ENV === "development"
            ? `http://localhost:8888/.netlify/functions/storacha-client?t=${timestamp}`
            : `/api/storacha-client?t=${timestamp}`;

        // Send explicit request to reload mappings
        const response = await fetch(netlifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "get-mappings",
            data: {
              forceRefresh: true,
              timestamp: timestamp,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result && result.mappings) {
            console.log(
              "Received updated mappings from server:",
              result.mappings
            );

            // Force these mappings into localStorage
            localStorage.setItem(
              "content-mappings",
              JSON.stringify(result.mappings)
            );

            // Wait a moment for things to update
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      } catch (error) {
        console.error("Error forcing mappings update:", error);
      }
    };

    // Enhanced manual refresh with forced mapping updates
    const handleManualRefresh = async () => {
      if (loading) return;

      setLoading(true);
      try {
        // Reset all loaded flags to force a refresh
        dataLoadedRef.current = {
          prize: false,
          sponsor: false,
          judge: false,
          contestant: false,
        };

        // Clear all Storacha caches
        StorachaNetlifyClient.clearContentMappingsCache();

        // Clear localStorage cached data
        if (typeof window !== "undefined" && window.localStorage) {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes("content-") || key.includes("mapping"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        }

        // Force update mappings from server
        await forceUpdateMappings();

        // Wait a moment for caches to clear
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Load all content types
        await Promise.all([
          loadCategoryContent("prize", true),
          loadCategoryContent("sponsor", true),
          loadCategoryContent("judge", true),
          loadCategoryContent("contestant", true),
        ]);
      } catch (error) {
        console.error(`Error in manual refresh: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    // Remove the reload controls and replace with a simple, clean refresh button
    const renderRefreshButton = () => (
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={handleManualRefresh}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: loading ? "#ccc" : "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {loading ? "Loading..." : "Refresh Content"}
          {!loading && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 0 0-5 5H1c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7-7-3.14-7-7h2a5 5 0 1 0 10 0 5 5 0 0 0-5-5z" />
            </svg>
          )}
        </button>
      </div>
    );

    // Sample prize data for the preview (fallback)
    const samplePrizes = [
      {
        id: 1,
        title: "Grand Prize",
        amount: "$5,000",
        description: "Best overall project with the most innovative solution",
        track: "AI/ML",
      },
      {
        id: 2,
        title: "Runner-Up",
        amount: "$3,000",
        description: "Second place project with technical excellence",
        track: "Web3",
      },
      {
        id: 3,
        title: "Community Choice",
        amount: "$2,000",
        description: "Project with the most community votes and engagement",
        track: "Social Impact",
      },
    ];

    // Function to open content manager directly for a category
    const openContentManager = (category: ContestantCategory) => {
      setActiveContentCategory(category);
      setShowContentManager(true);
    };

    // Simplified delete prize handler
    const handleDeletePrize = async (id: string) => {
      if (!storachaClientRef.current) return;

      const confirmMessage =
        "Are you sure you want to delete this prize? This will remove it from display only. Open the Content Manager to save changes permanently.";
      if (!window.confirm(confirmMessage)) return;

      try {
        setLoading(true);

        // Update UI immediately
        const updatedPrizes = realPrizes.filter((prize) => prize.id !== id);
        setRealPrizes(updatedPrizes);

        // Show a simple notification with action button
        setSaveConfirmation(
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Prize removed from display.</span>
            <button
              onClick={() => openContentManager("prize" as ContestantCategory)}
              style={{
                background: "#0066cc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        );

        // Clear notification after delay
        setTimeout(() => setSaveConfirmation(null), 10000);
      } catch (error) {
        console.error(`Error deleting prize: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    // Use real prizes if loaded, otherwise use sample
    const displayPrizes =
      prizesLoaded && realPrizes.length > 0
        ? realPrizes.map((prize) => {
            // REMOVE console.log to prevent console flooding
            // No logging here at all

            // Extract the most likely fields based on observed structure
            const id = prize.id || prize._id || `prize-${Math.random()}`;

            // For name field, check several possibilities
            const name =
              prize.name || prize.title || prize.prizeName || "Unnamed Prize";

            // For amount, check both direct property and details.amount
            const amount =
              prize.amount ||
              (prize.details && prize.details.amount) ||
              (prize.prize && prize.prize.amount) ||
              "$1,000";

            // For description, check multiple possible fields
            const description =
              prize.description ||
              prize.desc ||
              prize.summary ||
              (prize.details && prize.details.description) ||
              "Prize description";

            // For track, check multiple locations
            const track =
              prize.track ||
              (prize.details && prize.details.track) ||
              prize.category ||
              (prize.tags && prize.tags[0]) ||
              "General";

            return {
              id,
              title: name,
              amount,
              description,
              track,
            };
          })
        : samplePrizes;

    return (
      <div className="content-dashboard">
        <h2>Content Management</h2>

        <div className="content-categories">
          <p>
            Select a category to manage your hackathon content. All content is
            stored in Storacha and will be accessible to AI agents.
          </p>

          {renderRefreshButton()}

          <div
            className="dashboard-summary"
            style={{
              marginTop: "20px",
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 15px 0",
                fontSize: "18px",
                color: "#2c3e50",
              }}
            >
              Content Summary
            </h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
              {NAV_LINKS.map((link) => {
                // Determine if we have real data for this category based on our actual loaded state
                const hasRealData =
                  link.category === "prize"
                    ? prizesLoaded && realPrizes.length > 0
                    : link.category === "sponsor"
                    ? sponsorsLoaded && sponsors.length > 0
                    : link.category === "judge"
                    ? judgesLoaded && judges.length > 0
                    : link.category === "contestant"
                    ? contestantsLoaded && contestants.length > 0
                    : false;

                // Get content count for this category
                const contentCount =
                  link.category === "prize"
                    ? realPrizes.length
                    : link.category === "sponsor"
                    ? sponsors.length
                    : link.category === "judge"
                    ? judges.length
                    : link.category === "contestant"
                    ? contestants.length
                    : 0;

                return (
                  <div
                    key={link.category}
                    style={{
                      backgroundColor: "white",
                      borderRadius: "6px",
                      padding: "15px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      width: "calc(50% - 10px)",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      openContentManager(link.category as ContestantCategory)
                    }
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#f0f4f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        marginRight: "15px",
                      }}
                    >
                      {link.category === "prize" && "🏆"}
                      {link.category === "sponsor" && "🤝"}
                      {link.category === "judge" && "⚖️"}
                      {link.category === "contestant" && "👥"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", marginBottom: "3px" }}>
                        {link.label}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: hasRealData ? "#28a745" : "#6c757d",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {hasRealData ? (
                          <>
                            <span
                              style={{ color: "#28a745", marginRight: "5px" }}
                            >
                              ✓
                            </span>{" "}
                            Data loaded (
                            {link.category === "prize"
                              ? realPrizes.length
                              : link.category === "sponsor"
                              ? sponsors.length
                              : link.category === "judge"
                              ? judges.length
                              : link.category === "contestant"
                              ? contestants.length
                              : 0}
                            )
                          </>
                        ) : (
                          "No data loaded"
                        )}
                      </div>
                    </div>
                    <button
                      style={{
                        backgroundColor: "#0066cc",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openContentManager(link.category as ContestantCategory);
                      }}
                    >
                      Manage
                    </button>

                    <button
                      style={{
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        marginLeft: "5px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSaveConfirmation(
                          `Refreshing ${link.label} content...`
                        );

                        try {
                          // Force clear caches
                          StorachaNetlifyClient.clearContentMappingsCache();

                          // Force update mappings
                          await forceUpdateMappings();

                          // Set refresh trigger to reload content
                          setContentRefreshTrigger(Date.now());

                          setSaveConfirmation(
                            `${link.label} content refreshed!`
                          );
                          setTimeout(() => setSaveConfirmation(null), 3000);
                        } catch (error) {
                          console.error(
                            `Error refreshing ${link.category}:`,
                            error
                          );
                          setSaveConfirmation(
                            `Error refreshing ${link.label} content`
                          );
                          setTimeout(() => setSaveConfirmation(null), 3000);
                        }
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Display prizes - if available */}
          {prizesLoaded && realPrizes.length > 0 && (
            <div className="content-preview" style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Prize Tracks{" "}
                  <span style={{ color: "#28a745", fontSize: "14px" }}>
                    (Loaded)
                  </span>
                </h3>
                <button
                  onClick={() =>
                    openContentManager("prize" as ContestantCategory)
                  }
                  style={{
                    backgroundColor: "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Manage All Prizes
                </button>
              </div>

              <div className="prize-preview-cards">
                {displayPrizes.map((prize) => (
                  <div
                    key={prize.id}
                    className="prize-card"
                    style={{
                      position: "relative",
                      border: "1px solid #e9ecef",
                      borderRadius: "6px",
                      padding: "15px",
                      marginBottom: "10px",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      backgroundColor: "white",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "16px",
                        color: "#333",
                      }}
                    >
                      {prize.title}
                    </h4>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#0066cc",
                        fontSize: "18px",
                        marginBottom: "10px",
                      }}
                    >
                      {prize.amount}
                    </div>
                    <p
                      style={{
                        margin: "0 0 15px 0",
                        fontSize: "14px",
                        color: "#6c757d",
                      }}
                    >
                      {prize.description}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 8px",
                          backgroundColor: "#e9ecef",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {prize.track}
                      </span>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openContentManager("prize" as ContestantCategory);
                          }}
                          style={{
                            background: "none",
                            border: "1px solid #0066cc",
                            color: "#0066cc",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            fontSize: "13px",
                            cursor: "pointer",
                            marginRight: "8px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrize(prize.id);
                          }}
                          style={{
                            background: "none",
                            border: "1px solid #dc3545",
                            color: "#dc3545",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display sponsors - if available */}
          {sponsorsLoaded && sponsors.length > 0 && (
            <div className="content-preview" style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Sponsors{" "}
                  <span style={{ color: "#28a745", fontSize: "14px" }}>
                    (Loaded)
                  </span>
                </h3>
                <button
                  onClick={() =>
                    openContentManager("sponsor" as ContestantCategory)
                  }
                  style={{
                    backgroundColor: "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Manage All Sponsors
                </button>
              </div>

              <div className="sponsor-preview-cards">
                {sponsors.map((sponsor) => {
                  // Extract sponsor fields
                  const id =
                    sponsor.id || sponsor._id || `sponsor-${Math.random()}`;
                  const name =
                    sponsor.name ||
                    sponsor.title ||
                    sponsor.sponsorName ||
                    "Unnamed Sponsor";
                  const tier =
                    sponsor.tier ||
                    sponsor.level ||
                    (sponsor.details && sponsor.details.tier) ||
                    "General";
                  const description =
                    sponsor.description ||
                    sponsor.desc ||
                    (sponsor.details && sponsor.details.description) ||
                    "";
                  const website =
                    sponsor.website ||
                    (sponsor.details && sponsor.details.website) ||
                    "";

                  return (
                    <div
                      key={id}
                      className="sponsor-card"
                      style={{
                        position: "relative",
                        border: "1px solid #e9ecef",
                        borderRadius: "6px",
                        padding: "15px",
                        marginBottom: "10px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        backgroundColor: "white",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "16px",
                          color: "#333",
                        }}
                      >
                        {name}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 15px 0",
                          fontSize: "14px",
                          color: "#6c757d",
                        }}
                      >
                        {description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            padding: "3px 8px",
                            backgroundColor: "#e9ecef",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          {tier}
                        </span>
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openContentManager(
                                "sponsor" as ContestantCategory
                              );
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #0066cc",
                              color: "#0066cc",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              fontSize: "13px",
                              cursor: "pointer",
                              marginRight: "8px",
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Display judges - if available */}
          {judgesLoaded && judges.length > 0 && (
            <div className="content-preview" style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Judges{" "}
                  <span style={{ color: "#28a745", fontSize: "14px" }}>
                    (Loaded)
                  </span>
                </h3>
                <button
                  onClick={() =>
                    openContentManager("judge" as ContestantCategory)
                  }
                  style={{
                    backgroundColor: "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Manage All Judges
                </button>
              </div>

              <div className="judge-preview-cards">
                {judges.map((judge) => {
                  // Extract judge fields
                  const id = judge.id || judge._id || `judge-${Math.random()}`;
                  const name =
                    judge.name ||
                    judge.title ||
                    judge.judgeName ||
                    "Unnamed Judge";
                  const expertise =
                    judge.expertise ||
                    (judge.details && judge.details.expertise) ||
                    [];
                  const description =
                    judge.description ||
                    judge.desc ||
                    (judge.details && judge.details.description) ||
                    "";

                  return (
                    <div
                      key={id}
                      className="judge-card"
                      style={{
                        position: "relative",
                        border: "1px solid #e9ecef",
                        borderRadius: "6px",
                        padding: "15px",
                        marginBottom: "10px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        backgroundColor: "white",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "16px",
                          color: "#333",
                        }}
                      >
                        {name}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 15px 0",
                          fontSize: "14px",
                          color: "#6c757d",
                        }}
                      >
                        {description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            flexWrap: "wrap",
                          }}
                        >
                          {Array.isArray(expertise) ? (
                            expertise.map((exp, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: "3px 8px",
                                  backgroundColor: "#e9ecef",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  marginBottom: "5px",
                                }}
                              >
                                {exp}
                              </span>
                            ))
                          ) : (
                            <span
                              style={{
                                padding: "3px 8px",
                                backgroundColor: "#e9ecef",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              Expert
                            </span>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openContentManager("judge" as ContestantCategory);
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #0066cc",
                              color: "#0066cc",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              fontSize: "13px",
                              cursor: "pointer",
                              marginRight: "8px",
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Display contestants - if available */}
          {contestantsLoaded && contestants.length > 0 && (
            <div className="content-preview" style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Teams{" "}
                  <span style={{ color: "#28a745", fontSize: "14px" }}>
                    (Loaded)
                  </span>
                </h3>
                <button
                  onClick={() =>
                    openContentManager("contestant" as ContestantCategory)
                  }
                  style={{
                    backgroundColor: "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Manage All Teams
                </button>
              </div>

              <div className="contestant-preview-cards">
                {contestants.map((contestant) => {
                  // Extract contestant fields
                  const id =
                    contestant.id ||
                    contestant._id ||
                    `contestant-${Math.random()}`;
                  const name =
                    contestant.name ||
                    contestant.title ||
                    contestant.teamName ||
                    "Unnamed Team";
                  const project =
                    contestant.project ||
                    (contestant.details && contestant.details.project) ||
                    "Project";
                  const description =
                    contestant.description ||
                    contestant.desc ||
                    (contestant.details && contestant.details.description) ||
                    "";
                  const members =
                    contestant.members ||
                    (contestant.details && contestant.details.members) ||
                    1;

                  return (
                    <div
                      key={id}
                      className="contestant-card"
                      style={{
                        position: "relative",
                        border: "1px solid #e9ecef",
                        borderRadius: "6px",
                        padding: "15px",
                        marginBottom: "10px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        backgroundColor: "white",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "16px",
                          color: "#333",
                        }}
                      >
                        {name}
                      </h4>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "500",
                          color: "#6c757d",
                          marginBottom: "8px",
                        }}
                      >
                        {project}
                      </div>
                      <p
                        style={{
                          margin: "0 0 15px 0",
                          fontSize: "14px",
                          color: "#6c757d",
                        }}
                      >
                        {description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            padding: "3px 8px",
                            backgroundColor: "#e9ecef",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          {members} {members === 1 ? "Member" : "Members"}
                        </span>
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openContentManager(
                                "contestant" as ContestantCategory
                              );
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #0066cc",
                              color: "#0066cc",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              fontSize: "13px",
                              cursor: "pointer",
                              marginRight: "8px",
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhance the Content Management section render function
  const renderContentDashboard = () => {
    return <ContentDashboard refreshTrigger={contentRefreshTrigger} />;
  };

  // Enhance the Agent Testing section render function
  const renderAgentDashboard = () => {
    // Sample agent responses for the demo interface
    const sampleMessages = [
      {
        type: "agent",
        text: "Hello! I'm the Prize Track Agent. I can help you understand prize categories, submission requirements, and eligibility criteria.",
      },
      {
        type: "user",
        text: "What prize tracks are available in this hackathon?",
      },
      {
        type: "agent",
        text: "There are several prize tracks in this hackathon:\n\n1. Grand Prize ($5,000) - Best overall project\n2. AI/ML Track ($3,000) - Best use of artificial intelligence\n3. Web3 Track ($2,000) - Most innovative blockchain project\n4. Social Impact ($2,000) - Project with the greatest positive impact\n\nWhich track interests you the most?",
      },
    ];

    return (
      <div className="agent-dashboard">
        <h2>Agent Testing Environment</h2>

        <p className="agent-introduction-text">
          Test your AI agents. Select an agent type, configure its persona and
          knowledge, then interact with it to verify responses.
        </p>

        {!showAgentConfig && !showChat && (
          <div className="agent-interface-container dummy-content">
            <div className="agent-selector">
              <h3>Select Agent</h3>
              <div className="agent-selector-buttons">
                {NAV_LINKS.map((link) => (
                  <div key={link.category} className="agent-select-wrapper">
                    <button
                      className={`agent-select-button ${
                        activeCategory === link.category ? "active" : ""
                      }`}
                      onClick={() =>
                        setActiveCategory(link.category as ContestantCategory)
                      }
                    >
                      {link.category === "prize" && "🏆 "}
                      {link.category === "sponsor" && "🤝 "}
                      {link.category === "judge" && "⚖️ "}
                      {link.category === "contestant" && "👥 "}
                      {link.label} Agent
                    </button>
                    <div className="agent-button-actions">
                      <button
                        className="configure-button"
                        onClick={() =>
                          handleConfigureAgent(
                            link.category as ContestantCategory
                          )
                        }
                        title={`Configure ${link.label} Agent`}
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="agent-chat-interface">
              <div className="agent-chat-header">
                <div className="agent-avatar">
                  {activeCategory === "prize" && "🏆"}
                  {activeCategory === "sponsor" && "🤝"}
                  {activeCategory === "judge" && "⚖️"}
                  {activeCategory === "contestant" && "👥"}
                  {!activeCategory && "🤖"}
                </div>
                <div className="agent-info">
                  <h3>
                    {activeCategory
                      ? `${
                          activeCategory.charAt(0).toUpperCase() +
                          activeCategory.slice(1)
                        } Agent`
                      : "Prize Track Agent"}
                  </h3>
                  <p>
                    {activeCategory === "prize" &&
                      "Helps with prize categories and submission requirements"}
                    {activeCategory === "sponsor" &&
                      "Helps teams utilize sponsor technologies and resources"}
                    {activeCategory === "judge" &&
                      "Helps understand judging criteria and improve submissions"}
                    {activeCategory === "contestant" &&
                      "Helps teams collaborate effectively"}
                    {!activeCategory &&
                      "Helps with prize categories and submission requirements"}
                  </p>
                </div>
              </div>

              <div className="agent-chat-messages">
                {sampleMessages.map((message, index) => (
                  <div key={index} className={`message ${message.type}`}>
                    {message.text}
                  </div>
                ))}
              </div>

              <div className="agent-chat-input">
                <input
                  type="text"
                  placeholder="Ask a question to test the agent..."
                />
                <button>Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhance the database dashboard render function
  const renderDatabaseDashboard = () => {
    const handleKnowledgeManagerClick = () => {
      setShowKnowledgeManager(true);
    };

    const handleContestantManagerClick = () => {
      setShowContestantManager(true);
    };

    const handleSubmissionManagerClick = () => {
      setShowSubmissionManager(true);
    };

    const handleStorachaConfigClick = () => {
      setShowStorachaConfig(true);
    };

    const handleDiagnosticsClick = () => {
      setShowDiagnostics(true);
    };

    return (
      <div className="admin-dashboard database-dashboard">
        <h2>Database Management</h2>
        <p>
          Manage your hackathon's data sources, contestants, and submissions.
        </p>

        <div className="dashboard-stats">
          {/* ... existing dashboard stats ... */}
        </div>

        <div className="dashboard-actions">
          <div className="action-card">
            <h3>Knowledge Management</h3>
            <p>Manage knowledge sources for different agent categories.</p>
            <button onClick={handleKnowledgeManagerClick}>
              Open Knowledge Manager
            </button>
          </div>

          <div className="action-card">
            <h3>Contestant Management</h3>
            <p>Manage registered hackathon contestants and teams.</p>
            <button onClick={handleContestantManagerClick}>
              Open Contestant Manager
            </button>
          </div>

          <div className="action-card">
            <h3>Submission Management</h3>
            <p>Manage project submissions and judging.</p>
            <button onClick={handleSubmissionManagerClick}>
              Open Submission Manager
            </button>
          </div>

          <div className="action-card">
            <h3>Storacha Configuration</h3>
            <p>Configure Storacha decentralized storage settings.</p>
            <button onClick={handleStorachaConfigClick}>
              Configure Storage
            </button>
          </div>

          <div className="action-card">
            <h3>Diagnostics</h3>
            <p>
              Run diagnostics on your Storacha setup to troubleshoot issues.
            </p>
            <button onClick={handleDiagnosticsClick}>Run Diagnostics</button>
          </div>
        </div>
      </div>
    );
  };

  const handleSectionChange = (section: "content" | "agent" | "database") => {
    setActiveSection(section);
    // Reset all modal states when changing sections
    setShowContestantManager(false);
    setShowSubmissionManager(false);
    setShowKnowledgeManager(false);
  };

  const handleKnowledgeManagerClose = () => {
    setShowKnowledgeManager(false);
  };

  const handleContestantManagerClose = () => {
    setShowContestantManager(false);
  };

  const handleSubmissionManagerClose = () => {
    setShowSubmissionManager(false);
  };

  return (
    <div className="admin-container">
      <nav
        className="admin-nav"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href="/"
            className="back-to-frontend"
            onClick={(e) => {
              e.preventDefault();
              if (demoRef.current) {
                demoRef.current.dispose();
                demoRef.current = null;
              }
              Object.keys(localStorage).forEach((key) => {
                if (key.startsWith("admin-") || key.startsWith("content-")) {
                  localStorage.removeItem(key);
                }
              });
              window.location.href = "/";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              backgroundColor: "#1e293b",
              color: "white",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            <span style={{ fontSize: "18px" }}>←</span>
            Back
          </a>

          <div
            style={{
              display: "flex",
              gap: "2px",
              backgroundColor: "#e2e8f0",
              padding: "2px",
              borderRadius: "6px",
            }}
          >
            <button
              className={`nav-button ${
                activeSection === "content" ? "active" : ""
              }`}
              onClick={() => handleSectionChange("content")}
              style={{
                padding: "6px 16px",
                borderRadius: "4px",
                border: "none",
                background:
                  activeSection === "content" ? "#2563eb" : "transparent",
                color: activeSection === "content" ? "white" : "#475569",
                boxShadow:
                  activeSection === "content"
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Content
            </button>
            <button
              className={`nav-button ${
                activeSection === "agent" ? "active" : ""
              }`}
              onClick={() => handleSectionChange("agent")}
              style={{
                padding: "6px 16px",
                borderRadius: "4px",
                border: "none",
                background:
                  activeSection === "agent" ? "#2563eb" : "transparent",
                color: activeSection === "agent" ? "white" : "#475569",
                boxShadow:
                  activeSection === "agent"
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Agent
            </button>
            <button
              className={`nav-button ${
                activeSection === "database" ? "active" : ""
              }`}
              onClick={() => handleSectionChange("database")}
              style={{
                padding: "6px 16px",
                borderRadius: "4px",
                border: "none",
                background:
                  activeSection === "database" ? "#2563eb" : "transparent",
                color: activeSection === "database" ? "white" : "#475569",
                boxShadow:
                  activeSection === "database"
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Database
            </button>
          </div>
        </div>

        <div
          className="storage-connection-status"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <div
            className={`connection-badge ${
              storachaSettings.isConnected ? "connected" : "disconnected"
            }`}
            onClick={() => setShowStorachaConfig(true)}
            title="Click to configure Storacha connection"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "4px",
              backgroundColor: storachaSettings.isConnected
                ? "#dcfce7"
                : "#fee2e2",
              color: storachaSettings.isConnected ? "#166534" : "#991b1b",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            <span className="connection-icon">
              {storachaSettings.isConnected ? "✓" : "✗"}
            </span>
            <span className="connection-label">
              {storachaSettings.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <button
            className="troubleshoot-button"
            onClick={async () => {
              // ... existing onClick logic ...
            }}
            style={{
              padding: "4px 12px",
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              borderRadius: "4px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Fix Content
          </button>
        </div>
      </nav>

      <div
        className="admin-content"
        style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}
      >
        {activeSection === "content" && renderContentDashboard()}
        {activeSection === "agent" && renderAgentDashboard()}
        {activeSection === "database" && (
          <DatabaseDashboard
            storachaSettings={storachaSettings}
            onStorachaConfigOpen={() => setShowStorachaConfig(true)}
            onKnowledgeManagerOpen={() => setShowKnowledgeManager(true)}
            onContestantManagerOpen={() => setShowContestantManager(true)}
            onSubmissionManagerOpen={() => setShowSubmissionManager(true)}
            onDiagnosticsOpen={() => setShowDiagnostics(true)}
            storachaStats={storachaStats}
            knowledgeSources={knowledgeSources}
          />
        )}

        {showContentManager && activeContentCategory && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={() => setShowContentManager(false)}
              >
                ×
              </button>
              <div className="modal-header">
                <h2>
                  Manage{" "}
                  {activeContentCategory.charAt(0).toUpperCase() +
                    activeContentCategory.slice(1)}
                  s
                </h2>
                <p>
                  Configure {activeContentCategory} information for your
                  hackathon that will be displayed to participants and used by
                  AI assistants.
                </p>
              </div>
              <ContentManager
                category={activeContentCategory}
                onSave={handleContentSaved}
                onCancel={() => setShowContentManager(false)}
              />
            </div>
          </div>
        )}

        {showAgentConfig && activeAgentCategory && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={() => setShowAgentConfig(false)}
              >
                ×
              </button>
              <AgentConfigEditor
                category={activeAgentCategory}
                onConfigSaved={handleAgentConfigSaved}
                onCancel={() => setShowAgentConfig(false)}
              />
            </div>
          </div>
        )}

        {showContestantManager && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={handleContestantManagerClose}
              >
                ×
              </button>
              <ContestantManager onClose={handleContestantManagerClose} />
            </div>
          </div>
        )}

        {showSubmissionManager && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={handleSubmissionManagerClose}
              >
                ×
              </button>
              <SubmissionManager onClose={handleSubmissionManagerClose} />
            </div>
          </div>
        )}

        {showKnowledgeManager && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={handleKnowledgeManagerClose}
              >
                ×
              </button>
              <KnowledgeSourceManager onClose={handleKnowledgeManagerClose} />
            </div>
          </div>
        )}

        {showStorachaConfig && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="close-button"
                onClick={() => setShowStorachaConfig(false)}
              >
                ×
              </button>
              <StorachaConfig
                settings={storachaSettings}
                onConfigSaved={handleStorachaConfigSaved}
                onClose={() => setShowStorachaConfig(false)}
              />
            </div>
          </div>
        )}

        {showDiagnostics && (
          <div className="modal-overlay">
            <div className="modal modal-large">
              <div className="modal-header">
                <h2>Storacha Diagnostics</h2>
                <button
                  className="close-button"
                  onClick={() => setShowDiagnostics(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <DiagnosticTool />
              </div>
            </div>
          </div>
        )}

        {saveConfirmation && (
          <div className="save-confirmation">{saveConfirmation}</div>
        )}
      </div>
    </div>
  );
}

function DiagnosticTool() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    setDiagnosticResults(null);

    try {
      const client = new StorachaNetlifyClient();

      // Step 1: Initialize and test basic connection
      console.log("Running Storacha diagnostics...");
      await client.initialize();

      // Step 2: Test connection
      const connectionTest = await client.testConnection();

      // Step 3: Try to list (this can fail and that's okay for diagnostics)
      let listResult = null;
      try {
        const result = await client.listKnowledgeSources();
        listResult = {
          success: true,
          sourceCount: result.sources.length,
          sources: result.sources.slice(0, 3), // Only include first few for brevity
        };
      } catch (listError: any) {
        listResult = {
          success: false,
          error: listError.message,
        };
      }

      // Step 4: Check environment
      // This request requires the server having the env vars
      const envCheckResponse = await fetch(
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000/api/env-check"
          : "/api/env-check"
      );

      let envCheckResult;
      if (envCheckResponse.ok) {
        envCheckResult = await envCheckResponse.json();
      } else {
        envCheckResult = {
          error: `ENV check failed with status: ${envCheckResponse.status}`,
        };
      }

      // Compile results
      const results = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        initialization: { success: client.isStorageConnected() },
        connectionTest,
        listOperation: listResult,
        environmentCheck: envCheckResult,
        clientInfo: {
          spaceDid: client.getSpaceDid(),
          stats: client.getUsageStats(),
        },
      };

      setDiagnosticResults(results);
    } catch (error: any) {
      console.error("Diagnostic error:", error);
      setErrorMessage(error.message || "An error occurred during diagnostics");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="diagnostic-tool">
      <h3>Storacha Diagnostics</h3>
      <p>
        This tool helps troubleshoot issues with your Storacha storage
        configuration. It will run several tests to identify potential problems.
      </p>

      <button
        className="primary-button"
        onClick={runDiagnostics}
        disabled={isRunning}
      >
        {isRunning ? "Running Diagnostics..." : "Run Diagnostics"}
      </button>

      {errorMessage && (
        <div className="error-message">
          <h4>Diagnostic Error</h4>
          <p>{errorMessage}</p>
        </div>
      )}

      {diagnosticResults && (
        <div className="diagnostic-results">
          <h4>Diagnostic Results</h4>
          <pre>{JSON.stringify(diagnosticResults, null, 2)}</pre>

          <div className="recommendations">
            <h4>Recommendations</h4>
            <ul>
              {!diagnosticResults.connectionTest.success && (
                <li>
                  ❌ Connection test failed: Check your Storacha credentials in
                  the .env.local file
                </li>
              )}
              {diagnosticResults.connectionTest.success && (
                <li>
                  ✅ Connection test passed: Your Storacha configuration is
                  working
                </li>
              )}

              {diagnosticResults.listOperation.success && (
                <li>
                  ✅ List operation successful: Found{" "}
                  {diagnosticResults.listOperation.sourceCount} sources
                </li>
              )}
              {!diagnosticResults.listOperation.success && (
                <li>
                  ❌ List operation failed:{" "}
                  {diagnosticResults.listOperation.error}
                </li>
              )}

              {diagnosticResults.environmentCheck
                .STORACHA_SPACE_DID_present && (
                <li>✅ STORACHA_SPACE_DID environment variable is present</li>
              )}
              {!diagnosticResults.environmentCheck
                .STORACHA_SPACE_DID_present && (
                <li>❌ STORACHA_SPACE_DID environment variable is missing</li>
              )}

              {diagnosticResults.environmentCheck
                .STORACHA_PRIVATE_KEY_present && (
                <li>✅ STORACHA_PRIVATE_KEY environment variable is present</li>
              )}
              {!diagnosticResults.environmentCheck
                .STORACHA_PRIVATE_KEY_present && (
                <li>❌ STORACHA_PRIVATE_KEY environment variable is missing</li>
              )}

              {diagnosticResults.environmentCheck.STORACHA_PROOF_present && (
                <li>✅ STORACHA_PROOF environment variable is present</li>
              )}
              {!diagnosticResults.environmentCheck.STORACHA_PROOF_present && (
                <li>❌ STORACHA_PROOF environment variable is missing</li>
              )}
            </ul>

            <h4>Next Steps</h4>
            <ol>
              {(!diagnosticResults.environmentCheck
                .STORACHA_SPACE_DID_present ||
                !diagnosticResults.environmentCheck
                  .STORACHA_PRIVATE_KEY_present ||
                !diagnosticResults.environmentCheck.STORACHA_PROOF_present) && (
                <li>
                  Run the setup script: <code>npm run setup-storacha</code>
                </li>
              )}

              {!diagnosticResults.connectionTest.success && (
                <li>Double-check your credentials in .env.local</li>
              )}

              {diagnosticResults.connectionTest.success &&
                !diagnosticResults.listOperation.success && (
                  <li>
                    Your connection is working but listing failed. Check if your
                    space is properly provisioned.
                  </li>
                )}

              <li>
                Restart your Netlify server after making any changes:{" "}
                <code>npm run netlify</code>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
