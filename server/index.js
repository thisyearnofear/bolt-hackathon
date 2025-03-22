import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { create } from "@web3-storage/w3up-client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Storacha client
let storachaClient = null;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Gemini chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, category, persona, history } = req.body;

    // Create chat context from persona
    const context = `You are an AI assistant for a hackathon platform. Your role is: ${
      persona.role
    }.
Background: ${persona.background}
Expertise: ${persona.expertise.join(", ")}
Context: ${persona.contextPrompt}

Please provide responses that are helpful, accurate, and aligned with your role as a ${category} expert.`;

    // Initialize chat
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        parts: msg.text,
      })),
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      text,
      reasoning: response.candidates?.[0]?.citationMetadata || [],
    });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({
      error: "Failed to generate response",
      details: error.message,
    });
  }
});

// Storacha endpoints
app.post("/api/storacha/init", async (req, res) => {
  try {
    storachaClient = await create();
    const spaces = await storachaClient.spaces();
    res.json({ success: true, spaces: spaces.map((s) => s.did()) });
  } catch (error) {
    console.error("Error initializing Storacha:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/storacha/upload", async (req, res) => {
  try {
    if (!storachaClient) {
      throw new Error("Storacha client not initialized");
    }
    const { content, filename } = req.body;
    const file = new File([Buffer.from(content, "base64")], filename);
    const cid = await storachaClient.uploadFile(file);
    res.json({ success: true, cid: cid.toString() });
  } catch (error) {
    console.error("Error uploading to Storacha:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/storacha/download", async (req, res) => {
  try {
    const { cid } = req.body;
    const response = await fetch(`https://w3s.link/ipfs/${cid}`);
    if (!response.ok) {
      throw new Error(`Gateway error: ${response.status}`);
    }
    const data = await response.arrayBuffer();
    res.json({
      success: true,
      content: Buffer.from(data).toString("base64"),
      contentType: response.headers.get("Content-Type"),
    });
  } catch (error) {
    console.error("Error downloading from Storacha:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
