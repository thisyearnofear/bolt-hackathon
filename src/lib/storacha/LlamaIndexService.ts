import { ContestantCategory } from "../ContestantData";
import { EnsembleLearningService } from "./EnsembleLearningService";
import { StorachaClient } from "./StorachaClient";

// This is a placeholder for the LlamaIndex.TS integration
// In a real implementation, we would import these from @llamaindex/core
interface Document {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

/**
 * Service to integrate LlamaIndex.TS with our Storacha-backed ensemble learning system
 */
export class LlamaIndexService {
  private ensembleLearningService: EnsembleLearningService;
  private storachaClient: StorachaClient;
  private initialized = false;

  constructor(spaceDid?: string) {
    this.storachaClient = new StorachaClient(spaceDid);
    this.ensembleLearningService = new EnsembleLearningService(spaceDid);
  }

  /**
   * Initialize the LlamaIndex service
   */
  async initialize(): Promise<void> {
    await this.storachaClient.initialize();
    await this.ensembleLearningService.initialize();
    this.initialized = true;
    console.log("LlamaIndex Service initialized");
  }

  /**
   * Creates documents from knowledge base entries
   */
  private createDocumentsFromKnowledge(
    knowledgeEntries: string[],
    category: ContestantCategory
  ): Document[] {
    return knowledgeEntries.map((text, index) => ({
      id: `${category}-doc-${index}`,
      text,
      metadata: {
        category,
        source: "storacha-knowledge-base",
        timestamp: new Date().toISOString(),
      },
    }));
  }

  /**
   * Retrieves documents for a specific category from Storacha
   */
  async getDocumentsForCategory(
    category: ContestantCategory
  ): Promise<Document[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const knowledgeBase = await this.storachaClient.getKnowledgeBaseForCategory(
      category
    );
    return this.createDocumentsFromKnowledge(knowledgeBase, category);
  }

  /**
   * Generates a response using the RAG approach
   * This combines knowledge base information with ensemble learning
   */
  async generateRagResponse(
    query: string,
    category: ContestantCategory,
    agentId: string
  ): Promise<{
    response: string;
    reasoning: string[];
    sourceDocuments: Document[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Start recording reasoning steps
    const reasoning: string[] = [
      `Processing query: "${query}"`,
      `Agent category: ${category}`,
      "Retrieving relevant documents from knowledge base",
    ];

    // Get documents from knowledge base
    const allDocuments = await this.getDocumentsForCategory(category);

    // Simple retrieval based on keyword matching
    const keywords = this.extractKeywords(query);
    const relevantDocuments = allDocuments.filter((doc) =>
      keywords.some((keyword) =>
        doc.text.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    reasoning.push(
      `Found ${
        relevantDocuments.length
      } relevant documents using keywords: ${keywords.join(", ")}`
    );

    // If no relevant documents found, broaden search
    let sourceDocuments = relevantDocuments;
    if (relevantDocuments.length === 0) {
      sourceDocuments = allDocuments.slice(0, 3); // Take first 3 as fallback
      reasoning.push(
        "No exact matches found, using general knowledge from category"
      );
    }

    // Get ensemble knowledge to enrich the response
    reasoning.push("Enriching with knowledge from other agent categories");
    const { response } =
      await this.ensembleLearningService.generateEnsembleResponse(
        query,
        category,
        agentId
      );

    // In a real implementation, we would use LlamaIndex to generate a response
    // based on the retrieved documents and ensemble knowledge

    return {
      response,
      reasoning,
      sourceDocuments,
    };
  }

  /**
   * Extract keywords from a query for document retrieval
   */
  private extractKeywords(text: string): string[] {
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
      .filter((word) => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5); // Take top 5 keywords
  }

  /**
   * Initializes the entire RAG system with documents from Storacha
   */
  async initializeRagSystem(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const categories: ContestantCategory[] = [
      "prize",
      "sponsor",
      "judge",
      "contestant",
    ];

    console.log("Initializing RAG system with knowledge from Storacha");

    // Load documents for each category
    const documentsByCategory: Record<ContestantCategory, Document[]> =
      {} as any;

    for (const category of categories) {
      documentsByCategory[category] = await this.getDocumentsForCategory(
        category
      );
      console.log(
        `Loaded ${documentsByCategory[category].length} documents for ${category} category`
      );
    }

    console.log("RAG system initialized successfully");
  }
}
