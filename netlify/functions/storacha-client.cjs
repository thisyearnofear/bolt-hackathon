import { create } from "@web3-storage/w3up-client";
import { DID } from "@ipld/dag-ucan/src/did.js";
import { CarReader } from "@ipld/car";
import { importDAG } from "@ucanto/core/src/delegation.js";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main handler for the Storacha client Netlify function
 */
const handler = async (event, context) => {
  // CORS headers for local development
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  console.log(`Received ${event.httpMethod} request for ${event.path}`);

  // Handle OPTIONS requests (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  if (!event.body) {
    console.error("Request received without body");
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "No request body" }),
    };
  }

  try {
    const { action, data } = JSON.parse(event.body);
    console.log(`Creating w3up client for action: ${action}`);

    // Create client
    const client = await create();
    console.log("Client created successfully");

    // Get space DID from environment or request
    const spaceDid = process.env.STORACHA_SPACE_DID || data?.spaceDid;
    if (!spaceDid) {
      throw new Error("No space DID provided");
    }

    // Get private key from environment
    const privateKey = process.env.STORACHA_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("No private key found in environment");
    }

    // Get proof from file
    const proofPath = process.env.STORACHA_PROOF_PATH;
    if (!proofPath) {
      throw new Error("No proof path found in environment");
    }

    try {
      // Read the delegation proof
      const proofFilePath = path.join(process.cwd(), proofPath);
      const proofData = readFileSync(proofFilePath, "utf8").trim();
      console.log("Successfully read delegation proof from file");

      // Parse the proof using CarReader
      const proofBytes = Buffer.from(proofData, "base64");
      const reader = await CarReader.fromBytes(proofBytes);

      // Collect blocks
      const blocks = [];
      for await (const block of reader.blocks()) {
        blocks.push(block);
      }

      // Import the delegation
      const proof = await importDAG(blocks);
      console.log("Successfully parsed delegation proof");

      // Add the space and set it as current
      const space = await client.addSpace(proof);
      await client.setCurrentSpace(space.did());
      console.log("Successfully set up space with proof");
    } catch (authError) {
      console.error("Authorization error:", authError);
      throw new Error(`Failed to authorize with space: ${authError.message}`);
    }

    // Process the requested action
    switch (action) {
      case "ping": {
        return handlePing(headers, client);
      }
      case "upload": {
        return handleUpload(headers, client, data);
      }
      case "download": {
        return handleDownload(headers, data);
      }
      case "list": {
        return handleList(headers, client, data);
      }
      case "delete": {
        return handleDelete(headers, client, data);
      }
      case "get-mappings": {
        return handleGetMappings(headers, client, data);
      }
      case "refresh-mappings": {
        return handleRefreshMappings(headers, client, data);
      }
      default: {
        console.error(`Invalid action requested: ${action}`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid action" }),
        };
      }
    }
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Internal server error",
        details: error.stack,
      }),
    };
  }
};

