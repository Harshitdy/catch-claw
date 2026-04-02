import { useState } from 'react'
import Modal from '../shared/Modal'
import { CAMPAIGN_STATUSES } from '../../data/mockData'

interface CreateCampaignModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly onCreate: (data: { name: string; description?: string; status?: string }) => Promise<void>
}

export default function CreateCampaignModal({ open, onClose, onCreate }: CreateCampaignModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('draft')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onCreate({ name: name.trim(), description: description.trim() || undefined, status })
      setName(''); setDescription(''); setStatus('draft')
      onClose()
    } finally { setSubmitting(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Campaign">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Campaign Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter campaign name"
            required
            className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline dark:placeholder:text-dark-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline dark:placeholder:text-dark-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg bg-surface-low dark:bg-dark-surface-low px-3 py-2.5 text-sm text-on-surface dark:text-dark-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-high dark:hover:bg-dark-surface-high transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !name.trim()} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-br from-primary to-[#0061ff] hover:opacity-90 disabled:opacity-50 transition-all">
            {submitting ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
