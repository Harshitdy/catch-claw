import { Trash2, Users } from 'lucide-react'
import type { Campaign } from '../../hooks/useCampaigns'
import StatusBadge from '../shared/StatusBadge'

interface CampaignCardProps {
  readonly campaign: Campaign
  readonly onDelete: (id: string) => void
}

export default function CampaignCard({ campaign, onDelete }: CampaignCardProps) {
  return (
    <div className="rounded-xl bg-white dark:bg-dark-surface-container p-5 transition-all hover:shadow-[0_8px_32px_rgba(25,28,30,0.06)] group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-on-surface dark:text-dark-on-surface truncate pr-4">{campaign.name}</h3>
        <StatusBadge status={campaign.status} />
      </div>
      {campaign.description && (
        <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant mb-4 line-clamp-2">{campaign.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          <Users size={14} />
          <span>{campaign.lead_count} leads</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-outline dark:text-dark-outline">{new Date(campaign.created_at).toLocaleDateString()}</span>
          <button
            onClick={() => onDelete(campaign.id)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
