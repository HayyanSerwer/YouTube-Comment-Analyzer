function About() {
  return (
    <div className="flex flex-col items-center pt-24 px-6">
      <div className="max-w-md w-full space-y-8 text-center">

        <div>
          <h1 className="text-white text-2xl font-medium">YouTube Comment Analyzer</h1>
          <p className="text-white/40 text-sm mt-2 leading-relaxed">
            Fetch, analyze, and semantically search YouTube comments using NLP.
          </p>
        </div>

        <div className="text-left space-y-3">
          {[
            ['Comment Fetching', 'YouTube Data API v3'],
            ['Sentiment Analysis', 'VADER + SentiWordNet'],
            ['Semantic Search', 'SBERT + BM25 hybrid (70/30)'],
            ['Backend', 'Python · FastAPI'],
            ['Frontend', 'React · TypeScript · Tailwind'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm border-b border-white/8 pb-3">
              <span className="text-white/40">{label}</span>
              <span className="text-white/70">{value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default About