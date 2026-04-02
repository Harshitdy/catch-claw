import { useState } from 'react'
import { Plus, Loader2, Trash2, Mail, Phone, Building2 } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns'
import { useLeads } from '../hooks/useLeads'
import AddLeadModal from '../components/leads/AddLeadModal'
import StatusBadge from '../components/shared/StatusBadge'

export default function LeadsPage() {
  const { campaigns } = useCampaigns()
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const { leads, loading, fetchLeads, createLead, deleteLead } = useLeads(selectedCampaign || undefined)
  const [showAdd, setShowAdd] = useState(false)

  const handleCampaignChange = (id: string) => {
    setSelectedCampaign(id)
    if (id) fetchLeads(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface dark:text-dark-on-surface tracking-tight">Leads</h1>
          <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant mt-1">{leads.length} leads {selectedCampaign ? 'in this campaign' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCampaign}
            onChange={(e) => handleCampaignChange(e.target.value)}
            className="rounded-lg bg-white dark:bg-dark-surface-container px-3 py-2 text-sm text-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-br from-primary to-[#0061ff] hover:opacity-90 transition-all">
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {!selectedCampaign ? (
        <div className="text-center py-20">
          <p className="text-on-surface-variant dark:text-dark-on-surface-variant">Select a campaign to view its leads.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-on-surface-variant dark:text-dark-on-surface-variant">No leads in this campaign. Add your first one!</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-dark-surface-container overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-low dark:bg-dark-surface-low">
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 dark:divide-dark-outline-variant/20">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface-low dark:hover:bg-dark-surface-low transition-colors">
                  <td className="px-4 py-3 font-medium text-on-surface dark:text-dark-on-surface">{lead.first_name} {lead.last_name ?? ''}</td>
                  <td className="px-4 py-3 text-on-surface-variant dark:text-dark-on-surface-variant">
                    <span className="inline-flex items-center gap-1"><Mail size={12} />{lead.email}</span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant dark:text-dark-on-surface-variant">
                    {lead.company ? <span className="inline-flex items-center gap-1"><Building2 size={12} />{lead.company}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant dark:text-dark-on-surface-variant">
                    {lead.phone ? <span className="inline-flex items-center gap-1"><Phone size={12} />{lead.phone}</span> : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteLead(lead.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddLeadModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={createLead}
        campaigns={campaigns}
        defaultCampaignId={selectedCampaign}
      />
    </div>
  )
}
