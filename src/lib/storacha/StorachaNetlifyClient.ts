import { ContestantCategory } from "../ContestantData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

interface UsageStats {
  uploads: number;
  downloads: number;
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

  // Instance properties
  private spaceDid: string | null = null;
  private isConnected: boolean = false;
  private uploadCount = 0;
  private downloadCount = 0;
  private listCount = 0;
  private static usageStats: UsageStats = {
    uploads: 0,
    downloads: 0,
  };

  constructor(spaceDid?: string) {
    this.spaceDid = spaceDid || null;
  }

  /**
   * Initialize the client and verify connectivity
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/storacha/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spaceDid: this.spaceDid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize Storacha client");
      }

      const result = await response.json();
      if (result.success) {
        this.isConnected = true;
        if (!this.spaceDid && result.spaces?.length > 0) {
          this.spaceDid = result.spaces[0];
        }
      }
    } catch (error) {
      console.error("Error initializing Storacha client:", error);
      throw error;
    }
  }

  /**
   * Upload agent data to Storacha via Netlify function
   */
  async uploadAgentData(
    type: string,
    category: ContestantCategory,
    name: string,
    content: string,
    tags: string[] = []
  ): Promise<string> {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/storacha/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: Buffer.from(content).toString("base64"),
          filename: name,
          metadata: {
            type,
            category,
            tags,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload data");
      }

      const result = await response.json();
      if (result.success) {
        StorachaNetlifyClient.usageStats.uploads++;
        return result.cid;
      }
      throw new Error("Upload failed");
    } catch (error) {
      console.error("Error uploading data:", error);
      throw error;
    }
  }

  /**
   * Download agent data from Storacha via Netlify function
   */
  async downloadAgentData(cid: string): Promise<any> {
    if (!this.isConnected) {
      await this.initialize();
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/storacha/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cid }),
      });

      if (!response.ok) {
        throw new Error("Failed to download data");
      }

      const result = await response.json();
      if (result.success) {
        StorachaNetlifyClient.usageStats.downloads++;
        const content = Buffer.from(result.content, "base64").toString();
        try {
          return JSON.parse(content);
        } catch {
          return content;
        }
      }
      throw new Error("Download failed");
    } catch (error) {
      console.error("Error downloading data:", error);
      throw error;
    }
  }

  /**
   * Get knowledge base for a category
   */
  async getKnowledgeBaseForCategory(
    category: ContestantCategory
  ): Promise<string[]> {
    if (!this.isConnected) {
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
  getUsageStats(): UsageStats {
    return { ...StorachaNetlifyClient.usageStats };
  }

  /**
   * Get the space DID for diagnostics
   */
  getSpaceDid(): string | null {
    return this.spaceDid;
  }

  /**
   * Test the connection to Storacha
   * This attempts to perform a basic operation to verify connectivity
   */
  async testConnection(): Promise<StorachaTestResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return { success: response.ok };
    } catch (error) {
      console.error("Connection test failed:", error);
      return { success: false };
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
    if (!this.isConnected) {
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
    if (!this.isConnected) {
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

  isStorageConnected(): boolean {
    return this.isConnected;
  }

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
}
