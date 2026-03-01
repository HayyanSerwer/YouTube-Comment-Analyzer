import { useState } from 'react'
import Comment from './Comment'

interface AnalyzerProps {
  URL: string
  comments: string[]
}

interface VADERResult {
  comment: string
  compound: number
  positive: number
  neutral: number
  negative: number
}

interface SWNResult {
  comment: string
  positive: number
  negative: number
  objective: number
}

type AnalysisMode = 'vader' | 'swn' | null

const PAGE_SIZE = 10

export default function Analyzer({ URL, comments }: AnalyzerProps) {
  const [vaderAnalysis, setVaderAnalysis] = useState<VADERResult[]>([])
  const [swnAnalysis, setSwnAnalysis] = useState<SWNResult[]>([])
  const [activeMode, setActiveMode] = useState<AnalysisMode>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(comments.length / PAGE_SIZE)
  const visibleComments = comments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const runVADER = async () => {
    if (visibleComments.length === 0) return
    setAnalyzing(true)
    setSwnAnalysis([])
    setActiveMode('vader')

    try {
      const response = await fetch('http://localhost:8000/analyze_comments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: visibleComments }),
      })
      if (!response.ok) throw new Error('Failed to analyze comments')
      const data = await response.json()
      setVaderAnalysis(data.analysis)
    } catch (error) {
      console.error('Error running VADER:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const runSWN = async () => {
    if (visibleComments.length === 0) return
    setAnalyzing(true)
    setVaderAnalysis([])
    setActiveMode('swn')

    try {
      const response = await fetch('http://localhost:8000/analyze_sentiwordnet/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: visibleComments }),
      })
      if (!response.ok) throw new Error('Failed to analyze comments')
      const data = await response.json()
      setSwnAnalysis(data.analysis)
    } catch (error) {
      console.error('Error running SentiWordNet:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const sentimentColor = (pos: number, neg: number) => {
    if (pos > neg && pos > 0.1) return 'text-green-400'
    if (neg > pos && neg > 0.1) return 'text-red-400'
    return 'text-yellow-400'
  }

  const sentimentLabel = (pos: number, neg: number) => {
    if (pos > neg && pos > 0.1) return 'Positive'
    if (neg > pos && neg > 0.1) return 'Negative'
    return 'Neutral'
  }

  return (
    <div className="flex flex-col items-center justify-start pt-12 pb-12 px-6">
      {URL && (
        <div className="mb-8 text-center">
          <p className="text-white/60 text-sm font-medium">Analyzing</p>
          <p className="text-white/90 text-base mt-1 break-all">{URL}</p>
        </div>
      )}

      <div className="w-full max-w-3xl">
        {comments.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-white/80 text-sm font-medium">Comments</h2>
              <span className="text-white/60 text-sm">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 max-h-96 overflow-y-auto">
              <ul className="space-y-3">
                {visibleComments.map((comment, index) => (
                  <Comment key={index} text={comment} number={page * PAGE_SIZE + index} />
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => { setPage(p => Math.max(0, p - 1)); setVaderAnalysis([]); setSwnAnalysis([]); setActiveMode(null) }}
                  disabled={page === 0}
                  className="px-3 py-1 rounded-lg text-xs text-white/70 bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
                >
                  ← Prev
                </button>
                <span className="text-white/50 text-xs">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setVaderAnalysis([]); setSwnAnalysis([]); setActiveMode(null) }}
                  disabled={page === totalPages - 1}
                  className="px-3 py-1 rounded-lg text-xs text-white/70 bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
            <p className="text-white/60 text-sm">No comments fetched yet.</p>
          </div>
        )}
      </div>

      {/* Analysis buttons */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={runVADER}
          disabled={analyzing || comments.length === 0}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
            activeMode === 'vader'
              ? 'bg-blue-500/40 text-blue-200 border border-blue-400/50 shadow-lg shadow-blue-500/20'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
          }`}
        >
          {analyzing && activeMode === 'vader' ? 'Analyzing...' : 'VADER Analysis'}
        </button>

        <button
          onClick={runSWN}
          disabled={analyzing || comments.length === 0}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
            activeMode === 'swn'
              ? 'bg-purple-500/40 text-purple-200 border border-purple-400/50 shadow-lg shadow-purple-500/20'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
          }`}
        >
          {analyzing && activeMode === 'swn' ? 'Analyzing...' : 'SentiWordNet Analysis'}
        </button>
      </div>

      {/* VADER Results */}
      {activeMode === 'vader' && vaderAnalysis.length > 0 && (
        <div className="mt-12 w-full max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <h3 className="text-white/80 text-sm font-medium">VADER Sentiment Analysis</h3>
            <span className="text-white/40 text-xs ml-auto">Page {page + 1}</span>
          </div>

          <div className="space-y-4">
            {vaderAnalysis.map((item, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-white/90 text-sm mb-3">{item.comment}</p>
                <div className="flex flex-wrap gap-4 text-xs text-white/60">
                  <span>👍 Pos: <strong className="text-white/80">{item.positive.toFixed(3)}</strong></span>
                  <span>😐 Neu: <strong className="text-white/80">{item.neutral.toFixed(3)}</strong></span>
                  <span>👎 Neg: <strong className="text-white/80">{item.negative.toFixed(3)}</strong></span>
                  <span>
                    Compound:{' '}
                    <strong className={item.compound > 0 ? 'text-green-400' : item.compound < 0 ? 'text-red-400' : 'text-yellow-400'}>
                      {item.compound.toFixed(3)}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SentiWordNet Results */}
      {activeMode === 'swn' && swnAnalysis.length > 0 && (
        <div className="mt-12 w-full max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <h3 className="text-white/80 text-sm font-medium">SentiWordNet Analysis</h3>
            <span className="text-white/40 text-xs ml-auto">Page {page + 1}</span>
          </div>

          <div className="space-y-4">
            {swnAnalysis.map((item, index) => (
              <div key={index} className="bg-white/5 border border-purple-400/10 rounded-xl p-4">
                <p className="text-white/90 text-sm mb-3">{item.comment}</p>

                {/* Score bars */}
                <div className="space-y-2 mb-3">
                  {[
                    { label: 'Positive', value: item.positive, color: 'bg-green-400' },
                    { label: 'Negative', value: item.negative, color: 'bg-red-400' },
                    { label: 'Objective', value: item.objective, color: 'bg-gray-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-white/50 text-xs w-16">{label}</span>
                      <div className="flex-1 bg-white/10 rounded-full h-1.5">
                        <div
                          className={`${color} h-1.5 rounded-full transition-all duration-500`}
                          style={{ width: `${(value * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span className="text-white/70 text-xs w-10 text-right">{(value * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs">
                  <span className="text-white/40">Overall: </span>
                  <strong className={sentimentColor(item.positive, item.negative)}>
                    {sentimentLabel(item.positive, item.negative)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}