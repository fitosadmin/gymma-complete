import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* Font pipeline (D13): Inter wght + Archivo wght+wdth —
   the wdth axis at 125% is Archivo Expanded. */
import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/archivo/wdth.css'

import './index.css'
import App from './App.tsx'
import { MotionProvider } from './lib/motion.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>,
)
