'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    beTracker?: {
      t: (config: { hash: string }) => void
    }
  }
}

export default function MetricoolTracking() {
  useEffect(() => {
    // Only load in production or if explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_METRICOOL_HASH) {
      return
    }

    const hash = process.env.NEXT_PUBLIC_METRICOOL_HASH || '1f5dd17474272b2df4a75d0d65e3f25c'

    const loadScript = () => {
      const head = document.getElementsByTagName('head')[0]
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://tracker.metricool.com/resources/be.js'
      script.onload = () => {
        if (window.beTracker) {
          window.beTracker.t({ hash })
        }
      }
      head.appendChild(script)
    }

    loadScript()
  }, [])

  return null
}
