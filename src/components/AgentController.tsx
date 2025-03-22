import { useState, useEffect } from "react";
import { Demo } from "../Demo";
import { AgentChat } from "./AgentChat";
import { ABlock } from "../lib/ABlock";
import { AgentService } from "../lib/AgentService";
import { ChatMessage } from "../lib/ContestantData";

interface AgentControllerProps {
  demo: Demo;
}

export function AgentController({ demo }: AgentControllerProps) {
  const [selectedBlock, setSelectedBlock] = useState<ABlock | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [agentScreenPosition, setAgentScreenPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Track 3D position and convert to screen coordinates
  useEffect(() => {
    if (!selectedBlock) return;

    // Set up an animation frame loop to track the position
    let animationFrameId: number;

    const trackPosition = () => {
      const position = demo.getAgentScreenPosition();
      if (position) {
        setAgentScreenPosition(position);
      }

      // Continue tracking as long as chat is open
      if (isChatOpen) {
        animationFrameId = requestAnimationFrame(trackPosition);
      }
    };

    // Start tracking
    trackPosition();

    // Clean up
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [demo, selectedBlock, isChatOpen]);

  // Connect to the demo's onBlockClick callback
  useEffect(() => {
    if (demo) {
      demo.onBlockClick = (block: ABlock) => {
        setSelectedBlock(block);
        setIsChatOpen(true);

        // Clear chat history if selecting a different block
        if (selectedBlock && selectedBlock.id !== block.id) {
          setChatHistory([]);
        }

        // Trigger the emerge animation on the agent
        demo.triggerAgentAnimation("idle");
      };
    }
  }, [demo, selectedBlock]);

  const handleCloseChat = () => {
    setIsChatOpen(false);
    // Return the active agent to its original position
    demo.returnActiveAgent();
    // Let the demo know we're closing the chat
    if (selectedBlock) {
      demo.onBlockClick = undefined;
      setSelectedBlock(null);
    }
    // Reset position tracking
    setAgentScreenPosition(null);
  };

  const handleSendMessage = async (message: string) => {
    if (
      !selectedBlock ||
      !selectedBlock.contestant ||
      !selectedBlock.contestant.aiPersona
    ) {
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      message,
      sender: "user",
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Trigger thinking animation
    demo.triggerAgentAnimation("thinking");

    try {
      // Get response from AI
      const persona = selectedBlock.contestant.aiPersona;
      const response = await AgentService.sendMessage(
        message,
        selectedBlock.contestant.category,
        persona,
        chatHistory
      );

      // Add agent response to chat
      const agentMessage: ChatMessage = {
        message: response,
        sender: "agent",
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, agentMessage]);

      // Add to contestant's chat history
      if (selectedBlock.contestant.chatHistory) {
        selectedBlock.contestant.chatHistory.push(userMessage);
        selectedBlock.contestant.chatHistory.push(agentMessage);
      }

      // Change animation to speaking briefly, then back to idle
      demo.triggerAgentAnimation("speaking");
      setTimeout(() => {
        demo.triggerAgentAnimation("idle");
      }, 2000);
    } catch (error) {
      console.error("Error getting agent response:", error);

      // Add error message to chat
      setChatHistory((prev) => [
        ...prev,
        {
          message: "Sorry, I'm having trouble connecting. Please try again.",
          sender: "agent",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (
    !selectedBlock ||
    !selectedBlock.contestant ||
    !selectedBlock.contestant.aiPersona
  ) {
    return null;
  }

  return (
    <AgentChat
      contestant={selectedBlock.contestant}
      onClose={handleCloseChat}
      agentPosition={agentScreenPosition}
    />
  );
}
