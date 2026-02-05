import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-400 ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={20} className="transition-all" />
      ) : (
        <Moon size={20} className="transition-all" />
      )}
    </button>
  )
}
