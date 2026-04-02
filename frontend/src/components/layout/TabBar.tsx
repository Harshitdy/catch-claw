import { NavLink } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { NAV_TABS } from '../../data/mockData'

interface TabBarProps {
  readonly theme: 'light' | 'dark'
  readonly onToggleTheme: () => void
}

export default function TabBar({ theme, onToggleTheme }: TabBarProps) {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl transition-colors ${theme === 'dark' ? 'bg-dark-surface/80' : 'bg-surface/80'}`}>
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-lg tracking-tight">Catch Claw</span>
          <nav className="flex gap-1">
            {NAV_TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-dark-surface-high text-dark-primary'
                        : 'bg-primary/10 text-primary'
                      : theme === 'dark'
                        ? 'text-dark-on-surface-variant hover:bg-dark-surface-high'
                        : 'text-on-surface-variant hover:bg-surface-high'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-dark-surface-high text-dark-on-surface-variant' : 'hover:bg-surface-high text-on-surface-variant'}`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
