import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NeuronsProvider } from './components/neurons/NeuronsProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NeuronsProvider>
      <App />
    </NeuronsProvider>
  </StrictMode>,
)
