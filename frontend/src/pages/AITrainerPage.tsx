import { useRef, useEffect, useState } from 'react'
import { Send, Loader2, Bot, User, Zap } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns'
import { useChat } from '../hooks/useChat'
import StatusBadge from '../components/shared/StatusBadge'
import ChatMarkdown from '../components/ai-trainer/ChatMarkdown'

export default function AITrainerPage() {
  const { campaigns } = useCampaigns()
  const { messages, setMessages, loading, sendMessage, activeCampaignId, setActiveCampaignId } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleOptionClick = (option: { label: string; value: string }) => {
    setActiveCampaignId(option.value)
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: option.label, options: [] },
    ])
    sendMessage(`Train campaign: ${option.label}`, option.value, { userAlreadyShown: true })
  }

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId)

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Campaign Selector */}
      <div className="w-80 shrink-0 flex flex-col">
        <h2 className="text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant mb-3">Select Campaign to Train</h2>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCampaignId(c.id); sendMessage(`I want to train on campaign: ${c.name}`, c.id) }}
              className={`w-full text-left rounded-xl p-4 transition-all ${
                activeCampaignId === c.id
                  ? 'bg-primary/10 ring-2 ring-primary dark:bg-dark-primary/10 dark:ring-dark-primary'
                  : 'bg-white dark:bg-dark-surface-container hover:bg-surface-low dark:hover:bg-dark-surface-low'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-on-surface dark:text-dark-on-surface truncate">{c.name}</span>
                <StatusBadge status={c.status} />
              </div>
              <span className="text-xs text-on-surface-variant dark:text-dark-on-surface-variant">{c.lead_count} leads</span>
            </button>
          ))}
          {campaigns.length === 0 && (
            <p className="text-sm text-on-surface-variant dark:text-dark-on-surface-variant text-center py-8">No campaigns found. Create one first.</p>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col rounded-xl bg-white dark:bg-dark-surface-container overflow-hidden">
        <div className="px-5 py-3 bg-surface-low dark:bg-dark-surface-low flex items-center gap-3">
          <Zap size={16} className="text-primary dark:text-dark-primary" />
          <span className="font-medium text-sm text-on-surface dark:text-dark-on-surface">
            {activeCampaign ? `Training: ${activeCampaign.name}` : 'AI Trainer'}
          </span>
          {activeCampaign && <StatusBadge status="active" />}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-surface-high dark:bg-dark-surface-high flex items-center justify-center">
                  <Bot size={14} className="text-primary dark:text-dark-primary" />
                </div>
              )}
              <div className={`${msg.role === 'user' ? 'max-w-[75%] order-first' : 'max-w-[min(100%,42rem)]'}`}>
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white ml-auto'
                      : 'bg-surface-high dark:bg-dark-surface-high text-on-surface dark:text-dark-on-surface'
                  }`}
                >
                  <ChatMarkdown content={msg.content} isUser={msg.role === 'user'} />
                </div>
                {msg.options.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3 w-full max-w-md">
                    {msg.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleOptionClick(opt)}
                        disabled={loading}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium bg-primary/10 text-primary dark:bg-dark-primary/10 dark:text-dark-primary hover:bg-primary/20 dark:hover:bg-dark-primary/20 transition-colors disabled:opacity-50 border border-primary/15 dark:border-dark-primary/20"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-surface-high dark:bg-dark-surface-high flex items-center justify-center">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="rounded-xl px-4 py-2.5 bg-surface-high dark:bg-dark-surface-high">
                <Loader2 size={16} className="animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-3 bg-surface-low dark:bg-dark-surface-low flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to train your campaigns..."
            disabled={loading}
            className="flex-1 rounded-lg bg-white dark:bg-dark-surface px-4 py-2.5 text-sm text-on-surface dark:text-dark-on-surface placeholder:text-outline dark:placeholder:text-dark-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-lg bg-gradient-to-br from-primary to-[#0061ff] text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
