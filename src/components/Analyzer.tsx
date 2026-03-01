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
      if (!response.ok) throw new Error('Failed')
      const data = await response.json()
      setVaderAnalysis(data.analysis)
    } catch (error) {
      console.error(error)
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
      if (!response.ok) throw new Error('Failed')
      const data = await response.json()
      setSwnAnalysis(data.analysis)
    } catch (error) {
      console.error(error)
    } finally {
      setAnalyzing(false)
    }
  }

  const sentimentLabel = (pos: number, neg: number) => {
    if (pos > neg && pos > 0.1) return 'Positive'
    if (neg > pos && neg > 0.1) return 'Negative'
    return 'Neutral'
  }

  return (
    <div className="flex flex-col items-center pt-12 pb-12 px-6">
      {URL && (
        <p className="text-white/40 text-xs mb-8 break-all max-w-2xl text-center">{URL}</p>
      )}

      <div className="w-full max-w-2xl">
        {comments.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-xs">Comments</span>
              <span className="text-white/30 text-xs">{comments.length} total</span>
            </div>

            <div className="bg-white/5 border border-white/8 rounded-xl p-4 max-h-80 overflow-y-auto">
              <ul className="space-y-2">
                {visibleComments.map((comment, index) => (
                  <Comment key={index} text={comment} number={page * PAGE_SIZE + index} />
                ))}
              </ul>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => { setPage(p => Math.max(0, p - 1)); setVaderAnalysis([]); setSwnAnalysis([]); setActiveMode(null) }}
                  disabled={page === 0}
                  className="text-white/40 text-xs hover:text-white/70 disabled:opacity-20 transition"
                >
                  ← Prev
                </button>
                <span className="text-white/30 text-xs">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setVaderAnalysis([]); setSwnAnalysis([]); setActiveMode(null) }}
                  disabled={page === totalPages - 1}
                  className="text-white/40 text-xs hover:text-white/70 disabled:opacity-20 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/30 text-sm text-center">No comments fetched yet.</p>
        )}

        {/* Buttons */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={runVADER}
            disabled={analyzing || comments.length === 0}
            className={`px-4 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-30 ${
              activeMode === 'vader'
                ? 'border-white/30 text-white bg-white/10'
                : 'border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
            }`}
          >
            {analyzing && activeMode === 'vader' ? 'Analyzing...' : 'VADER'}
          </button>

          <button
            onClick={runSWN}
            disabled={analyzing || comments.length === 0}
            className={`px-4 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-30 ${
              activeMode === 'swn'
                ? 'border-white/30 text-white bg-white/10'
                : 'border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
            }`}
          >
            {analyzing && activeMode === 'swn' ? 'Analyzing...' : 'SentiWordNet'}
          </button>
        </div>

        {/* VADER Results */}
        {activeMode === 'vader' && vaderAnalysis.length > 0 && (
          <div className="mt-8 space-y-px">
            <div className="grid grid-cols-[1fr_4rem_4rem_4rem_5rem] gap-x-4 px-3 mb-2">
              <span className="text-white/25 text-xs">Comment</span>
              <span className="text-white/25 text-xs text-right">Pos</span>
              <span className="text-white/25 text-xs text-right">Neu</span>
              <span className="text-white/25 text-xs text-right">Neg</span>
              <span className="text-white/25 text-xs text-right">Compound</span>
            </div>
            <div className="border border-white/8 rounded-xl overflow-hidden divide-y divide-white/5">
              {vaderAnalysis.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_4rem_4rem_4rem_5rem] gap-x-4 px-3 py-3 hover:bg-white/4 transition-colors">
                  <p className="text-white/80 text-xs leading-relaxed">{item.comment}</p>
                  <span className="text-white/50 text-xs font-mono text-right self-start pt-0.5">{item.positive.toFixed(3)}</span>
                  <span className="text-white/50 text-xs font-mono text-right self-start pt-0.5">{item.neutral.toFixed(3)}</span>
                  <span className="text-white/50 text-xs font-mono text-right self-start pt-0.5">{item.negative.toFixed(3)}</span>
                  <span className={`text-xs font-mono text-right self-start pt-0.5 ${item.compound > 0 ? 'text-green-400/70' : item.compound < 0 ? 'text-red-400/70' : 'text-white/50'}`}>
                    {item.compound.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SWN Results */}
        {activeMode === 'swn' && swnAnalysis.length > 0 && (
          <div className="mt-8 space-y-px">
            <div className="grid grid-cols-[1fr_4rem_4rem_4rem_5rem] gap-x-4 px-3 mb-2">
              <span className="text-white/25 text-xs">Comment</span>
              <span className="text-white/25 text-xs text-right">Pos</span>
              <span className="text-white/25 text-xs text-right">Neg</span>
              <span className="text-white/25 text-xs text-right">Obj</span>
              <span className="text-white/25 text-xs text-right">Overall</span>
            </div>
            <div className="border border-white/8 rounded-xl overflow-hidden divide-y divide-white/5">
              {swnAnalysis.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_4rem_4rem_4rem_5rem] gap-x-4 px-3 py-3 hover:bg-white/4 transition-colors">
                  <p className="text-white/80 text-xs leading-relaxed">{item.comment}</p>
                  <span className="text-white/50 text-xs font-mono text-right self-start pt-0.5">{(item.positive * 100).toFixed(1)}%</span>
                  <span className="text-white/50 text-xs font-mono text-right self-start pt-0.5">{(item.negative * 100).toFixed(1)}%</span>
                  <span className="text-white/50 text-xs font-mono text-right self-start pt-0.5">{(item.objective * 100).toFixed(1)}%</span>
                  <span className="text-white/70 text-xs text-right self-start pt-0.5">
                    {sentimentLabel(item.positive, item.negative)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}