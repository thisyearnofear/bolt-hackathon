import { create, type Client } from "@web3-storage/w3up-client";
import { ContestantCategory } from "../ContestantData";

export interface StorachaAgentData {
  agentId: string;
  category: ContestantCategory;
  inputs: string[]; // User queries and context
  outputs: string[]; // Agent responses
  chainOfThought: string[]; // Reasoning processes
  metadata: {
    // Configuration info
    model: string;
    temperature: number;
    knowledgeBase: string[];
  };
}

/**
 * Client for interacting with Storacha decentralized storage
 * Used to enable ensemble learning between AI agents
 */
export class StorachaClient {
  private client: Client | null = null;
  private spaceDid: string;
  private initialized = false;
  private uploadCount = 0;
  private downloadCount = 0;

  // Use the space DID from your existing space or create a new one
  constructor(
    spaceDid: string = "did:key:z6Mkp1KcMzRud4kEFJmiZHFhcRGfpaUTr5GsQXBR6gYjB7fs"
  ) {
    this.spaceDid = spaceDid;
  }

  /**
   * Initialize the Storacha client with the provided space DID
   */
  async initialize(agentDid?: string, delegation?: string): Promise<void> {
    if (this.initialized) {
      console.log("Storacha client already initialized");
      return;
    }

    try {
      // Create the actual web3.storage client
      this.client = await create();

      try {
        // Try to set the current space using the provided spaceDid
        if (this.spaceDid) {
          const spaces = await this.client.spaces();
          const space = spaces.find((s) => s.did() === this.spaceDid);

          if (space) {
            await this.client.setCurrentSpace(space.did());
            console.log("Connected to existing Storacha space:", this.spaceDid);
          } else {
            // If the space doesn't exist in the client, we need to add it
            // For now, we'll just log this - in production, we'd handle delegation
            console.log(
              "Space not found in client. Need proper delegation to access."
            );
          }
        }
      } catch (error) {
        console.warn("Could not set space, proceeding with default:", error);
      }

      this.initialized = true;
      console.log("Storacha client initialized with space:", this.spaceDid);
    } catch (error) {
      console.error("Failed to initialize Storacha client:", error);
      throw error;
    }
  }

  /**
   * Uploads agent data to Storacha
   */
  async uploadAgentData(
    agentId: string,
    category: ContestantCategory,
    inputQuery: string,
    outputResponse: string,
    reasoningSteps: string[] = []
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Create the data structure
      const agentData = {
        agentId,
        category,
        input: inputQuery,
        output: outputResponse,
        reasoning: reasoningSteps,
        timestamp: new Date().toISOString(),
      };

      // Convert to blob for upload
      const blob = new Blob([JSON.stringify(agentData)], {
        type: "application/json",
      });
      const file = new File(
        [blob],
        `agent-data-${agentId}-${Date.now()}.json`,
        { type: "application/json" }
      );

      // Upload using the client
      if (!this.client) {
        throw new Error("Storacha client not initialized");
      }

      // Use the uploadFile method from the Storacha client
      const uploadResult = await this.client.uploadFile(file);
      const cid = uploadResult.toString();
      this.uploadCount++;
      console.log(
        `Successfully uploaded agent data to Storacha with CID: ${cid}`
      );

      return cid;
    } catch (error) {
      console.error("Error in uploadAgentData:", error);
      throw error;
    }
  }

  /**
   * Downloads agent data from Storacha
   */
  async downloadAgentData(cid: string): Promise<StorachaAgentData | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      if (!this.client) {
        throw new Error("Storacha client not initialized");
      }

      // Retrieve data from Storacha using the public gateway
      const response = await fetch(`https://${cid}.ipfs.w3s.link`);
      if (!response.ok) {
        throw new Error(
          `Failed to retrieve data from gateway, status: ${response.status}`
        );
      }

      const data = await response.json();
      this.downloadCount++;
      console.log("Successfully retrieved data from Storacha:", data);
      return data;
    } catch (error) {
      console.error("Error retrieving data from Storacha:", error);
      throw error;
    }
  }

  /**
   * Retrieves knowledge base documents for a specific agent category
   */
  async getKnowledgeBaseForCategory(
    category: ContestantCategory
  ): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.client) {
      throw new Error("Storacha client not initialized");
    }

    try {
      // Query for documents matching this category
      console.log(`Retrieving knowledge base for ${category}`);

      // List uploads from the space
      const uploads = await this.client.capability.upload.list({
        size: 20,
      });

      console.log(`Found ${uploads.results.length} uploads in space`);

      // Filter for category-specific documents
      // You would need to implement metadata filtering based on your naming convention
      const categoryDocs = uploads.results
        .filter((upload) => {
          // Implement your filtering logic here
          // For example, check if the upload name contains the category
          return true; // For now, return all documents
        })
        .map((upload) => {
          // Extract text content from the upload
          // This would require fetching each document
          return `Document from CID: ${upload.root.toString()}`;
        });

      return categoryDocs;
    } catch (error) {
      console.error("Error querying knowledge base:", error);
      throw error;
    }
  }

  /**
   * Creates a new Storacha space for an agent if possible
   */
  async createAgentSpace(agentId: string): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.client) {
      console.warn("Client not initialized, can't create space");
      return null;
    }

    try {
      // Creating a space requires proper authentication/delegation in production
      // Here we're just logging that we'd create a space
      console.log(`Would create space for agent: ${agentId}`);

      // Return mock space DID
      return `did:key:z6Mk${Math.random()
        .toString(36)
        .substring(2, 10)}${agentId}`;
    } catch (error) {
      console.error("Error creating agent space:", error);
      return null;
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
   * Notifies other agents about new knowledge
   */
  async notifyAgentsOfUpdate(
    agentId: string,
    category: ContestantCategory
  ): Promise<void> {
    console.log(
      `Notifying other agents about update from ${agentId} in category ${category}`
    );
    // In production, we would have a notification mechanism
    // For now, this is just a placeholder
  }

  /**
   * Gets a list of all agent IDs for a specific category
   */
  async getAgentIdsForCategory(
    category: ContestantCategory
  ): Promise<string[]> {
    // In a real implementation, we would query Storacha for this information
    return [
      `${category}-agent-1`,
      `${category}-agent-2`,
      `${category}-agent-3`,
    ];
  }

  /**
   * Gets the most recent responses from other agents for a similar query
   */
  async getEnsembleInputsForQuery(
    query: string,
    excludeAgentId?: string
  ): Promise<{ agentId: string; response: string }[]> {
    // In a real implementation, this would search for similar queries
    return [
      {
        agentId: "prize-agent-1",
        response: "According to prize guidelines...",
      },
      {
        agentId: "sponsor-agent-2",
        response: "Sponsors can offer resources for...",
      },
      {
        agentId: "judge-agent-1",
        response: "Judges will evaluate based on...",
      },
    ].filter((item) => item.agentId !== excludeAgentId);
  }
}
