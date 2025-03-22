import { ContestantCategory } from "../ContestantData";
import { StorachaAgentData } from "./StorachaClient";

/**
 * Test result interface for Storacha connection
 */
export interface StorachaTestResult {
  success: boolean;
  error?: string;
  mode?: "public" | "private";
  details?: any;
}

// Define a type for our CID mapping
interface CidMapping {
  [key: string]: string;
}

/**
 * Client for interacting with Storacha via Netlify functions
 * This provides a safer way to handle Storacha operations
 */
export class StorachaNetlifyClient {
  // Static property for content mappings
  private static contentMappings: CidMapping | null = null;

  // Add cache for downloaded content
  private static downloadCache: Record<
    string,
    { data: any; timestamp: number }
  > = {};

  // Cache expiration time - 5 minutes
  private static CACHE_EXPIRATION = 5 * 60 * 1000;

  // Get the appropriate API URL based on environment
  private static getApiUrl(): string {
    // In development, use the Netlify functions server directly
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:8888/.netlify/functions/storacha-client";
    }
    // In production, use the API path that gets redirected to functions
    return "/api/storacha-client";
  }

  /**
   * Load the content mappings file if available
   */
  private static loadContentMappings(): CidMapping {
    if (this.contentMappings !== null) {
      return this.contentMappings;
    }

    try {
      // In browser environment, try to fetch the mapping
      if (typeof window !== "undefined") {
        try {
          // Check if we have mappings in localStorage
          const storedMappings = localStorage.getItem("content-mappings");
          if (storedMappings) {
            this.contentMappings = JSON.parse(storedMappings);
            console.log(
              "Loaded content mappings from localStorage:",
              this.contentMappings
            );
            return this.contentMappings;
          }

          // If not in localStorage, try to fetch from server
          fetch("/content-mapping.json")
            .then((response) => response.json())
            .then((data) => {
              this.contentMappings = data;
              // Store for future use
              localStorage.setItem("content-mappings", JSON.stringify(data));
              console.log("Fetched and stored content mappings:", data);
            })
            .catch((err) => {
              console.warn("Could not load content mappings:", err);
            });
        } catch (e) {
          console.warn("Error loading content mappings:", e);
        }
      }
    } catch (e) {
      console.warn("Error in loadContentMappings:", e);
    }

    // Return empty mapping if none loaded
    return {};
  }

  /**
   * Resolve a content ID to a CID
   * If it's already a CID, return it as-is
   * If it's a named content ID (like "content-prize"), try to resolve it from mappings
   */
  private static resolveContentId(contentId: string): string {
    // If it already looks like a CID, return it without warning
    if (
      contentId.startsWith("bafy") ||
      contentId.startsWith("Qm") ||
      contentId.startsWith("bafkrei")
    ) {
      return contentId;
    }

    // Try to resolve from mappings
    const mappings = this.loadContentMappings();
    if (mappings && mappings[contentId]) {
      console.log(`Resolved ${contentId} to CID: ${mappings[contentId]}`);
      return mappings[contentId];
    }

    // If we can't resolve from our mappings, see if there's a mapping in localStorage
    // that hasn't been loaded into our static property yet (race condition)
    if (typeof window !== "undefined") {
      try {
        const storedMappings = localStorage.getItem("content-mappings");
        if (storedMappings) {
          const mappingsJson = JSON.parse(storedMappings);
          if (mappingsJson[contentId]) {
            console.log(
              `Resolved ${contentId} to CID from localStorage: ${mappingsJson[contentId]}`
            );
            // Update our static mappings with this value
            this.contentMappings = mappingsJson;
            return mappingsJson[contentId];
          }
        }
      } catch (e) {
        console.warn("Error checking localStorage mappings:", e);
      }
    }

    // If we still can't resolve, return the original
    console.warn(`Could not resolve content ID: ${contentId}`);
    return contentId;
  }

  /**
   * Clear the content mappings cache
   * This is useful when we want to force reloading mappings from the server
   * especially after uploading new content that would change the mappings
   */
  static clearContentMappingsCache(): void {
    console.log("Cleared content mappings cache");
    this.contentMappings = null;
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("content-mappings");
    }
  }

  /**
   * Clear the download cache
   */
  static clearDownloadCache(): void {
    console.log("Cleared download cache");
    this.downloadCache = {};
  }

  // Instance properties
  private initialized = false;
  private spaceDid: string;
  private uploadCount = 0;
  private downloadCount = 0;
  private listCount = 0;

  constructor(spaceDid?: string) {
    // If spaceDid is not provided, we'll rely on the server's spaceDid in private mode
    this.spaceDid = spaceDid || "";
  }

  /**
   * Initialize the client and verify connectivity
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log(
        "StorachaNetlifyClient initializing with spaceDid:",
        this.spaceDid
      );

      // Test API connectivity before proceeding
      const pingResult = await this.testConnection();

      if (!pingResult.success) {
        console.warn(
          "StorachaNetlifyClient initialization: Connection test failed:",
          pingResult.error
        );
        this.initialized = true; // Still mark as initialized to avoid repeated attempts
        return;
      }

      // Check if there's a mismatch between our spaceDid and the one from the server
      if (
        pingResult.details?.spaceDid &&
        pingResult.details.spaceDid !== this.spaceDid
      ) {
        console.warn(
          `SpaceDid mismatch. Client using: ${this.spaceDid}, Server using: ${pingResult.details.spaceDid}`
        );
        // If we're in private mode, use the server's spaceDid
        if (pingResult.mode === "private") {
          console.log(
            `Updating client spaceDid to match server: ${pingResult.details.spaceDid}`
          );
          this.spaceDid = pingResult.details.spaceDid;
        }
      }

      // Log additional information for troubleshooting
      if (pingResult.details) {
        console.log(
          "StorachaNetlifyClient connected successfully with mode:",
          pingResult.mode
        );
        console.log("Storacha backend details:", pingResult.details);
      }

      this.initialized = true;
      console.log(
        "StorachaNetlifyClient initialized with spaceDid:",
        this.spaceDid
      );
    } catch (error) {
      console.error("StorachaNetlifyClient initialization failed:", error);
      // Still mark as initialized to avoid repeated attempts
      this.initialized = true;
      // Don't throw, let operations attempt and fail individually
    }
  }

  /**
   * Check if the client is connected and working properly
   */
  isConnected(): boolean {
    return this.initialized;
  }

  /**
   * Upload agent data to Storacha via Netlify function
   */
  async uploadAgentData(
    agentId: string,
    category: ContestantCategory,
    fileName: string,
    content: string,
    reasoningSteps: string[] = []
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const agentData = {
        agentId,
        category,
        fileName,
        content,
        reasoning: reasoningSteps,
        timestamp: new Date().toISOString(),
      };

      // Convert to base64 for transmission
      const blob = new Blob([JSON.stringify(agentData)], {
        type: "application/json",
      });
      const base64Content = await this.blobToBase64(blob);

      // Call Netlify function to upload
      const response = await fetch(StorachaNetlifyClient.getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "upload",
          data: {
            spaceDid: this.spaceDid,
            content: base64Content,
            filename: fileName,
            contentType: "application/json",
            agentData: true,
            category: category,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        this.uploadCount++;

        // Check if we got mock data and flag it
        if (result.mock === true) {
          console.info("Received mock data from Storacha backend");
        }

        // Clear content mappings cache if this looks like a content file
        // This ensures we'll get the latest mapping next time we need to resolve content
        if (fileName.startsWith("content-") || fileName === "content") {
          console.log(
            `Clearing content mappings cache after uploading ${fileName}`
          );
          StorachaNetlifyClient.clearContentMappingsCache();
        }

        return result.cid;
      } else {
        throw new Error(result.error || "Unknown error during upload");
      }
    } catch (error: any) {
      console.error("Error uploading agent data:", error);
      throw error;
    }
  }

  /**
   * Download agent data from Storacha via Netlify function
   */
  async downloadAgentData(cid: string): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Resolve content ID to CID if necessary
    const resolvedCid = StorachaNetlifyClient.resolveContentId(cid);

    // Check cache first
    const cache = StorachaNetlifyClient.downloadCache[resolvedCid];
    if (
      cache &&
      Date.now() - cache.timestamp < StorachaNetlifyClient.CACHE_EXPIRATION
    ) {
      console.log(`Using cached data for CID: ${resolvedCid}`);
      return cache.data;
    }

    try {
      console.log(
        `StorachaNetlifyClient: Downloading data for CID: ${resolvedCid} (original: ${cid})`
      );

      // Try to download via Netlify function
      try {
        // Call Netlify function to download
        const response = await fetch(StorachaNetlifyClient.getApiUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "download",
            data: {
              spaceDid: this.spaceDid,
              cid: resolvedCid,
            },
          }),
        });

        if (!response.ok) {
          if (response.status === 500) {
            console.warn(
              `Server error downloading via Netlify function. Trying alternative methods...`
            );
            throw new Error(`Download failed with status: ${response.status}`);
          } else {
            throw new Error(`Download failed with status: ${response.status}`);
          }
        }

        const result = await response.json();

        if (result.success) {
          this.downloadCount++;
          console.log(
            `StorachaNetlifyClient: Successfully downloaded data for CID: ${resolvedCid}`
          );

          // Cache the result
          StorachaNetlifyClient.downloadCache[resolvedCid] = {
            data: result.content,
            timestamp: Date.now(),
          };

          return result.content;
        } else {
          console.error(
            `StorachaNetlifyClient: Download error from server:`,
            result.error
          );
          throw new Error(result.error || "Unknown error during download");
        }
      } catch (error) {
        // If the Netlify function failed, try public gateway as backup
        console.warn(
          "Netlify function download failed, trying public gateway..."
        );

        // Use a public gateway to fetch the content
        try {
          const gatewayUrl = `https://w3s.link/ipfs/${resolvedCid}`;
          console.log(`Attempting download via public gateway: ${gatewayUrl}`);

          const gatewayResponse = await fetch(gatewayUrl);

          if (!gatewayResponse.ok) {
            throw new Error(
              `Gateway download failed with status: ${gatewayResponse.status}`
            );
          }

          // Process the response
          const contentType = gatewayResponse.headers.get("Content-Type");
          let content;

          if (contentType && contentType.includes("application/json")) {
            content = await gatewayResponse.json();
          } else {
            // For non-JSON content, we'll get text and try to parse it
            const text = await gatewayResponse.text();
            try {
              content = JSON.parse(text);
            } catch (e) {
              // If it's not JSON, just return the text
              content = text;
            }
          }

          this.downloadCount++;
          console.log(
            `Successfully downloaded content via gateway for CID: ${resolvedCid}`
          );
          return content;
        } catch (gatewayError: any) {
          console.error("Public gateway download also failed:", gatewayError);
          throw error; // Re-throw the original error
        }
      }
    } catch (error: any) {
      console.error("Error downloading agent data:", error);

      // We'll retry once with a connection test to see if the issue is with connectivity
      try {
        const testResult = await this.testConnection();
        if (!testResult.success) {
          console.error("Connection test also failed:", testResult.error);
        } else {
          console.log(
            "Connection seems good, the issue might be with the specific CID:",
            resolvedCid
          );
        }
      } catch (testError) {
        console.error("Connection test threw an exception:", testError);
      }

      throw error;
    }
  }

  /**
   * Get knowledge base for a category
   */
  async getKnowledgeBaseForCategory(
    category: ContestantCategory
  ): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Call Netlify function to list uploads for this category
      const response = await fetch(StorachaNetlifyClient.getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "list",
          data: {
            spaceDid: this.spaceDid,
            category,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `List operation failed with status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success && result.results) {
        console.log(
          `Found ${result.results.length} documents for category ${category}`
        );

        // Process the results into knowledge base entries
        // We expect each result to potentially contain knowledge base text
        // This implementation will depend on your data structure
        const knowledgeBase = await Promise.all(
          result.results.map(async (item: any) => {
            try {
              // Download the content if we have a CID
              if (item.cid) {
                const content = await this.downloadAgentData(item.cid);
                // Extract relevant text for the knowledge base
                if (content && typeof content === "object") {
                  // If content has a text or data field, use that
                  return (
                    content.text || content.data || `Document ID: ${item.cid}`
                  );
                }
                return `Content from ${item.cid}`;
              }
              return `Document from ${category}`;
            } catch (e) {
              console.warn(`Error processing item ${item.cid}:`, e);
              return `Error retrieving document ${item.cid}`;
            }
          })
        );

        return knowledgeBase;
      }

      // No documents found
      return [];
    } catch (error) {
      console.error("Error getting knowledge base:", error);
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): { uploads: number; downloads: number } {
    return {
      uploads: this.uploadCount,
      downloads: this.downloadCount,
    };
  }

  /**
   * Get the space DID for diagnostics
   */
  getSpaceDid(): string {
    return this.spaceDid;
  }

  /**
   * Helper to convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Test the connection to Storacha
   * This attempts to perform a basic operation to verify connectivity
   */
  async testConnection(): Promise<StorachaTestResult> {
    try {
      // First check if Netlify Function is available
      const netlifyUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:8888/.netlify/functions/storacha-client"
          : "/api/storacha-client";

      // Test connection by checking if function responds to ping
      const response = await fetch(netlifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "ping",
          data: {
            spaceDid: this.spaceDid,
          },
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Storacha Netlify function returned status: ${response.status}`,
        };
      }

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          mode: result.mode,
          details: result.details || {},
        };
      } else {
        return {
          success: false,
          error: result.error || "Unknown error during connection test",
        };
      }
    } catch (error: any) {
      console.error("Error during Storacha connection test:", error);
      return {
        success: false,
        error: error.message || "Failed to connect to Storacha",
      };
    }
  }

  /**
   * List knowledge sources for a category
   */
  async listKnowledgeSources(category?: string): Promise<{
    sources: any[];
    nextCursor?: string;
    isMockData?: boolean;
    note?: string;
    error?: string;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(
        `StorachaNetlifyClient: Listing knowledge sources for category: ${
          category || "all"
        }`
      );

      // Call Netlify function to list
      const response = await fetch(StorachaNetlifyClient.getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "list",
          data: {
            spaceDid: this.spaceDid,
            category,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `List operation failed with status: ${response.status}`
        );
      }

      const result = await response.json();

      // Check if we got successful result
      if (result.success) {
        // If we have results array, process it
        if (result.results && Array.isArray(result.results)) {
          console.log(
            `Found ${result.results.length} documents for category ${
              category || "all"
            }`
          );

          // Process the results into knowledge base entries
          const sources = result.results.map((item: any) => ({
            cid: item.cid,
            timestamp: item.timestamp,
            category: item.category || category || "general",
          }));

          return {
            sources,
            nextCursor: result.nextCursor,
          };
        }
        // If we have spaces but no results (auth error fallback)
        else if (result.spaces && Array.isArray(result.spaces)) {
          console.log(
            `Found ${result.spaces.length} spaces but no documents. List capability may be limited.`
          );

          // Return an empty sources array with a note about space availability
          this.listCount++;
          return {
            sources: [],
            note: result.note || "List capability limited. No documents found.",
          };
        }
        // Otherwise return empty array
        else {
          return {
            sources: [],
            note: "No results available",
          };
        }
      } else {
        // If server reported failure
        throw new Error(result.error || "Unknown error during list operation");
      }
    } catch (error: any) {
      console.error("Error listing knowledge sources:", error);

      // Don't throw an error, just return empty array with the error info
      this.listCount++;
      return {
        sources: [],
        error: error.message,
        isMockData: true,
      };
    }
  }

  /**
   * Get current content mappings
   * This is useful for components that need to resolve content IDs to CIDs
   */
  async getContentMapping(
    queryString?: string
  ): Promise<Record<string, string>> {
    // First try to load from static property
    if (StorachaNetlifyClient.contentMappings) {
      return StorachaNetlifyClient.contentMappings;
    }

    // If not available, try to load from localStorage or fetch
    try {
      if (typeof window !== "undefined") {
        // Check localStorage first
        const storedMappings = localStorage.getItem("content-mappings");
        if (storedMappings) {
          const mappings = JSON.parse(storedMappings);
          StorachaNetlifyClient.contentMappings = mappings;
          return mappings;
        }

        // If not in localStorage, fetch from server
        try {
          // Add query string for cache busting if provided
          const url = queryString
            ? `/content-mapping.json?${queryString}`
            : "/content-mapping.json";
          const response = await fetch(url);
          if (response.ok) {
            const mappings = await response.json();
            StorachaNetlifyClient.contentMappings = mappings;
            localStorage.setItem("content-mappings", JSON.stringify(mappings));
            return mappings;
          }
        } catch (error) {
          console.warn("Error fetching content mappings:", error);
        }
      }
    } catch (error) {
      console.warn("Error getting content mappings:", error);
    }

    // Return empty object if we couldn't get mappings
    return {};
  }

  /**
   * Delete agent data from Storacha via Netlify function
   * Note: This will delete the content but cannot delete the actual IPFS CID as IPFS is immutable
   * However, it can update content mappings to remove references to the deleted content
   */
  async deleteAgentData(
    contentId: string,
    category: ContestantCategory
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(
        `StorachaNetlifyClient: Attempting to delete content: ${contentId}`
      );

      // Call Netlify function to delete
      const response = await fetch(StorachaNetlifyClient.getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          data: {
            spaceDid: this.spaceDid,
            contentId,
            category,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Delete operation failed with status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success) {
        console.log(
          `StorachaNetlifyClient: Successfully deleted content: ${contentId}`
        );

        // Clear content mappings cache to ensure we get fresh mappings
        StorachaNetlifyClient.clearContentMappingsCache();

        return true;
      } else {
        console.error(
          `StorachaNetlifyClient: Delete error from server:`,
          result.error
        );
        throw new Error(
          result.error || "Unknown error during delete operation"
        );
      }
    } catch (error: any) {
      console.error("Error deleting content:", error);
      throw error;
    }
  }
}
