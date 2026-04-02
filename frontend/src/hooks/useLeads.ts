import { useCallback, useEffect, useState } from 'react'
import { API_BASE_URL } from '../data/mockData'

export interface Lead {
  id: string
  campaign_id: string
  first_name: string
  last_name: string | null
  email: string
  company: string | null
  phone: string | null
  notes: string | null
  status: string
  created_at: string
}

export function useLeads(campaignId?: string) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLeads = useCallback(async (cId?: string) => {
    const id = cId ?? campaignId
    if (!id) { setLeads([]); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/campaigns/${id}/leads`)
      if (res.ok) setLeads(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [campaignId])

  useEffect(() => { if (campaignId) fetchLeads() }, [campaignId, fetchLeads])

  const createLead = async (cId: string, data: Record<string, string | undefined>) => {
    const res = await fetch(`${API_BASE_URL}/campaigns/${cId}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create lead')
    const created = await res.json()
    setLeads((prev) => [created, ...prev])
    return created as Lead
  }

  const deleteLead = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/leads/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete lead')
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  return { leads, loading, fetchLeads, createLead, deleteLead }
}
