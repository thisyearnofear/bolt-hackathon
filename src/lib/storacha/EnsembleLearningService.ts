import { ContestantCategory } from "../ContestantData";
import { StorachaClient } from "./StorachaClient";

/**
 * Service to manage ensemble learning between multiple agents
 * Coordinates the sharing of knowledge and insights across agent categories
 */
export class EnsembleLearningService {
  private storachaClient: StorachaClient;
  private initialized = false;

  constructor(spaceDid?: string) {
    this.storachaClient = new StorachaClient(spaceDid);
  }

  /**
   * Initialize the ensemble learning service
   */
  async initialize(): Promise<void> {
    await this.storachaClient.initialize();
    this.initialized = true;
    console.log("Ensemble Learning Service initialized");
  }

  /**
   * Share knowledge from one agent to others
   * Records the input, output, and reasoning to Storacha
   */
  async shareAgentKnowledge(
    agentId: string,
    category: ContestantCategory,
    inputQuery: string,
    outputResponse: string,
    reasoningSteps: string[] = []
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Upload the agent's knowledge
    const cid = await this.storachaClient.uploadAgentData(
      agentId,
      category,
      inputQuery,
      outputResponse,
      reasoningSteps
    );

    // Notify other agents of the new knowledge
    await this.storachaClient.notifyAgentsOfUpdate(agentId, category);

    return cid;
  }

  /**
   * Gets ensemble knowledge from multiple agents to inform a response
   * This is the core of our hot ensemble learning approach
   */
  async getEnsembleKnowledge(
    query: string,
    primaryCategory: ContestantCategory,
    currentAgentId: string
  ): Promise<{
    primaryKnowledge: string[];
    supportingResponses: { agentId: string; response: string }[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Get primary knowledge for the main agent category
    const primaryKnowledge =
      await this.storachaClient.getKnowledgeBaseForCategory(primaryCategory);

    // Get supporting responses from other agents
    const supportingResponses =
      await this.storachaClient.getEnsembleInputsForQuery(
        query,
        currentAgentId
      );

    return {
      primaryKnowledge,
      supportingResponses,
    };
  }

  /**
   * Synthesize a response based on primary and supporting knowledge
   * This creates a more comprehensive and accurate response using insights from multiple agents
   */
  synthesizeResponse(
    query: string,
    primaryKnowledge: string[],
    supportingResponses: { agentId: string; response: string }[],
    category: ContestantCategory
  ): string {
    // In a real implementation, this would use LlamaIndex to generate a coherent response
    // For now, we'll use a simple template-based approach

    // Extract the most relevant pieces of knowledge
    const relevantKnowledge = primaryKnowledge.filter((knowledge) =>
      query
        .toLowerCase()
        .split(" ")
        .some(
          (word) => word.length > 3 && knowledge.toLowerCase().includes(word)
        )
    );

    // Start with primary knowledge
    let response = "";
    if (relevantKnowledge.length > 0) {
      response = `Based on our ${category} information: ${relevantKnowledge.join(
        " "
      )}`;
    } else {
      response = `As your ${category} advisor, I can tell you that `;
    }

    // Incorporate supporting perspectives
    if (supportingResponses.length > 0) {
      response += "\n\nOther experts have added:";
      supportingResponses.forEach(
        ({ agentId, response: supportingResponse }) => {
          response += `\n- ${supportingResponse}`;
        }
      );
    }

    // Add a helpful closing
    response += `\n\nHow can I further assist you with your ${category} questions?`;

    return response;
  }

  /**
   * Generate a complete ensemble response
   * This is the main method that clients will use
   */
  async generateEnsembleResponse(
    query: string,
    category: ContestantCategory,
    agentId: string
  ): Promise<{
    response: string;
    reasoning: string[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Record the reasoning steps
    const reasoning: string[] = [
      `Received query: "${query}"`,
      `Primary agent category: ${category}`,
      "Gathering knowledge from multiple sources",
    ];

    // Get ensemble knowledge
    const { primaryKnowledge, supportingResponses } =
      await this.getEnsembleKnowledge(query, category, agentId);

    reasoning.push(
      `Retrieved ${primaryKnowledge.length} pieces of primary knowledge`
    );
    reasoning.push(
      `Retrieved ${supportingResponses.length} supporting responses from other agents`
    );

    // Synthesize response
    const response = this.synthesizeResponse(
      query,
      primaryKnowledge,
      supportingResponses,
      category
    );

    reasoning.push("Synthesized final response from multiple perspectives");

    // Store the full interaction in Storacha
    await this.shareAgentKnowledge(
      agentId,
      category,
      query,
      response,
      reasoning
    );

    return {
      response,
      reasoning,
    };
  }
}
