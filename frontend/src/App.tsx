import { Routes, Route, Navigate } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import TabBar from './components/layout/TabBar'
import CampaignsPage from './pages/CampaignsPage'
import LeadsPage from './pages/LeadsPage'
import AITrainerPage from './pages/AITrainerPage'

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-dark-surface text-dark-on-surface' : 'bg-surface text-on-surface'}`}>
      <TabBar theme={theme} onToggleTheme={toggle} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/campaigns" replace />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/ai-trainer" element={<AITrainerPage />} />
        </Routes>
      </main>
    </div>
  )
}
