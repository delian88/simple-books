import { StrictMode, startTransition } from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start/client'

startTransition(() => {
  const rootElement = document.getElementById('root');
  
  if (rootElement && !rootElement.innerHTML.trim()) {
    // SPA mode (empty root div)
    createRoot(rootElement).render(
      <StrictMode>
        <StartClient />
      </StrictMode>
    );
  } else {
    // SSR mode
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
    );
  }
})
