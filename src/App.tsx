import { useEffect, useState, useCallback } from "react";
import { ABlock } from "./lib/ABlock";
import { ContestantInfo } from "./components/ContestantInfo";
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
import { Link } from "react-router-dom";

import "./App.css";
import { Demo } from "./Demo";
import ThreeCanvas from "./components/threeCanvas";
import { AgentController } from "./components/AgentController";

function App() {
  const [isDemoReady, setIsDemoReady] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isGPUAvailable, setIsGPUAvailable] = useState(WebGPU.isAvailable());
  const [webGPUError, setWebGPUError] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ABlock>();

  useEffect(() => {
    document.body.classList.add("loading");

    // Check for WebGPU support
    if (!isGPUAvailable) {
      document.body.classList.remove("loading");
      setWebGPUError(
        "WebGPU is not available on your device or browser. Please use Chrome 113+, Edge 113+, or Opera 99+."
      );
      return;
    }

    const interval = setInterval(() => {
      // Check for error state
      if (document.body.classList.contains("webgpu-error")) {
        clearInterval(interval);
        document.body.classList.remove("loading");
        setWebGPUError(
          "Failed to initialize WebGPU. This could be due to hardware limitations or browser settings."
        );
        return;
      }

      if (Demo.instance != null && Demo.firstRenderDone) {
        setIsDemoReady(true);
        clearInterval(interval);
        document.body.classList.remove("loading");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isGPUAvailable]);

  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
    document.documentElement.setAttribute(
      "data-theme",
      isDarkTheme ? "light" : "dark"
    );

    Demo.setTheme(isDarkTheme ? "light" : "dark");
  };

  return (
    <>
      <header className="app-header">
        <div className="header-logo">
          <h1>Hackathon.AI</h1>
        </div>
        <div className="header-nav">
          <Link to="/admin" className="nav-link admin-link">
            Admin Dashboard
          </Link>
        </div>
      </header>

      <div className="content">
        {webGPUError && (
          <div className="webgpu-error">
            <div className="error-content">
              <h2>3D Scene Error</h2>
              <p>{webGPUError}</p>
              <p>
                You can still access the{" "}
                <Link to="/admin">Admin Dashboard</Link> to manage your
                hackathon content.
              </p>
            </div>
          </div>
        )}

        {!isDemoReady && !webGPUError && (
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
        {Demo.instance && <AgentController demo={Demo.instance} />}
      </div>
    </>
  );
}

export default App;
