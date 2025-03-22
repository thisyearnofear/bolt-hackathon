# Hackathon.AI - Interactive 3D Hackathon Platform with Multi-Agent RAG System

This project serves as a template for hackathon organizers to quickly deploy an immersive, agent-enabled hackathon landing page. Built with React, Three.js WebGPU, and LlamaIndex.TS, it provides a 3D visualization of hackathon participants, sponsors, prizes, and judges, with specialized AI agents to assist participants throughout their journey.

## Current Implementation

- **Immersive 3D Environment**: Utilizes WebGPURenderer and BatchedMesh for high-performance 3D visualization
- **Multi-Agent System**: Specialized AI agents for prizes, sponsors, judges, and contestants
- **RAG-Powered Knowledge Base**: LlamaIndex.TS integration for context-aware responses
- **Interactive Chat Interface**: Positioned dynamically near 3D agents with visual connector
- **Specialized Agent Knowledge**: Each agent category has dedicated expertise and data sources
- **Responsive Design**: Mobile-friendly with dynamic theme switching
- **Decentralized Storage**: Storacha integration for agent knowledge sharing and ensemble learning
- **User Registration**: Complete contestant registration form with Storacha storage
- **Project Submission**: Project submission form with GitHub integration
- **Netlify Serverless Functions**: Secure API key storage and server-side operations
- **Admin Dashboard**: Dedicated interface for organizers to manage the hackathon

## Latest Updates

- **✅ Admin Dashboard**: Added a comprehensive admin interface for hackathon organizers
- **✅ Knowledge Base Manager**: Implemented a tool for managing RAG knowledge sources for agents
- **✅ Contestant Registration System**: Added a comprehensive registration form for hackathon participants
- **✅ Project Submission Flow**: Implemented a project submission form with validation and storage
- **✅ Serverless Functions**: Added Netlify functions to securely handle Storacha operations
- **✅ Improved UI/UX**: Enhanced modal system and responsive layout
- **✅ Storacha Integration**: Connected front-end with serverless backend for secure storage operations
- **✅ Usage Statistics**: Added real-time Storacha usage tracking

## Installation

To get started, clone the repository and install the dependencies:

```sh
git clone https://github.com/thisyearnofear/bolt-hackathon
cd bolt-hackathon
npm install
```

## Build and Run

For development with hot reloading:

```sh
npm run dev
```

For production build:

```sh
npm run build
```

For Netlify Functions local development:

```sh
npm run netlify
```

## Admin Dashboard

The project includes a dedicated admin dashboard for hackathon organizers, accessible at `/admin`. This dashboard provides various tools for managing the hackathon:

1. **Knowledge Base Manager**: Add URLs and documents to the RAG knowledge base for agent learning
2. **Contestant Management**: View and manage registered teams
3. **Project Submissions**: Review and evaluate submitted projects
4. **Storacha Statistics**: Monitor storage usage and operations

### Knowledge Base Management

The Knowledge Base Manager allows organizers to:

- Add website URLs as knowledge sources for specific agent categories
- Upload documents (PDF, TXT, etc.) to be processed and added to the knowledge base
- Assign knowledge sources to specific categories (Prizes, Sponsors, Judges, etc.)
- Remove outdated or irrelevant knowledge sources
- Track the status of knowledge source processing

All knowledge sources are stored in Storacha for persistence and can be shared across agent categories through ensemble learning mechanisms.

```typescript
// Example of how knowledge sources are structured
const knowledgeSource = {
  url: "https://example.com/docs/prizes",
  category: "prize",
  description: "Information about the $50K main prize",
  status: "processed",
};
```

## Netlify Functions Implementation

The project now includes Netlify functions to securely handle Storacha operations:

```typescript
// netlify/functions/storacha-client.ts
import { Handler } from "@netlify/functions";
import { create, type Client } from "@web3-storage/w3up-client";

// Initialize Storacha client
let _client: Client | null = null;

const handler: Handler = async (event, context) => {
  // Parse the request
  const { action, data } = JSON.parse(event.body || "{}");

  // Initialize the client if needed
  if (!_client) {
    _client = await create();
    // Set up authentication...
  }

  // Handle different actions
  switch (action) {
    case "upload":
      return await handleUpload(data);
    case "download":
      return await handleDownload(data);
    // Other actions...
  }
};

export { handler };
```

## Moving from Simulation to Production

