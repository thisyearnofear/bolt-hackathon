// src/components/AgentChat.tsx
import { useEffect, useState, useRef } from "react";
import { AgentService } from "../lib/AgentService";
import { ContestantData, ChatMessage } from "../lib/ContestantData";
import "./AgentChat.css";

interface AgentChatProps {
  contestant: ContestantData | null;
  onClose: () => void;
  agentPosition?: { x: number; y: number } | null;
}

export function AgentChat({
  contestant,
  onClose,
  agentPosition,
}: AgentChatProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initializedAgent, setInitializedAgent] = useState(false);
  const [showReasoningDebug, setShowReasoningDebug] = useState(false);
  const [agentReasoning, setAgentReasoning] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute chat position based on agent's 3D position
  const chatStyle = agentPosition
    ? ({
        position: "absolute",
        left: `${agentPosition.x}px`,
        top: `${agentPosition.y - 300}px`, // Position above the agent
      } as React.CSSProperties)
    : {};

  // Initialize the chat history if not already present
  if (!contestant?.chatHistory) {
    contestant = {
      ...contestant,
      chatHistory: [],
    } as ContestantData;
  }

  // Initialize the AgentService when component mounts
  useEffect(() => {
    async function initializeAgent() {
      try {
        // Initialize with space DID from Storacha
        await AgentService.initialize(
          "did:key:z6Mkp1KcMzRud4kEFJmiZHFhcRGfpaUTr5GsQXBR6gYjB7fs"
        );
        console.log("Agent service initialized successfully");
        setInitializedAgent(true);
      } catch (error) {
        console.error("Failed to initialize agent service:", error);
      }
    }

    initializeAgent();
  }, []);

  // Send greeting message when chat is opened with a new agent
  useEffect(() => {
    // Only send greeting if the chat history is empty or if this is a different agent
    if (
      contestant?.aiPersona &&
      contestant.chatHistory &&
      contestant.chatHistory.length === 0 &&
      initializedAgent
    ) {
      sendGreeting();
    }

    // Scroll to bottom whenever chat history changes
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [contestant?.id, contestant?.chatHistory, initializedAgent]);

  // Handle sending a greeting message from the agent
  const sendGreeting = async () => {
    if (!contestant?.aiPersona || !contestant.chatHistory) return;

    const greetingMessage: ChatMessage = {
      sender: "agent",
      message: contestant.aiPersona.greeting,
      timestamp: Date.now(),
    };

    // Add greeting to chat history
    contestant.chatHistory.push(greetingMessage);

    // Force component to re-render
    setMessage("");
  };

  // Send a message to the agent
  const sendMessage = async () => {
    if (!message.trim() || !contestant?.aiPersona || !contestant.chatHistory)
      return;

    const userMessage: ChatMessage = {
      sender: "user",
      message: message.trim(),
      timestamp: Date.now(),
    };

    // Add user message to chat history
    contestant.chatHistory.push(userMessage);

    // Clear input and show loading state
    setMessage("");
    setIsLoading(true);

    try {
      // Send message to agent service
      const response = await AgentService.sendMessage(
        userMessage.message,
        contestant.category,
        contestant.aiPersona,
        contestant.chatHistory
      );

      // Add agent response to chat history
      const agentResponse: ChatMessage = {
        sender: "agent",
        message: response,
        timestamp: Date.now(),
      };

      contestant.chatHistory.push(agentResponse);

      // For debugging - in a real app, we'd get this from the LlamaIndex response
      setAgentReasoning([
        "Processed user query",
        "Retrieved information from knowledge base",
        "Synthesized response based on category expertise",
      ]);
    } catch (error) {
      console.error("Error getting agent response:", error);

      // Add error message to chat
      contestant.chatHistory.push({
        sender: "agent",
        message:
          "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending message on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle debugging view
  const toggleDebugging = () => {
    setShowReasoningDebug(!showReasoningDebug);
  };

  return (
    <div
      className="agent-chat-container"
      style={chatStyle}
      ref={chatContainerRef}
    >
      {/* Visual connector to agent if position is available */}
      {agentPosition && <div className="agent-chat-connector"></div>}

      <div className="agent-chat-header">
        <h3>{contestant?.aiPersona?.role || "AI Assistant"}</h3>
        <div className="agent-chat-controls">
          <button className="debug-button" onClick={toggleDebugging}>
            🐞
          </button>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      <div className="agent-chat-messages">
        {contestant?.chatHistory?.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${
              msg.sender === "user" ? "user-message" : "agent-message"
            }`}
          >
            <div className="message-content">{msg.message}</div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message agent-message">
            <div className="message-content typing-indicator">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showReasoningDebug && (
        <div className="agent-reasoning-debug">
          <h4>Agent Reasoning:</h4>
          <ol>
            {agentReasoning.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="agent-chat-input">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || message.trim() === ""}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
