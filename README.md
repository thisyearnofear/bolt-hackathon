# Interactive 3D Hackathon Platform with Multi-Agent RAG System

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
- **Production Security**: Comprehensive security headers and CORS configuration
- **Content Mapping System**: Efficient CID resolution and caching system

## Latest Updates

- **✅ Production Security**: Added comprehensive security headers and CORS configuration
- **✅ Serverless Functions**: Production-ready Netlify functions with proper bundling
- **✅ Content Mapping**: Optimized content refresh system with 5-minute cache
- **✅ Error Handling**: Enhanced error handling and user feedback
- **✅ Admin Dashboard**: Production-ready admin interface with diagnostics
- **✅ Storage Integration**: Fully tested Storacha integration with proper error handling
- **✅ Performance**: Optimized content loading and caching strategies
- **✅ Monitoring**: Added detailed logging and diagnostics tools

## Deployment

### Prerequisites

1. **Netlify Account**: Create an account at [Netlify](https://www.netlify.com)
2. **API Keys**: Generate new API keys for:
   - OpenAI
   - Google Gemini
3. **Storacha Setup**: Run the setup script:
   ```sh
   npm run setup-storacha
   ```

### Environment Variables

Set these in your Netlify dashboard (Settings > Environment variables):

```env
NODE_ENV=production
GEMINI_API_KEY=your_new_key
OPENAI_API_KEY=your_new_key
STORACHA_SPACE_DID=your_space_did
STORACHA_PRIVATE_KEY=your_private_key
STORACHA_PROOF=your_proof
PRODUCTION_URL=your_netlify_url
```

### Deployment Steps

1. **Connect to GitHub**:

   ```sh
   # Initialize git if haven't already
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Deploy to Netlify**:

   - Connect your repository in Netlify dashboard
   - Or deploy via Netlify CLI:
     ```sh
     netlify deploy --prod
     ```

3. **Verify Configuration**:

   - Check security headers are applied
   - Verify environment variables are set
   - Test Storacha connectivity
   - Confirm function deployment

4. **Post-Deployment**:
   - Visit the admin dashboard (/admin)
   - Run the diagnostics tool
   - Initialize content mappings
   - Test agent interactions

### Production Checks

Use the built-in diagnostics tool to verify:

- Storacha connectivity
- Content mapping functionality
- API key validity
- Function deployment status

Access the diagnostics via Admin Dashboard > Database > Diagnostics.

## Current Progress

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
- ✅ Production-ready security configuration
- ✅ Serverless functions with proper bundling
- ✅ Registration and submission flows
- ✅ Integration between front-end and serverless backend
- ✅ Content initialization and automatic loading

### Next Steps

1. **Monitoring and Analytics** (2-3 days)

   - Implement detailed usage analytics
   - Add performance monitoring
   - Set up error tracking
   - Create dashboard for system health

2. **Feature Enhancements** (3-4 days)

   - Add batch operations for content management
   - Implement advanced caching strategies
   - Add export/import functionality
   - Create backup/restore tools

3. **Documentation** (1-2 days)
   - Create detailed deployment guide
   - Document all admin features
   - Add troubleshooting guide
   - Create user manual

## License

MIT
This project is licensed under the MIT License.

## Setting up Storacha for Production

Hackathon Bolt uses Storacha (web3.storage) for decentralized storage. For production use, you need to set up a proper Storacha space and credentials:

### Important Notes About Data Persistence

- **Public Data** 🌎: All data uploaded to Storacha is available to anyone who requests it using the correct CID. Do not store any private or sensitive information in an unencrypted form.

- **Permanent Data** ♾️: Data uploaded to Storacha is designed to be permanent. Even after "removing" files:

  - Data may persist on the IPFS network indefinitely
  - Storacha retains data for a minimum of 30 days
  - Other nodes may keep copies of the data
  - Do not use for data that needs permanent deletion

- **Content Management**:
  - You can remove content CIDs from your account listing
  - Optionally remove associated storage shards
  - This only affects visibility in your account, not data availability
  - There's a minimum 30-day retention period

### Automated Setup

We've provided an automated setup script that will guide you through the process:

```

```
