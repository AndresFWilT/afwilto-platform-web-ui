import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.tsx'

// Standalone mode serves the same /finance URL space the host uses, so all
// absolute intra-app links behave identically in both modes.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/finance/*" element={<App />} />
        <Route path="*" element={<Navigate to="/finance" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
