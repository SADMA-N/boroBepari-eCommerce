import { useState, useRef, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import { frequentlySearched } from '../data/mock-products'

interface SearchBarProps {
  initialValue?: string
  placeholder?: string
  onSearch?: (query: string) => void
  showSuggestions?: boolean
  className?: string
}

export default function SearchBar({
  initialValue = '',
  placeholder = 'Search for products, suppliers, or categories...',
  onSearch,
  showSuggestions = true,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Save search to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return

    const updated = [
      trimmed,
      ...recentSearches.filter((s) => s !== trimmed),
    ].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    saveRecentSearch(trimmed)
    setIsFocused(false)

    if (onSearch) {
      onSearch(trimmed)
    } else {
      navigate({ to: '/search', search: { q: trimmed } })
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    saveRecentSearch(suggestion)
    setIsFocused(false)

    if (onSearch) {
      onSearch(suggestion)
    } else {
      navigate({ to: '/search', search: { q: suggestion } })
    }
  }

  const clearSearch = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = showSuggestions && isFocused && !query

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search
            size={20}
            className="absolute left-4 text-gray-400 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800 placeholder-gray-400"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-20 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-md font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-orange-500 hover:text-orange-600"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700"
                  >
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div className="p-3">
            <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
              <TrendingUp size={12} />
              Trending Searches
            </span>
            <div className="flex flex-wrap gap-2">
              {frequentlySearched.slice(0, 6).map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(term)}
                  className="px-3 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 text-gray-700 text-sm rounded-full transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
