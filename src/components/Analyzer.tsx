import { useState } from 'react'
import Comment from './Comment'

interface AnalyzerProps {
  URL: string
  comments: string[]
}

interface SentimentResult {
  comment: string
  compound: number
  positive: number
  neutral: number
  negative: number
}

export default function Analyzer({ URL, comments }: AnalyzerProps) {
  const [analysis, setAnalysis] = useState<SentimentResult[]>([])
  const [analyzing, setAnalyzing] = useState(false)

  const onAnalyze = async () => {
    if (comments.length === 0) return

    setAnalyzing(true)

    try {
      const response = await fetch('http://localhost:8000/analyze_comments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze comments')
      }

      const data = await response.json()
      setAnalysis(data.analysis)

    } catch (error) {
      console.error('Error analyzing comments:', error)
    } finally {
      setAnalyzing(false)
    }
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
              <h2 className="text-white/80 text-sm font-medium">
                Comments
              </h2>
              <span className="text-white/60 text-sm">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 max-h-96 overflow-y-auto">
              <ul className="space-y-3">
                {comments.map((comment, index) => (
                  <Comment key={index} text={comment} number={index} />
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
            <p className="text-white/60 text-sm">No comments fetched yet.</p>
          </div>
        )}
      </div>

      <button
        onClick={onAnalyze}
        disabled={analyzing || comments.length === 0}
        className="mt-8 px-6 py-2 rounded-full text-sm font-medium bg-white/20 text-white hover:bg-white/30 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
      >
        {analyzing ? 'Analyzing...' : 'Analyze Comments'}
      </button>

      {analysis.length > 0 && (
        <div className="mt-12 w-full max-w-3xl">
          <h3 className="text-white/80 text-sm font-medium mb-4">
            Sentiment Analysis
          </h3>

          <div className="space-y-4">
            {analysis.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <p className="text-white/90 text-sm mb-3">
                  {item.comment}
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-white/60">
                  <span>👍 {item.positive}</span>
                  <span>😐 {item.neutral}</span>
                  <span>👎 {item.negative}</span>
                  <span>
                    Overall:{' '}
                    <strong
                      className={
                        item.compound > 0
                          ? 'text-green-400'
                          : item.compound < 0
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }
                    >
                      {item.compound}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
