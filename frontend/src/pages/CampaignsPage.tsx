import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns'
import CampaignCard from '../components/campaigns/CampaignCard'
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal'

export default function CampaignsPage() {
  const { campaigns, loading, createCampaign, deleteCampaign } = useCampaigns()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface dark:text-dark-on-surface tracking-tight">Campaigns</h1>
          <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant mt-1">{campaigns.length} total campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-br from-primary to-[#0061ff] hover:opacity-90 transition-all">
          <Plus size={16} /> Create Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-on-surface-variant dark:text-dark-on-surface-variant">No campaigns yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} onDelete={deleteCampaign} />
          ))}
        </div>
      )}

      <CreateCampaignModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={createCampaign} />
    </div>
  )
}
