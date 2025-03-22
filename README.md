# Interactive 3D Hackathon Platform with Multi-Agent RAG System

This project serves as a template for hackathon organizers to quickly deploy an immersive, agent-enabled hackathon landing page. Built with React, Three.js WebGPU, and Express, it provides a 3D visualization of hackathon participants, sponsors, prizes, and judges, with specialized AI agents to assist participants throughout their journey.

## Current Implementation

- **Immersive 3D Environment**: Utilizes WebGPURenderer and BatchedMesh for high-performance 3D visualization
- **Multi-Agent System**: Specialized AI agents for prizes, sponsors, judges, and contestants
- **RAG-Powered Knowledge Base**: Gemini integration for context-aware responses
- **Interactive Chat Interface**: Positioned dynamically near 3D agents with visual connector
- **Specialized Agent Knowledge**: Each agent category has dedicated expertise and data sources
- **Responsive Design**: Mobile-friendly with dynamic theme switching
- **Decentralized Storage**: Storacha integration for agent knowledge sharing and ensemble learning
- **User Registration**: Complete contestant registration form with Storacha storage
- **Project Submission**: Project submission form with GitHub integration
- **Express Backend**: Secure API key storage and server-side operations
- **Admin Dashboard**: Dedicated interface for organizers to manage the hackathon
- **Production Security**: Comprehensive security headers and CORS configuration
- **Content Mapping System**: Efficient CID resolution and caching system

## Latest Updates

- **✅ Express Backend**: Replaced Netlify functions with Express backend
- **✅ Gemini Integration**: Direct Gemini API integration with proper error handling
- **✅ Storacha Setup**: Simplified Storacha configuration with base64 proof
- **✅ Security**: Enhanced security with proper CORS and headers
- **✅ Performance**: Optimized content loading and caching strategies
- **✅ Monitoring**: Added detailed logging and diagnostics tools

## Setup

### Prerequisites

1. **Node.js**: Install Node.js 18 or later
2. **API Keys**: Generate new API keys for:
   - Google Gemini
   - Storacha (web3.storage)

### Environment Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/hackathon-bolt.git
   cd hackathon-bolt
   ```

2. **Install dependencies**:

   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   ```

3. **Configure environment variables**:

   Create `server/.env`:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # API Keys
   GEMINI_API_KEY=your_gemini_api_key

   # URLs
   LOCAL_URL=http://localhost:5173
   PRODUCTION_URL=your_production_url

   # Storacha Configuration
   STORACHA_SPACE_DID=your_space_did
   STORACHA_PRIVATE_KEY=your_private_key
   STORACHA_PROOF=your_base64_encoded_proof
   ```

   Create `.env.local` in the root directory:

   ```env
   VITE_API_URL=http://localhost:3000
   ```

### Running the Project

1. **Start the backend**:

   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend** (in another terminal):

   ```bash
   cd ..  # Back to project root
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - Admin Dashboard: http://localhost:5173/admin

### Production Deployment

1. **Build the frontend**:

   ```bash
   npm run build
   ```

2. **Deploy the backend**:

   - Set up your production server (e.g., DigitalOcean, AWS)
   - Configure environment variables
   - Use PM2 or similar for process management:
     ```bash
     npm install -g pm2
     cd server
     pm2 start npm --name "hackathon-bolt" -- start
     ```

3. **Deploy the frontend**:
   - Deploy the `dist` directory to your static hosting service
   - Update `VITE_API_URL` to point to your production backend

### Verifying Setup

Use the built-in diagnostics tool to verify:

1. Visit the admin dashboard (/admin)
2. Go to Database > Diagnostics
3. Run the diagnostics tool to check:
   - Backend connectivity
   - Gemini API integration
   - Storacha connectivity
   - Environment configuration

## Current Progress

- ✅ Express backend with proper error handling
- ✅ Gemini integration for chat responses
- ✅ Storacha integration with base64 proof
- ✅ Improved security and performance
- ✅ Enhanced diagnostics and monitoring

### Next Steps

1. **Monitoring and Analytics** (2-3 days)

   - Add detailed usage analytics
   - Set up error tracking
   - Create dashboard for system health

2. **Feature Enhancements** (3-4 days)

   - Add batch operations for content
   - Implement advanced caching
   - Add export/import functionality

3. **Documentation** (1-2 days)
   - Update deployment guide
   - Document all admin features
   - Create troubleshooting guide

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
