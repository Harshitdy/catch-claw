import { useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function getStoredId(key, prefix) {
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const generated = randomId(prefix)
  localStorage.setItem(key, generated)
  return generated
}

function App() {
  const [messages, setMessages] = useState([
    {
      id: randomId('m'),
      role: 'assistant',
      content:
        'Hi! Ask me to train your campaigns and I will fetch them as clickable options.',
      options: [],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const userId = useMemo(() => getStoredId('chat_user_id', 'user'), [])
  const sessionId = useMemo(() => getStoredId('chat_session_id', 'session'), [])

  async function sendMessage(message, selectedCampaignId = null) {
    if (!message.trim() || loading) return

    if (!selectedCampaignId) {
      setMessages((prev) => [
        ...prev,
        { id: randomId('m'), role: 'user', content: message, options: [] },
      ])
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          user_id: userId,
          session_id: sessionId,
          selected_campaign_id: selectedCampaignId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        {
          id: randomId('m'),
          role: 'assistant',
          content: data.reply,
          options: data.options ?? [],
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: randomId('m'),
          role: 'assistant',
          content: `Something went wrong: ${error.message}`,
          options: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(event) {
    event.preventDefault()
    const message = input.trim()
    if (!message) return
    setInput('')
    void sendMessage(message)
  }

  function onOptionClick(option) {
    setMessages((prev) => [
      ...prev,
      {
        id: randomId('m'),
        role: 'user',
        content: `Train campaign: ${option.label}`,
        options: [],
      },
    ])

    void sendMessage(
      `Please train campaign ${option.label}`,
      option.value,
    )
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Agentic Campaign Chatbot</h1>
        <p>OpenAI + Mem0 + Supabase</p>
      </header>

      <section className="chat-window">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <p>{message.content}</p>
            {message.options?.length > 0 && (
              <div className="options">
                {message.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onOptionClick(option)}
                    className="option-button"
                    disabled={loading}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      <form className="input-form" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask me to train your campaigns..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </main>
  )
}

export default App
