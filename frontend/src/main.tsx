import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router.tsx'
import { RouterProvider } from 'react-router-dom'
import { AppDataProvider } from './state/app-data-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppDataProvider>
      <RouterProvider router={router} />
    </AppDataProvider>
  </StrictMode>,
)
