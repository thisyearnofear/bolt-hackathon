import { useEffect, useState, useCallback } from "react";
import { ABlock } from "./lib/ABlock";
import { ContestantInfo } from "./components/ContestantInfo";
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
import { Link } from "react-router-dom";
import { ContestantData, ContestantCategory } from "./lib/ContestantData";

import "./App.css";
import { Demo } from "./Demo";
import ThreeCanvas from "./components/threeCanvas";
import { AgentController } from "./components/AgentController";

// Define category-specific agent personas
const AGENT_PERSONAS = {
  prize: {
    role: "Prize Track Guide",
    background:
      "I help teams understand prize categories and submission requirements.",
    expertise: [
      "Prize Categories",
      "Submission Requirements",
      "Eligibility Criteria",
    ],
    greeting:
      "Hello! I can help you explore our prize tracks and submission requirements.",
    contextPrompt:
      "Focus on prize-related information and submission guidelines.",
  },
  sponsor: {
    role: "Sponsor Resources Guide",
    background:
      "I help teams leverage sponsor technologies and resources effectively.",
    expertise: ["Technical Resources", "API Integration", "Platform Features"],
    greeting:
      "Hello! I can help you access and implement sponsor technologies in your project.",
    contextPrompt:
      "Focus on sponsor resources and technical implementation guidance.",
  },
  judge: {
    role: "Judging Criteria Advisor",
    background:
      "I help teams understand judging criteria and improve their submissions.",
    expertise: [
      "Evaluation Criteria",
      "Project Requirements",
      "Presentation Tips",
    ],
    greeting:
      "Hello! I can help you understand how projects are evaluated and judged.",
    contextPrompt:
      "Focus on judging criteria and submission improvement advice.",
  },
};

function App() {
  const [isDemoReady, setIsDemoReady] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isGPUAvailable, setIsGPUAvailable] = useState(WebGPU.isAvailable());
  const [selectedBlock, setSelectedBlock] = useState<ABlock>();
  const [activeAgent, setActiveAgent] = useState<ContestantData | null>(null);

  useEffect(() => {
    document.body.classList.add("loading");

    const interval = setInterval(() => {
      if (Demo.instance != null && Demo.firstRenderDone) {
        setIsDemoReady(true);
        clearInterval(interval);
        document.body.classList.remove("loading");
      }
    }, 100);
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
    document.documentElement.setAttribute(
      "data-theme",
      isDarkTheme ? "light" : "dark"
    );

    Demo.setTheme(isDarkTheme ? "light" : "dark");
  };

  // Handle category selection with agent activation
  const handleCategoryClick = (category: ContestantCategory) => {
    if (Demo.instance) {
      Demo.instance.setActiveCategory(category);

      // Create and activate the appropriate agent
      const persona = AGENT_PERSONAS[category];
      if (persona) {
        const agent: ContestantData = {
          id: Date.now(),
          name: persona.role,
          category,
          aiPersona: persona,
          chatHistory: [],
          teamName: persona.role,
          project: "",
          description: persona.background,
          track: "",
          members: 0,
          progress: 0,
          colorIndex: 0,
        };
        setActiveAgent(agent);
        Demo.instance.activateCategoryAgent(category);
      }
    }
  };

  return (
    <>
      <header className="frame">
        <h1 className="frame__title">Hackathon</h1>
        <div className="frame__info">
          <span>🌐 Virtual Event</span>
          <span>🏆 $1M+ in Prizes</span>
          <span>📅 TBD</span>
        </div>
        <nav className="frame__tags">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (Demo.instance) {
                Demo.instance.setActiveCategory(null);
                setActiveAgent(null);
              }
            }}
          >
            #all
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleCategoryClick("prize");
            }}
          >
            #prizes
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleCategoryClick("sponsor");
            }}
          >
            #sponsors
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleCategoryClick("judge");
            }}
          >
            #judges
          </a>
          <a href="http://hackathon.dev" target="_blank">
            #register
          </a>
          <Link to="/admin" className="admin-link">
            #admin
          </Link>
        </nav>
      </header>

      <div className="content">
        {!isGPUAvailable && (
          <div className="demo__infos__container">
            <div className="demo__infos">
              <h1 className="frame__title">WebGPU not available</h1>
              <p>
                WebGPU is not available on your device or browser. Please use a
                device or browser that supports WebGPU.
              </p>
            </div>
          </div>
        )}
        {!isDemoReady && (
          <div className="loader-container">
            <span className="loader"></span>
          </div>
        )}
        <button
          className="theme-toggle-button"
          onClick={toggleTheme}
          aria-label={`Switch to ${!isDarkTheme ? "dark" : "light"} mode`}
        >
          {isDarkTheme ? "☀️" : "🌙"}
        </button>
        <ThreeCanvas onBlockClick={setSelectedBlock} />
        <ContestantInfo block={selectedBlock} />
        {Demo.instance && activeAgent && (
          <AgentController demo={Demo.instance} activeAgent={activeAgent} />
        )}
      </div>
    </>
  );
}

export default App;
