import { Handler } from "@netlify/functions";

/**
 * Netlify function to check if Storacha environment variables are configured
 * This doesn't expose the actual keys, just reports if they exist
 */
const handler: Handler = async (event, context) => {
  // CORS headers for local development
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  // Handle OPTIONS requests (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  try {
    // Check for Storacha environment variables
    const privateKeyConfigured = !!process.env.STORACHA_PRIVATE_KEY;
    const proofConfigured = !!process.env.STORACHA_PROOF;
    const spaceDidConfigured = !!process.env.STORACHA_SPACE_DID;

    // Provide more detailed information without revealing sensitive data
    const privateKeyInfo = privateKeyConfigured
      ? `${process.env.STORACHA_PRIVATE_KEY?.substring(0, 6)}...`
      : "Not configured";

    const spaceDidInfo = spaceDidConfigured
      ? process.env.STORACHA_SPACE_DID
      : "Not configured";

    const proofInfo = proofConfigured
      ? `${process.env.STORACHA_PROOF?.substring(0, 10)}...`
      : "Not configured";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        privateKeyConfigured,
        proofConfigured,
        spaceDidConfigured,
        // If all are configured, then private mode is fully configured
        privateConfigComplete:
          privateKeyConfigured && proofConfigured && spaceDidConfigured,
        // Additional info for UI display
        configInfo: {
          privateKeyInfo,
          spaceDidInfo,
          proofInfo,
          mode: privateKeyConfigured && proofConfigured ? "private" : "public",
          setupComplete:
            privateKeyConfigured && proofConfigured && spaceDidConfigured,
        },
      }),
    };
  } catch (error) {
    console.error("Error checking environment variables:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to check environment variables" }),
    };
  }
};

export { handler };
