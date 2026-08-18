// Custom client entry: use createRoot instead of hydrateRoot
// This avoids React hydration mismatches in dev mode that prevent
// event handlers from being attached to SSR-rendered elements.
import { StrictMode, startTransition } from 'react'
import { createRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'

startTransition(() => {
  // Clear the SSR-rendered HTML and do a clean client-side render
  createRoot(document.body).render(
    <StrictMode>
      <StartClient />
    </StrictMode>,
  )
})
