import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { App } from './app/App'

// Standalone mode serves the same /slab/cidr URL space the shell uses, so all
// absolute intra-app links behave identically in both modes.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/slab/cidr/*" element={<App />} />
        <Route path="*" element={<Navigate to="/slab/cidr" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
