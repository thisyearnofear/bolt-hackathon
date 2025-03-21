# Interactive 3D with Three.js BatchedMesh and WebGPURenderer

This project is a built for the bolt.new world's largest hackathon & combines the recent `WebGPURenderer` from Three.js, as well as the use of the `BatchedMesh` object. It also features the use of some new version of the post-processing. The project is built using Vite and React.

## Installation

To get started, clone the repository and install the dependencies:
```sh
git clone https://github.com/thisyearnofear/bolt-hackathon
cd bolt-hackathon
npm install
```

## Build and Run
```sh
npm run dev
```
or
```sh
npm run build
```

## Code
Check the Demo.ts file for the demo code

## Features

### Current Implementation
- Utilizes the latest WebGPURenderer from Three.js (r169) for high-performance 3D graphics
- Implements BatchedMesh for efficient rendering of multiple contestant blocks
- Interactive 3D visualization of hackathon participants and their progress
- Dynamic theme switching with smooth dark/light mode transitions
- Responsive design with mobile-friendly controls
- Progressive Web App (PWA) support with installable capabilities

### Planned Features

#### AI Agent Integration
- Gemini-powered AI agents that emerge from the 3D blocks
- Interactive registration and onboarding assistance
- Real-time judging feedback and mentorship
- Dynamic block transformations using WebGPU shaders

#### Platform Features
- Real-time contestant progress tracking
- Interactive judging system
- Sponsor showcase integration
- Live mentorship sessions
- Virtual demo day presentations

### Technical Stack
- **Frontend**: React 18+ with TypeScript
- **3D Graphics**: Three.js with WebGPU
- **Build System**: Vite
- **AI Integration**: Google Gemini API (planned)
- **State Management**: React Context/Hooks

## Development

### Prerequisites
- Node.js 18+
- A WebGPU-capable browser (Chrome Canary or equivalent)
- GPU with WebGPU support

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build for production: `npm run build`

## Acknowledgements
- Codrops community for inspiration
- Bolt.new for an awesome initiative
- Three.js community for WebGPU implementation

## License
MIT
This project is licensed under the MIT License.