The current implementation now includes real Storacha client interactions through Netlify functions. The integration works as follows:

```typescript
// In StorachaNetlifyClient.ts
async uploadAgentData(...): Promise<string> {
  // Create the data structure
  const agentData = { agentId, category, input: inputQuery, ... };

  // Convert to base64 for transmission
  const blob = new Blob([JSON.stringify(agentData)], { type: "application/json" });
  const base64Content = await this.blobToBase64(blob);

  // Call Netlify function to upload
  const response = await fetch("/api/storacha-client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upload",
      data: { content: base64Content, filename: `agent-data-${agentId}-${Date.now()}.json` }
    })
  });

  const result = await response.json();
  return result.cid;
}
```

## Security Considerations

We've implemented several security measures:

### API Key Protection

All API keys and sensitive credentials are now stored server-side in Netlify functions:

```typescript
// Environment variables are set in Netlify dashboard, not exposed to client
const STORACHA_SPACE_DID = process.env.STORACHA_SPACE_DID;
```

### Data Validation

All user inputs are validated before processing:

```typescript
// Form validation in ContestantRegistration and ProjectSubmission components
if (!formData.name || !formData.teamName || !formData.projectDescription) {
  throw new Error("Please fill in all required fields");
}

if (formData.twitterHandle && !formData.twitterHandle.startsWith("@")) {
  setFormData((prev) => ({ ...prev, twitterHandle: `@${prev.twitterHandle}` }));
}
```

### Error Handling

Comprehensive error handling throughout the application:

```typescript
try {
  // API operations
} catch (error) {
  console.error("Operation failed:", error);
  // User-friendly error messages
  setError(error.message || "An error occurred");
}
```

## Development Roadmap

### Current Progress

- ✅ 3D visualization with WebGPU and BatchedMesh
- ✅ Agent chat interface positioned relative to 3D elements
- ✅ Agent categories with specialized knowledge bases
- ✅ RAG implementation with LlamaIndex.TS integration
- ✅ Category-specific persona and response generation
- ✅ Storacha integration for agent knowledge sharing
- ✅ Ensemble learning between specialized agents
- ✅ Improved UI/UX with responsive design
- ✅ Dynamic chat positioning near 3D agents
- ✅ Contestant registration system with Storacha storage
- ✅ Project submission system with GitHub integration
- ✅ Netlify serverless functions for secure operations
- ✅ Admin dashboard for hackathon management
- ✅ Knowledge base management for RAG system
- ✅ Transition from mock data to real Storacha storage
- ✅ Content mapping to resolve content IDs to actual CIDs
- ✅ Diagnostics tools for Storacha troubleshooting

### Ready for Testing

- 🧪 Serverless functions for Storacha operations
- 🧪 Registration and submission flows
- 🧪 Integration between front-end and serverless backend
- 🧪 Content initialization and automatic loading

### Next Steps

1. **Testing and Debugging** (1-2 days)

   - Test content loading and conversion/parsing
   - Test agents with real knowledge from Storacha
   - Ensure proper error handling across all flows
   - Validate end-to-end process from content creation to retrieval

2. **Admin Dashboard Enhancements** (2-3 days)

   - Add analytics dashboard for contestant engagement
   - Implement team approval workflow
   - Add knowledge base effectiveness metrics
   - Create visualization for agent-contestant interactions

3. **Deployment and Scaling** (2-3 days)
   - Set up automated CI/CD pipeline with Netlify
   - Optimize for performance at scale
   - Implement monitoring and analytics

## License

MIT
This project is licensed under the MIT License.

## Setting up Storacha for Production

Hackathon Bolt uses Storacha (web3.storage) for decentralized storage. For production use, you need to set up a proper Storacha space and credentials:

### Automated Setup

We've provided an automated setup script that will guide you through the process:

```bash
npm run setup-storacha
```

This script will:

1. Check/install the w3cli tool
2. Help you create or use an existing Storacha space
3. Generate proper credentials
4. Configure your environment variables
5. Test the setup with a sample upload

### Manual Setup

If you prefer to manually set up Storacha, please refer to the [STORACHA_SETUP.md](./STORACHA_SETUP.md) file for detailed instructions.

### Important Notes

- Never commit your private keys or proofs to version control
- For production, add the environment variables to your Netlify settings
- Always test your storage setup before deploying to production

For more details, run the setup script or refer to the setup guide.
