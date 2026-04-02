import { useState } from 'react'
import Modal from '../shared/Modal'
import type { Campaign } from '../../hooks/useCampaigns'

interface AddLeadModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly onAdd: (campaignId: string, data: Record<string, string | undefined>) => Promise<void>
  readonly campaigns: Campaign[]
  readonly defaultCampaignId?: string
}

export default function AddLeadModal({ open, onClose, onAdd, campaigns, defaultCampaignId }: AddLeadModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [campaignId, setCampaignId] = useState(defaultCampaignId ?? '')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => { setFirstName(''); setLastName(''); setEmail(''); setCompany(''); setPhone(''); setNotes('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !email.trim() || !campaignId) return
    setSubmitting(true)
    try {
      await onAdd(campaignId, {
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      reset()
      onClose()
    } finally { setSubmitting(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Lead">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">First Name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="John" className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="john@example.com" className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Campaign</label>
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} required className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            <option value="">Select a campaign</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-high dark:hover:bg-dark-surface-high transition-colors">Cancel</button>
          <button type="submit" disabled={submitting || !firstName.trim() || !email.trim() || !campaignId} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-br from-primary to-[#0061ff] hover:opacity-90 disabled:opacity-50 transition-all">
            {submitting ? 'Adding...' : 'Add Lead'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
