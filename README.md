# YouTube Comment Analyzer

A full-stack web application that fetches YouTube comments and lets you analyze and search through them using NLP techniques. Built with a FastAPI backend and a React + TypeScript frontend.

---

## Features

### Comment Fetching
Paste any YouTube URL and the app extracts the video ID, hits the YouTube Data API v3, and paginates through up to 100 comments per request to fetch the full comment section.

### Sentiment Analysis (Vader)
Uses NLTK's VADER (Valence Aware Dictionary and sEntiment Reasoner) to score each comment on a compound scale from -1 (most negative) to +1 (most positive), alongside individual positive, neutral, and negative scores. VADER is optimized for short, informal social media text.

### Sentiment Analysis (SentiWordNet)
A transparent, lexicon-based NLP pipeline built from lower-level NLTK primitives:
1. **Preprocessing**:lowercasing, URL/mention/punctuation stripping
2. **Tokenization**: `nltk.word_tokenize`
3. **POS Tagging**: Penn Treebank tags via `nltk.pos_tag`
4. **Lemmatization**: `WordNetLemmatizer` using POS tags for accuracy
5. **Stopword Removal**: NLTK stopword corpus
6. **Scoring**: each token is looked up in SentiWordNet, scores averaged across synsets and aggregated per comment into `positive`, `negative`, and `objective` values

VADER and SentiWordNet results are mutually exclusive in the UI (note that switching analysis modes clears the previous results)

### Hybrid Semantic Search (SBERT + BM25)
Search through comments by meaning rather than just keywords. The pipeline:
- **SBERT** (`all-MiniLM-L6-v2`) encodes comments and the query into sentence-level vector embeddings
- **BM25** (Okapi BM25 via `rank_bm25`) scores lexical term overlap
- Comment embeddings are **cached in memory** after the first search so subsequent queries only re-encode the query string
- Scores are min-max normalized and merged at a **70% semantic / 30% BM25** weighted ratio
- Similarity is computed via brute-force cosine similarity (`np.dot`), returning the top 10 results ranked by hybrid score
- Search is **debounced at 400ms** on the frontend

---

## Tech Stack

**Backend**
- Python, FastAPI
- YouTube Data API v3 (`google-api-python-client`)
- NLTK (VADER, SentiWordNet, tokenization, POS tagging, lemmatization)
- `sentence-transformers` (SBERT)
- `rank_bm25`
- NumPy

**Frontend**
- React + TypeScript (Vite)
- React Router
- Tailwind CSS

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [YouTube Data API v3 key](https://console.cloud.google.com/)

---

### Backend

**1. Clone the repo and navigate to the backend folder**
```bash
git clone https://github.com/your-username/youtube-comment-analyzer.git
cd youtube-comment-analyzer/backend
```

**2. Install dependencies**
```bash
pip install fastapi uvicorn google-api-python-client python-dotenv nltk sentence-transformers rank-bm25 numpy
```

**3. Create a `.env` file**
```
YOUTUBE_API_KEY=your_api_key_here
```

**4. Run the server**
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. On first startup, the SBERT model will download automatically.

---

### Frontend

**1. Navigate to the frontend folder**
```bash
cd ../frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the dev server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/comments/` | Fetch comments for a YouTube video ID |
| `POST` | `/analyze_comments/` | Run VADER sentiment analysis |
| `POST` | `/analyze_sentiwordnet/` | Run SentiWordNet sentiment analysis |
| `POST` | `/search_comments/` | Hybrid semantic search over comments |