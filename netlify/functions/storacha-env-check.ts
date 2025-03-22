import { Handler } from "@netlify/functions";

/**
 * Check environment variables related to Storacha
 * This helps diagnose environment variable issues in production without exposing sensitive values
 */
export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin":
      process.env.NODE_ENV === "production"
        ? process.env.PRODUCTION_URL || "https://hackathon-bolt.netlify.app"
        : "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  try {
    // Check for environment variables without exposing their values
    const result = {
      environment: process.env.NODE_ENV || "unset",
      STORACHA_SPACE_DID_present: !!process.env.STORACHA_SPACE_DID,
      STORACHA_PRIVATE_KEY_present: !!process.env.STORACHA_PRIVATE_KEY,
      STORACHA_PROOF_present: !!process.env.STORACHA_PROOF,
      PRODUCTION_URL_present: !!process.env.PRODUCTION_URL,
      CONTENT_MAPPINGS_present: !!process.env.CONTENT_MAPPINGS,
      CORS_origin: headers["Access-Control-Allow-Origin"],
      timestamp: new Date().toISOString(),
      // Add limited value info for debugging (first few chars only)
      PRODUCTION_URL_value: process.env.PRODUCTION_URL
        ? process.env.PRODUCTION_URL.substring(0, 30) +
          (process.env.PRODUCTION_URL.length > 30 ? "..." : "")
        : null,
      STORACHA_SPACE_DID_prefix: process.env.STORACHA_SPACE_DID
        ? process.env.STORACHA_SPACE_DID.substring(0, 15) + "..."
        : null,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error("Error checking environment:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to check environment variables",
        message: error.message,
      }),
    };
  }
};
