import { useCallback, useRef, useState } from 'react'
import { API_BASE_URL } from '../data/mockData'

export interface ChatOption {
  id: string
  label: string
  value: string
  action?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  options: ChatOption[]
}

type StreamEvent =
  | { type: 'final'; reply: string; options?: ChatOption[]; metadata?: Record<string, unknown> }
  | { type: 'delta'; text: string }
  | { type: 'done'; metadata?: Record<string, unknown> }

function parseSseBlocks(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = []
  const normalized = buffer.replace(/\r\n/g, '\n')
  const parts = normalized.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const block of parts) {
    for (const line of block.split('\n')) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const jsonStr = t.replace(/^data:\s*/, '')
      try {
        events.push(JSON.parse(jsonStr) as StreamEvent)
      } catch {
        /* skip malformed chunk */
      }
    }
  }
  return { events, rest }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! Ask me to train your campaigns and I will fetch them as clickable options.',
      options: [],
    },
  ])
  const [loading, setLoading] = useState(false)
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  /** Prevents overlapping /chat/stream calls — concurrent readers corrupt message state. */
  const streamBusyRef = useRef(false)

  const userId = (() => {
    let id = localStorage.getItem('chat_user_id')
    if (!id) {
      id = `user-${crypto.randomUUID()}`
      localStorage.setItem('chat_user_id', id)
    }
    return id
  })()

  const sessionId = (() => {
    let id = localStorage.getItem('chat_session_id')
    if (!id) {
      id = `session-${crypto.randomUUID()}`
      localStorage.setItem('chat_session_id', id)
    }
    return id
  })()

  const sendMessage = useCallback(
    async (message: string, selectedCampaignId?: string, opts?: { userAlreadyShown?: boolean }) => {
      if (!message.trim() || loading || streamBusyRef.current) return

      if (!opts?.userAlreadyShown) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'user', content: message, options: [] },
        ])
      }

      setLoading(true)
      streamBusyRef.current = true
      const assistantIdRef = { current: null as string | null }

      try {
        const res = await fetch(`${API_BASE_URL}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            message,
            user_id: userId,
            session_id: sessionId,
            selected_campaign_id: selectedCampaignId ?? null,
            campaign_id: activeCampaignId,
          }),
        })

        if (!res.ok) throw new Error(`Request failed: ${res.status}`)

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        const applyEvent = (payload: StreamEvent) => {
          if (payload.type === 'final') {
            const afterStream = payload.metadata?.after_stream === true
            if (afterStream && assistantIdRef.current) {
              const aid = assistantIdRef.current
              setMessages((prev) =>
                prev.map((m) => (m.id === aid ? { ...m, content: payload.reply } : m)),
              )
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: payload.reply,
                  options: payload.options ?? [],
                },
              ])
            }
            if (
              payload.metadata?.intent === 'campaign_selected' &&
              typeof payload.metadata?.campaign_id === 'string'
            ) {
              setActiveCampaignId(payload.metadata.campaign_id)
            }
            assistantIdRef.current = null
          } else if (payload.type === 'delta') {
            setMessages((prev) => {
              if (!assistantIdRef.current) {
                assistantIdRef.current = crypto.randomUUID()
                return [
                  ...prev,
                  {
                    id: assistantIdRef.current,
                    role: 'assistant',
                    content: payload.text,
                    options: [],
                  },
                ]
              }
              const aid = assistantIdRef.current
              return prev.map((m) =>
                m.id === aid ? { ...m, content: m.content + payload.text } : m,
              )
            })
          } else if (payload.type === 'done') {
            assistantIdRef.current = null
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const { events, rest } = parseSseBlocks(buffer)
          buffer = rest
          for (const payload of events) applyEvent(payload)
        }

        buffer += decoder.decode()
        const { events: tailEvents } = parseSseBlocks(buffer)
        for (const payload of tailEvents) applyEvent(payload)
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`,
            options: [],
          },
        ])
      } finally {
        streamBusyRef.current = false
        setLoading(false)
      }
    },
    [loading, userId, sessionId, activeCampaignId],
  )

  return {
    messages,
    setMessages,
    loading,
    sendMessage,
    activeCampaignId,
    setActiveCampaignId,
  }
}
