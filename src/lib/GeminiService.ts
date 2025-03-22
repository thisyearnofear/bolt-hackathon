import { AIPersona, ChatMessage, ContestantCategory } from "./ContestantData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface GeminiResponse {
  text: string;
  reasoning?: any[];
}

export class GeminiService {
  private static instance: GeminiService | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): GeminiService {
    if (!this.instance) {
      this.instance = new GeminiService();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Test connection to backend
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error("Backend health check failed");
      }
      this.isInitialized = true;
      console.log("Successfully connected to backend Gemini service");
    } catch (error) {
      console.error("Failed to initialize Gemini service:", error);
      throw new Error("Failed to initialize Gemini service");
    }
  }

  async generateResponse(
    message: string,
    category: ContestantCategory,
    persona: AIPersona,
    history: ChatMessage[]
  ): Promise<GeminiResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          category,
          persona,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from Gemini service");
      }

      const result = await response.json();
      return {
        text: result.text,
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }
}
