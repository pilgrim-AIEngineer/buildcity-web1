import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import './index.css'
import App from './App.jsx'

// Over-the-air updates (customer app): confirm this web bundle booted, otherwise the updater
// rolls back to the previous bundle after its timeout. Harmless where updates are off.
if (Capacitor.isNativePlatform()) {
  CapacitorUpdater.notifyAppReady().catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
