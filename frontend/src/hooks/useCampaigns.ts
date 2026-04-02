import { useCallback, useEffect, useState } from 'react'
import { API_BASE_URL } from '../data/mockData'

export interface Campaign {
  id: string
  name: string
  description: string | null
  status: string
  lead_count: number
  created_at: string
  updated_at: string
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/`)
      if (res.ok) setCampaigns(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const createCampaign = async (data: { name: string; description?: string; status?: string }) => {
    const res = await fetch(`${API_BASE_URL}/campaigns/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create campaign')
    const created = await res.json()
    setCampaigns((prev) => [created, ...prev])
    return created as Campaign
  }

  const deleteCampaign = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/campaigns/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete campaign')
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  return { campaigns, loading, fetchCampaigns, createCampaign, deleteCampaign }
}
