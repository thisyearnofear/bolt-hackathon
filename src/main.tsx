import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ThreeCanvas from './components/threeCanvas.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThreeCanvas />
    <App />
  </StrictMode>,
)
