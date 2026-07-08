'use client'

import { useEffect } from 'react'
import { loadSettings } from '@/store/settingsStore'

export function ClientSideInit() {
  useEffect(() => {
    loadSettings()
  }, [])

  return null
}