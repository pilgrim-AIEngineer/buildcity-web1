import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { isVendorApp } from './config/appMode'
import './index.css'
import App from './App.jsx'

// Over-the-air updates: strictly for Vendor/Partner app only (never for Customer app)
if (Capacitor.isNativePlatform() && isVendorApp) {
  import('@capgo/capacitor-updater')
    .then(({ CapacitorUpdater }) => {
      CapacitorUpdater.notifyAppReady().catch(() => {})
    })
    .catch(() => {})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
