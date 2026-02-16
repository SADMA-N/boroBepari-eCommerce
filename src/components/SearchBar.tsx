import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Clock, Loader2, Search, TrendingUp, X } from 'lucide-react'
import { frequentlySearched } from '../data/mock-products'
import { api } from '@/api/client'
import { formatBDT } from '@/lib/format'

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
  const [recentSearches, setRecentSearches] = useState<Array<string>>([])
  const [suggestions, setSuggestions] = useState<Array<any>>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
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

  // Debounced autocomplete fetch
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSuggestions([])
      setIsLoadingSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    let cancelled = false

    const timer = setTimeout(async () => {
      try {
        const results = await api.products.suggestions(trimmed)
        if (!cancelled) {
          setSuggestions(results)
        }
      } catch {
        if (!cancelled) {
          setSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSuggestions(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

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

  const performSearch = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
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

  const handleProductSuggestionClick = (suggestion: any) => {
    setIsFocused(false)
    navigate({ to: '/products/$productSlug', params: { productSlug: suggestion.slug } })
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

  const showRecentAndTrending = showSuggestions && isFocused && !query.trim()
  const showAutocompleteSuggestions = showSuggestions && isFocused && !!query.trim()

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search
            size={20}
            className="absolute left-4 text-muted-foreground pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-20 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
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

      {/* Recent & Trending Dropdown */}
      {showRecentAndTrending && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 z-50 overflow-hidden transition-colors">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Clock
                      size={14}
                      className="text-gray-400 dark:text-gray-500"
                    />
                    <span className="text-sm">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div className="p-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1 mb-2 tracking-wider">
              <TrendingUp size={12} />
              Trending Searches
            </span>
            <div className="flex flex-wrap gap-2">
              {frequentlySearched.slice(0, 6).map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(term)}
                  className="px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-400 text-gray-700 dark:text-gray-300 text-sm rounded-full transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {showAutocompleteSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 z-50 overflow-hidden transition-colors">
          {isLoadingSuggestions ? (
            <div className="flex items-center gap-2 p-4 text-gray-500 dark:text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="py-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleProductSuggestionClick(suggestion)}
                    className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {suggestion.image ? (
                      <img
                        src={suggestion.image}
                        alt={suggestion.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Search size={16} className="text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-100 truncate">
                        {suggestion.name}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        {formatBDT(suggestion.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={performSearch}
                className="w-full px-3 py-2.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 font-medium border-t border-gray-100 dark:border-slate-800 transition-colors"
              >
                See all results for &ldquo;{query.trim()}&rdquo;
              </button>
            </>
          ) : (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
              No products found for &ldquo;{query.trim()}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
