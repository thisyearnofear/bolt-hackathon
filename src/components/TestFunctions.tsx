import { useState } from "react";
import {
  testStorachaFunction,
  testDownloadFromCid,
  testListUploads,
} from "../lib/utils/testNetlifyFunctions";
import "./TestFunctions.css";

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export function TestFunctions() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testCid, setTestCid] = useState<string>("");

  const addResult = (success: boolean, message: string, data?: any) => {
    setResults((prev) => [
      { success, message, data, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  };

  const handleTestUpload = async () => {
    setIsLoading(true);
    try {
      const result = await testStorachaFunction();
      if (result) {
        addResult(true, "Upload test successful", result);
        // Set the CID for download test
        setTestCid(result.cid);
      } else {
        addResult(false, "Upload test failed", null);
      }
    } catch (error: any) {
      addResult(false, `Error: ${error.message}`, null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDownload = async () => {
    if (!testCid) {
      addResult(false, "No CID available. Please run upload test first.", null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await testDownloadFromCid(testCid);
      if (result) {
        addResult(true, "Download test successful", result);
      } else {
        addResult(false, "Download test failed", null);
      }
    } catch (error: any) {
      addResult(false, `Error: ${error.message}`, null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestList = async () => {
    setIsLoading(true);
    try {
      const result = await testListUploads();
      if (result) {
        addResult(true, "List test successful", result);
      } else {
        addResult(false, "List test failed", null);
      }
    } catch (error: any) {
      addResult(false, `Error: ${error.message}`, null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResults = () => {
    setResults([]);
  };

  return (
    <div className="test-functions">
      <h2>Netlify Functions Test</h2>
      <p>
        Use the buttons below to test the Netlify serverless functions that
        interact with Storacha.
      </p>

      <div className="test-controls">
        <button
          onClick={handleTestUpload}
          disabled={isLoading}
          className="test-button upload"
        >
          {isLoading ? "Testing..." : "Test Upload"}
        </button>
        <button
          onClick={handleTestDownload}
          disabled={isLoading || !testCid}
          className="test-button download"
        >
          {isLoading ? "Testing..." : "Test Download"}
        </button>
        <button
          onClick={handleTestList}
          disabled={isLoading}
          className="test-button list"
        >
          {isLoading ? "Testing..." : "Test List Uploads"}
        </button>
        <button onClick={handleClearResults} className="test-button clear">
          Clear Results
        </button>
      </div>

      {testCid && (
        <div className="cid-display">
          <p>
            <strong>Test CID:</strong> {testCid}
          </p>
        </div>
      )}

      <div className="test-results">
        <h3>Test Results</h3>
        {results.length === 0 ? (
          <p className="no-results">No tests run yet</p>
        ) : (
          <div className="results-list">
            {results.map((result, index) => (
              <div
                key={index}
                className={`result-item ${
                  result.success ? "success" : "error"
                }`}
              >
                <div className="result-header">
                  <span className="result-icon">
                    {result.success ? "✅" : "❌"}
                  </span>
                  <span className="result-message">{result.message}</span>
                </div>
                {result.data && (
                  <pre className="result-data">
                    {typeof result.data === "string"
                      ? result.data
                      : JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
