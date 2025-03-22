import { AIPersona, ChatMessage, ContestantCategory } from "./ContestantData";
import { LlamaIndexService } from "./storacha/LlamaIndexService";

// This is a placeholder - in a real implementation, you'd import the actual LlamaIndex TS modules
// import { OpenAIAgent, FunctionTool, SimpleDirectoryReader, VectorStoreIndex, QueryEngineTool } from "llamaindex";

// Simulated response delay (ms)
const RESPONSE_DELAY = 1000;

// Personality traits for different agent types
const PERSONALITY_TRAITS = {
  prize: ["helpful", "enthusiastic", "informative"],
  sponsor: ["technical", "supportive", "resourceful"],
  judge: ["analytical", "constructive", "fair"],
  contestant: ["collaborative", "strategic", "creative"],
};

// Knowledge bases for different agent types - this would be populated with actual document sources
const KNOWLEDGE_BASES = {
  prize: [
    "Prize Categories: AI/ML, Web3, Gaming, Mobile, Social Impact",
    "Grand Prize: $500k, AI Innovation: $200k, Web3 Future: $150k, Gaming Excellence: $100k, Social Impact: $50k",
    "Submission requirements include a 2-minute demo video, source code, and project description",
    "All submissions must be original work created during the hackathon period",
  ],
  sponsor: [
    "AWS offers $100,000 in cloud credits and technical support for projects using AWS services",
    "Google Cloud provides access to their ML APIs and $50,000 in cloud credits",
    "Microsoft offers Azure credits and mentorship from Microsoft engineers",
    "Meta provides access to their Reality Labs equipment for AR/VR projects",
    "OpenAI offers API credits for teams using their models innovatively",
  ],
  judge: [
    "Projects are evaluated on innovation (30%), technical complexity (25%), completeness (25%), and presentation (20%)",
    "Each submission will be reviewed by at least 3 judges",
    "Judges will provide written feedback for each project",
    "Previous winning projects demonstrated clear problem statements and innovative solutions",
    "Incomplete or non-functional projects will not be considered for prizes",
  ],
  contestant: [
    "Successful teams typically start with a clear MVP definition",
    "Teams should focus on a single core functionality that works well",
    "Documentation and clear explanations are key to judges understanding your work",
    "Teams are encouraged to leverage sponsor technologies where appropriate",
    "Preparing a compelling demo is crucial for the final presentation",
  ],
};

/**
 * Service for managing AI agent interactions
 * Integrates with LlamaIndex and Storacha for RAG and ensemble learning
 */
export class AgentService {
  private static llamaIndexService: LlamaIndexService | null = null;
  private static isInitializing = false;
  private static isInitialized = false;