// Helper function for ping action
async function handlePing(headers, client) {
  try {
    console.log("Attempting to list spaces...");
    const spaces = await client.spaces();
    console.log(`Found ${spaces.length} spaces`);

    const space = spaces[0];
    if (!space) {
      console.error("No space available in client");
      throw new Error("No space available");
    }

    const spaceDid = space.did();
    console.log(`Successfully connected to space: ${spaceDid}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Connected successfully",
        spaceDid,
      }),
    };
  } catch (error) {
    console.error("Ping error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Failed to connect to space",
        details: error.message,
        stack: error.stack,
      }),
    };
  }
}

// Helper function for upload action
async function handleUpload(headers, client, data) {
  if (!data?.content || !data?.filename) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing content or filename" }),
    };
  }

  const binaryData = Buffer.from(data.content, "base64");
  const file = new File([binaryData], data.filename, {
    type: data.contentType || "application/octet-stream",
  });

  const cid = await client.uploadFile(file);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, cid: cid.toString() }),
  };
}

// Helper function for download action
async function handleDownload(headers, data) {
  if (!data?.cid) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing CID" }),
    };
  }

  const response = await fetch(`https://w3s.link/ipfs/${data.cid}`);
  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status}`);
  }

  const fileData = await response.arrayBuffer();
  const fileContent = Buffer.from(fileData).toString("base64");
  const contentType =
    response.headers.get("Content-Type") || "application/octet-stream";

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      content: fileContent,
      contentType,
    }),
  };
}

// Helper function for list action
async function handleList(headers, client, data) {
  if (!client) {
    console.error("List request received but client is not initialized");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Storacha client not initialized",
      }),
    };
  }

  try {
    const { prefix, category } = data || {};
    console.log(
      `Listing files with prefix: ${prefix || "none"}, category: ${
        category || "none"
      }`
    );

    try {
      const uploads = await client.capability.upload.list({
        size: 100,
      });

      console.log(`List operation returned ${uploads.results.length} results`);

      const results = [];

      for (const upload of uploads.results) {
        const cid = upload.root.toString();
        if (prefix && !cid.startsWith(prefix)) {
          continue;
        }

        let uploadCategory;
        try {
          if (upload.meta) {
            const meta = JSON.parse(upload.meta);
            uploadCategory = meta.category;
          }
        } catch (e) {
          // Ignore metadata parsing errors
        }

        if (category && uploadCategory && uploadCategory !== category) {
          continue;
        }

        results.push({
          cid: cid,
          timestamp: upload.insertedAt
            ? new Date(Number(upload.insertedAt)).toISOString()
            : undefined,
          category: uploadCategory,
        });
      }

      console.log(`After filtering, returning ${results.length} results`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          results,
        }),
      };
    } catch (listError) {
      console.error("Error using client list capability:", listError);

      // Try alternative approach
      try {
        console.log("Attempting alternative listing approach...");
        const spaces = await client.spaces();
        console.log(`Found ${spaces.length} spaces`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            results: [],
            spaces: spaces.map((space) => ({ did: space.did() })),
            note: "Could not list uploads, but found spaces",
            error: listError.message,
          }),
        };
      } catch (altError) {
        console.error("Alternative listing approach also failed:", altError);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            results: [],
            note: "Could not list uploads or spaces. Service may have limited capabilities.",
            error: `List error: ${listError.message}, Alternative error: ${altError.message}`,
          }),
        };
      }
    }
  } catch (error) {
    console.error("Error listing files from Storacha:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || "Error listing files from Storacha",
        stack: error.stack,
      }),
    };
  }
}

// Helper function for delete action
async function handleDelete(headers, client, data) {
  if (!data?.cid) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing CID" }),
    };
  }

  try {
    console.log(`Attempting to remove upload with CID: ${data.cid}`);

    // First, get the shards associated with this content if we need to remove them
    let shardInfo = [];
    if (data.removeShards) {
      try {
        const uploadInfo = await client.capability.upload.list({
          root: data.cid,
        });
        if (uploadInfo.results && uploadInfo.results.length > 0) {
          shardInfo = uploadInfo.results[0].shards || [];
        }
      } catch (e) {
        console.warn("Could not fetch shard information:", e);
      }
    }

    // Remove the content CID from the account
    await client.remove(data.cid, { shards: data.removeShards === true });
    console.log("Successfully removed upload from account");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully removed upload with CID: ${data.cid} from your account`,
        note: "Note: The data may still persist on the IPFS network and will be retained by Storacha for at least 30 days.",
        removedShards: data.removeShards === true,
        shardCount: shardInfo.length,
      }),
    };
  } catch (error) {
    console.error("Error removing upload:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Failed to remove upload: ${error.message}`,
        note: "If you need to remove both content and shards, try setting removeShards: true in the request",
        stack: error.stack,
      }),
    };
  }
}

// Helper function for get-mappings action
async function handleGetMappings(headers, client, data) {
  try {
    console.log("Retrieving space mappings...");
    const uploads = await client.capability.upload.list({
      size: 100,
    });

    const mappings = {};
    for (const upload of uploads.results) {
      try {
        if (upload.meta) {
          const meta = JSON.parse(upload.meta);
          if (meta.mapping) {
            mappings[meta.mapping] = upload.root.toString();
          }
        }
      } catch (e) {
        // Ignore metadata parsing errors
        console.warn(
          `Failed to parse metadata for upload ${upload.root.toString()}:`,
          e
        );
      }
    }

    console.log(`Found ${Object.keys(mappings).length} mappings`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        mappings,
      }),
    };
  } catch (error) {
    console.error("Error getting mappings:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Failed to get mappings: ${error.message}`,
        stack: error.stack,
      }),
    };
  }
}

// Helper function for refresh-mappings action
async function handleRefreshMappings(headers, client, data) {
  if (!data?.mappings || typeof data.mappings !== "object") {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing or invalid mappings object" }),
    };
  }

  try {
    console.log("Refreshing space mappings...");
    const updates = [];

    // Process each mapping
    for (const [key, cid] of Object.entries(data.mappings)) {
      try {
        // Verify the CID exists
        const response = await fetch(`https://w3s.link/ipfs/${cid}`);
        if (!response.ok) {
          console.warn(`CID ${cid} for mapping ${key} is not accessible`);
          continue;
        }

        // Update the mapping metadata
        await client.capability.upload.add({
          root: cid,
          meta: JSON.stringify({
            mapping: key,
            updatedAt: Date.now(),
          }),
        });

        updates.push({ key, cid, status: "updated" });
      } catch (e) {
        console.warn(`Failed to update mapping for ${key}:`, e);
        updates.push({ key, cid, status: "failed", error: e.message });
      }
    }

    console.log(`Processed ${updates.length} mapping updates`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        updates,
      }),
    };
  } catch (error) {
    console.error("Error refreshing mappings:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Failed to refresh mappings: ${error.message}`,
        stack: error.stack,
      }),
    };
  }
}

export { handler };
