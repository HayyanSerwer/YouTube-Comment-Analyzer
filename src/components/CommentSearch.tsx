import { useState, useEffect, useRef } from 'react'

interface CommentSearchProps {
  URL: string
  comments: string[]
}

interface SearchResult {
  rank: number
  comment: string
  hybrid_score: number
  semantic_score: number
  bm25_score: number
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function CommentSearch({ URL, comments }: CommentSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    if (!debouncedQuery.trim() || comments.length === 0) {
      setResults([])
      return
    }

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const doSearch = async () => {
      setSearching(true)
      setError('')
      try {
        const response = await fetch('http://localhost:8000/search_comments/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: debouncedQuery,
            comments,
            top_k: 10,
            semantic_weight: 0.7,
          }),
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setResults(data.results)
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Something went wrong. Is the backend running?')
        }
      } finally {
        setSearching(false)
      }
    }

    doSearch()
  }, [debouncedQuery, comments])

  return (
    <div className="flex flex-col items-center justify-start pt-12 pb-12 px-6">

      <div className="w-full max-w-2xl">

        {/* Search input */}
        <div className="relative mb-8">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={comments.length === 0 ? 'Fetch comments first...' : 'Search by meaning...'}
            disabled={comments.length === 0}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/25 disabled:opacity-40 transition-all duration-150"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {searching ? (
              <div className="w-3.5 h-3.5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Empty states */}
        {comments.length === 0 && (
          <p className="text-white/30 text-sm text-center mt-8">No comments fetched yet.</p>
        )}

        {comments.length > 0 && !query && (
          <p className="text-white/20 text-xs text-center">{comments.length} comments ready to search</p>
        )}

        {error && <p className="text-red-400/70 text-xs text-center">{error}</p>}

        {query && !searching && results.length === 0 && comments.length > 0 && (
          <p className="text-white/30 text-sm text-center mt-8">No results for "{query}"</p>
        )}

        {/* Results table */}
        {results.length > 0 && (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[2rem_1fr_5rem_5rem_5rem] gap-x-4 px-3 mb-2">
              <span className="text-white/25 text-xs">#</span>
              <span className="text-white/25 text-xs">Comment</span>
              <span className="text-white/25 text-xs text-right">Semantic</span>
              <span className="text-white/25 text-xs text-right">BM25</span>
              <span className="text-white/25 text-xs text-right">Hybrid</span>
            </div>

            <div className="border border-white/8 rounded-xl overflow-hidden divide-y divide-white/5">
              {results.map((result) => (
                <div
                  key={result.rank}
                  className="grid grid-cols-[2rem_1fr_5rem_5rem_5rem] gap-x-4 px-3 py-3 hover:bg-white/4 transition-colors duration-100"
                >
                  <span className="text-white/20 text-xs font-mono self-start pt-0.5">{result.rank}</span>

                  <p className="text-white/80 text-xs leading-relaxed self-start">{result.comment}</p>

                  <span className="text-white/50 text-xs font-mono text-right self-start pt-0.5">
                    {(result.semantic_score * 100).toFixed(1)}%
                  </span>

                  <span className="text-white/50 text-xs font-mono text-right self-start pt-0.5">
                    {(result.bm25_score * 100).toFixed(1)}%
                  </span>

                  <span className="text-white/80 text-xs font-mono text-right self-start pt-0.5 font-medium">
                    {(result.hybrid_score * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            <p className="text-white/20 text-xs mt-3 text-right">
              hybrid = semantic × 0.7 + bm25 × 0.3
            </p>
          </div>
        )}

      </div>
    </div>
  )
}