  /**
   * Initialize the agent service with LlamaIndex and Storacha
   */
  static async initialize(spaceDid?: string): Promise<void> {
    if (this.isInitializing || this.isInitialized) {
      return;
    }

    this.isInitializing = true;

    try {
      // Initialize LlamaIndex service with the provided space DID
      this.llamaIndexService = new LlamaIndexService(spaceDid);
      await this.llamaIndexService.initialize();

      // Initialize the RAG system
      await this.llamaIndexService.initializeRagSystem();

      this.isInitialized = true;
      console.log(
        "AgentService initialized with LlamaIndex and Storacha integration"
      );
    } catch (error) {
      console.error("Failed to initialize AgentService:", error);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Send a message to an AI agent
   */
  static async sendMessage(
    message: string,
    category: ContestantCategory,
    persona: AIPersona,
    history: ChatMessage[]
  ): Promise<string> {
    // Ensure service is initialized
    if (!this.isInitialized && !this.isInitializing) {
      await this.initialize();
    }

    // Generate a unique agent ID based on category and persona
    const agentId = `${category}-${persona.role
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

    // If LlamaIndex service is available, use RAG with ensemble learning
    if (this.llamaIndexService && this.isInitialized) {
      console.log(`Using LlamaIndex RAG for agent response (${category})`);

      // Adding response delay to simulate network latency
      await new Promise((resolve) => setTimeout(resolve, RESPONSE_DELAY));

      try {
        // Generate response using RAG and ensemble learning
        const { response, reasoning } =
          await this.llamaIndexService.generateRagResponse(
            message,
            category,
            agentId
          );

        console.log(`Agent reasoning:`, reasoning);
        return response;
      } catch (error) {
        console.error("Error generating RAG response:", error);
        // Fall back to mock response if RAG fails
        return this.generateMockResponse(message, persona, history);
      }
    } else {
      // Fall back to mock response if LlamaIndex is not initialized
      console.log(`Using mock response generator (${category})`);
      return this.generateMockResponse(message, persona, history);
    }
  }

  /**
   * Generate a mock response (fallback if RAG is unavailable)
   */
  private static generateMockResponse(
    message: string,
    persona: AIPersona,
    history: ChatMessage[]
  ): string {
    // Simple keyword-based response system
    const lowercaseMessage = message.toLowerCase();

    // Check for greetings or introductions
    if (
      history.length <= 2 ||
      lowercaseMessage.includes("hello") ||
      lowercaseMessage.includes("hi") ||
      lowercaseMessage.includes("hey")
    ) {
      return `${persona.greeting} My expertise is in ${persona.expertise.join(
        ", "
      )}. How can I assist you?`;
    }

    // Check for category-specific topics based on expertise
    for (const area of persona.expertise) {
      const lowerArea = area.toLowerCase();
      if (lowercaseMessage.includes(lowerArea)) {
        return `Regarding ${area}, ${this.getSpecificResponse(
          lowerArea,
          persona.role
        )}`;
      }
    }

    // Default response if no specific matches
    return `As ${
      persona.role
    }, I can provide insights about ${persona.expertise.join(
      ", "
    )}. Could you clarify what specific information you're looking for?`;
  }

  /**
   * Helper method to generate specific responses based on expertise area
   */
  private static getSpecificResponse(area: string, role: string): string {
    // Sample responses for different expertise areas
    const responses: Record<string, string[]> = {
      "prize categories": [
        "we have several exciting prize tracks including AI/ML, Web3, Gaming, Mobile, and Social Impact.",
        "our Grand Prize is $500k, with additional prizes for AI Innovation ($200k), Web3 Future ($150k), and more.",
        "you can submit to multiple prize categories, but teams can only win one prize.",
      ],
      "submission guidelines": [
        "all submissions must include a working demo and source code repository.",
        "the deadline is September 30th at 11:59 PM PST, and no late submissions will be accepted.",
        "make sure to document your project well to help judges understand your implementation.",
      ],
      "technical resources": [
        "we offer various APIs and SDKs from our sponsors to accelerate your development.",
        "you have access to cloud credits from AWS, Google Cloud, and Microsoft Azure.",
        "our documentation hub has integration guides for all sponsor technologies.",
      ],
      "api integration": [
        "our sponsor APIs are well-documented with example code available in multiple languages.",
        "you can request technical support from sponsor representatives during the hackathon.",
        "the most successful projects typically leverage 2-3 sponsor technologies effectively.",
      ],
      "evaluation criteria": [
        "judges evaluate based on innovation (30%), technical difficulty (25%), implementation (25%), and potential impact (20%).",
        "a compelling demo significantly improves your chances of winning.",
        "previous winning projects scored an average of 85/100 across all criteria.",
      ],
      "project planning": [
        "successful teams typically allocate at least 25% of their time to planning before coding.",
        "consider creating a simple prototype first before implementing all features.",
        "regular team check-ins help keep everyone aligned on priorities.",
      ],
      "team coordination": [
        "establish clear roles based on team members' strengths early in the hackathon.",
        "use collaboration tools like GitHub, Figma, and Slack to stay organized.",
        "consider daily stand-ups to address blockers and align on priorities.",
      ],
    };

    // Find the closest matching area
    let matchedArea = "";
    for (const key of Object.keys(responses)) {
      if (area.includes(key) || key.includes(area)) {
        matchedArea = key;
        break;
      }
    }

    if (matchedArea && responses[matchedArea]) {
      // Return a random response from the matched area
      const areaResponses = responses[matchedArea];
      return areaResponses[Math.floor(Math.random() * areaResponses.length)];
    }

    // Default response if no specific match
    return `I can provide detailed information on this topic. Please let me know what specific aspect you'd like to know more about.`;
  }

  /**
   * Gets the appropriate category based on persona
   */
  private static getCategoryFromPersona(
    persona: AIPersona
  ): ContestantCategory {
    // Match persona to category based on role
    if (persona.role === "Prize Track Guide") return "prize";
    if (persona.role === "Sponsor Resources Guide") return "sponsor";
    if (persona.role === "Judging Criteria Advisor") return "judge";
    if (persona.role === "Team Collaboration Guide") return "contestant";

    // Default fallback
    return "contestant";
  }

  /**
   * Extract keywords from text for simple matching
   */
  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction - in a real implementation, you'd use NLP
    const stopWords = [
      "a",
      "an",
      "the",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "by",
      "is",
      "are",
      "am",
      "was",
      "were",
      "be",
      "been",
      "being",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "my",
      "your",
      "his",
      "her",
      "its",
      "our",
      "their",
      "this",
      "that",
      "these",
      "those",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "and",
      "but",
      "or",
      "nor",
      "so",
      "yet",
      "as",
      "if",
      "though",
      "until",
      "while",
    ];

    // Convert to lowercase, remove punctuation, split into words
    const words = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/);

    // Filter out stop words and short words
    return words
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Take top 5 keywords
  }
}
