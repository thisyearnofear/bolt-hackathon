import React, { useState, useEffect } from "react";
import { StorachaNetlifyClient } from "../lib/storacha/StorachaNetlifyClient";
import "./StorachaConfig.css";

interface StorachaConfigProps {
  onClose: () => void;
  onConfigSaved: (config: StorachaSettings) => void;
  settings?: StorachaSettings;
}

export interface StorachaSettings {
  mode: "public" | "private";
  spaceDid: string | null;
  isConnected: boolean;
}

export function StorachaConfig({
  onClose,
  onConfigSaved,
  settings: initialSettings,
}: StorachaConfigProps) {
  // Load settings from provided prop or localStorage or use defaults
  const [settings, setSettings] = useState<StorachaSettings>(
    initialSettings || {
      mode:
        (localStorage.getItem("storacha-mode") as "public" | "private") ||
        "private",
      spaceDid: localStorage.getItem("storacha-space-did") || null,
      isConnected: false,
    }
  );

  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [privateKeyDetected, setPrivateKeyDetected] = useState<boolean>(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState<boolean>(false);

  // Check if Netlify environment variables are present
  useEffect(() => {
    // This would only work server-side, but we can check if
    // the Netlify function returns environment status
    const checkNetlifyEnv = async () => {
      try {
        const response = await fetch(
          process.env.NODE_ENV === "development"
            ? "http://localhost:8888/.netlify/functions/storacha-env-check"
            : "/api/storacha-env-check"
        );

        if (response.ok) {
          const data = await response.json();
          setPrivateKeyDetected(data.privateKeyConfigured);

          // If private key is detected, suggest private mode
          if (data.privateKeyConfigured) {
            setSettings((prev) => ({
              ...prev,
              mode: "private",
            }));
          }
        }
      } catch (error) {
        console.warn("Could not check Netlify environment", error);
        // Assume no variables are set
        setPrivateKeyDetected(false);
      }
    };

    checkNetlifyEnv();
  }, []);

  // Update to ensure spaceDid is a string when needed
  const ensureValidSettings = () => {
    // If in public mode, ensure spaceDid is a non-empty string
    if (
      settings.mode === "public" &&
      (!settings.spaceDid || settings.spaceDid.trim() === "")
    ) {
      return false;
    }
    return true;
  };

  // Test the connection with current settings
  const testConnection = async () => {
    setTestStatus("testing");
    setErrorMessage("");

    // Make sure we have a valid spaceDid for public mode
    if (
      settings.mode === "public" &&
      (!settings.spaceDid || settings.spaceDid.trim() === "")
    ) {
      setTestStatus("error");
      setErrorMessage("Please enter a valid Space DID");
      return;
    }

    try {
      const client = new StorachaNetlifyClient(settings.spaceDid || undefined);
      await client.initialize();

      // Try a simple operation to validate connection
      const testResult = await client.testConnection();

      if (testResult.success) {
        setTestStatus("success");
        setSettings((prev) => ({
          ...prev,
          isConnected: true,
        }));
      } else {
        setTestStatus("error");
        setErrorMessage(testResult.error || "Connection test failed");
      }
    } catch (error: any) {
      setTestStatus("error");
      setErrorMessage(error.message || "An unknown error occurred");
    }
  };

  // Save the settings
  const saveSettings = () => {
    // Validate settings before saving
    if (
      settings.mode === "public" &&
      (!settings.spaceDid || settings.spaceDid.trim() === "")
    ) {
      setErrorMessage("Please enter a valid Space DID for public mode");
      return;
    }

    // Save to localStorage
    localStorage.setItem("storacha-mode", settings.mode);
    if (settings.spaceDid) {
      localStorage.setItem("storacha-space-did", settings.spaceDid);
    } else {
      localStorage.removeItem("storacha-space-did");
    }

    // Notify parent component
    onConfigSaved(settings);

    // Close the modal
    onClose();
  };

  return (
    <div className="storacha-config">
      <h2>Storacha Storage Configuration</h2>
      <p>
        Configure how your hackathon data is stored using Storacha decentralized
        storage.
      </p>

      <div className="config-section">
        <h3>Storage Mode</h3>
        <div className="storage-modes">
          <div
            className={`storage-mode ${
              settings.mode === "public" ? "active" : ""
            }`}
            onClick={() => setSettings({ ...settings, mode: "public" })}
          >
            <div className="mode-header">
              <h4>Public Mode</h4>
              <div className="mode-tag">Manual Setup</div>
            </div>
            <p>
              Use a public Storacha space to store and retrieve your hackathon
              data. You will need to create and manage your own Storacha space.
            </p>
            {settings.mode === "public" && (
              <div className="mode-settings">
                <div className="form-group">
                  <label>
                    Space DID <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.spaceDid || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, spaceDid: e.target.value })
                    }
                    placeholder="did:key:..."
                    className={
                      !settings.spaceDid && testStatus === "error"
                        ? "input-error"
                        : ""
                    }
                  />
                  <div className="help-text">
                    The public identifier for your Storacha space. This is
                    required for public mode.
                  </div>
                </div>
                <button
                  className={`test-button ${
                    testStatus === "testing" ? "testing" : ""
                  }`}
                  onClick={testConnection}
                  disabled={testStatus === "testing" || !settings.spaceDid}
                >
                  {testStatus === "testing" ? "Testing..." : "Test Connection"}
                </button>

                {testStatus === "success" && (
                  <div className="success-message">
                    ✅ Connection successful! Your hackathon will use this
                    Storacha space.
                  </div>
                )}

                {testStatus === "error" && (
                  <div className="error-message">
                    ❌ Connection failed: {errorMessage}
                  </div>
                )}

                <div className="space-creation">
                  <h5>Don't have a Storacha space?</h5>
                  <p>You can create one easily with the Storacha CLI:</p>
                  <code>npm install -g @web3-storage/w3cli</code>
                  <code>w3 space create</code>
                  <p>
                    Follow the prompts to create your space, then copy the DID
                    value.
                  </p>
                  <p className="tip">
                    <strong>Tip:</strong> For most users, we recommend using
                    Private Mode instead, which automatically configures
                    everything for you.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className={`storage-mode ${
              settings.mode === "private" ? "active" : ""
            }`}
            onClick={() => setSettings({ ...settings, mode: "private" })}
          >
            <div className="mode-header">
              <h4>Private Mode</h4>
              <div className="mode-tag">Advanced</div>
            </div>
            <p>
              Use private Netlify environment variables to securely manage your
              Storacha space. Ideal for private hackathons or organizations.
            </p>

            {settings.mode === "private" && (
              <div className="mode-settings">
                {privateKeyDetected ? (
                  <div className="success-message">
                    ✅ Storacha private key detected in Netlify environment
                    variables.
                  </div>
                ) : (
                  <div className="warning-message">
                    ⚠️ No Storacha private key detected in Netlify environment
                    variables.
                  </div>
                )}

                <div className="private-setup-instructions">
                  <h5>How to configure Private Mode:</h5>
                  <ol>
                    <li>
                      Install Storacha CLI:{" "}
                      <code>npm install -g @web3-storage/w3cli</code>
                    </li>
                    <li>
                      Create a space: <code>w3 space create</code>
                    </li>
                    <li>
                      Generate a key: <code>w3 key create</code> (save the
                      output starting with "Mg...")
                    </li>
                    <li>
                      Create delegation:{" "}
                      <code>
                        w3 delegation create [DID_FROM_STEP_3] --base64
                      </code>
                    </li>
                    <li>
                      Set Netlify environment variables:
                      <ul>
                        <li>
                          STORACHA_PRIVATE_KEY: The private key from step 3
                        </li>
                        <li>STORACHA_PROOF: The delegation from step 4</li>
                        <li>STORACHA_SPACE_DID: The DID of your space</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <button
                  className={`test-button ${
                    testStatus === "testing" ? "testing" : ""
                  }`}
                  onClick={testConnection}
                  disabled={testStatus === "testing"}
                >
                  {testStatus === "testing" ? "Testing..." : "Test Connection"}
                </button>

                {testStatus === "success" && (
                  <div className="success-message">
                    ✅ Connection successful! Your hackathon will use private
                    Storacha storage.
                  </div>
                )}

                {testStatus === "error" && (
                  <div className="error-message">
                    ❌ Connection failed: {errorMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="config-actions">
        <button className="cancel-button" onClick={onClose}>
          Cancel
        </button>
        <button
          className="save-button"
          onClick={saveSettings}
          disabled={testStatus === "testing"}
        >
          Save Configuration
        </button>
      </div>

      <div className="demo-data-notice">
        <h3>About Real Data Storage</h3>
        <p>
          Your application is now configured to use real Storacha decentralized
          storage. No mock data will be provided - all data will be stored and
          retrieved from your actual Storacha space.
        </p>
        <p>
          Make sure your Storacha space is properly configured in{" "}
          {settings.mode === "private"
            ? "Netlify environment variables"
            : "the space DID field above"}{" "}
          before proceeding.
        </p>
      </div>
    </div>
  );
}
