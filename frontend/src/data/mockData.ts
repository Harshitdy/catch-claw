export const NAV_TABS = [
  { label: 'Campaigns', path: '/campaigns' },
  { label: 'Leads', path: '/leads' },
  { label: 'AI Trainer', path: '/ai-trainer' },
] as const

export const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'] as const
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted'] as const

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-status-draft/10 text-status-draft',
  active: 'bg-status-active/10 text-status-active',
  paused: 'bg-status-paused/10 text-status-paused',
  completed: 'bg-status-completed/10 text-status-completed',
  new: 'bg-status-new/10 text-status-new',
  contacted: 'bg-status-contacted/10 text-status-contacted',
  qualified: 'bg-status-qualified/10 text-status-qualified',
  converted: 'bg-status-converted/10 text-status-converted',
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
