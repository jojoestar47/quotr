import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      const map = {}
      data?.forEach(row => { map[row.key] = row.value })
      setSettings(map)
      setLoading(false)
    })
  }, [])

  async function saveSetting(key, value) {
    await supabase.from('settings').update({ value }).eq('key', key)
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function saveAll(updates) {
    await Promise.all(Object.entries(updates).map(([key, value]) => saveSetting(key, value)))
  }

  return { settings, loading, saveSetting, saveAll }
}
