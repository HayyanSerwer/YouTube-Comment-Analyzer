from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_client import get_youtube_client
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.corpus import sentiwordnet as swn
from nltk.corpus import stopwords, wordnet
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk import pos_tag
import nltk
import re
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from rank_bm25 import BM25Okapi

nltk.download('vader_lexicon')
nltk.download('sentiwordnet')
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('averaged_perceptron_tagger')
nltk.download('averaged_perceptron_tagger_eng')
nltk.download('wordnet')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# YouTube

class CommentRequest(BaseModel):
    video_id: str

def get_video_comments(youtube_client, video_id: str):
    comments = []
    try:
        next_page_token = None
        while True:
            request = youtube_client.commentThreads().list(
                part="snippet",
                videoId=video_id,
                textFormat="plainText",
                maxResults=100,
                pageToken=next_page_token
            )
            response = request.execute()
            for item in response.get("items", []):
                comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
                comments.append(comment)
            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching comments: {str(e)}")
    return comments

@app.get('/')
def printsmth():
    return "hello"

@app.post("/comments/")
async def get_comments(request: CommentRequest):
    try:
        video_id = request.video_id
        if not video_id:
            raise HTTPException(status_code=400, detail="video_id is required")
        youtube = get_youtube_client()
        comments = get_video_comments(youtube, video_id)
        return {"comments": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching comments: {str(e)}")


# VADER

sia = SentimentIntensityAnalyzer()

class AnalyzeRequest(BaseModel):
    comments: list[str]

@app.post("/analyze_comments/")
async def analyze_comments(request: AnalyzeRequest):
    results = []
    for comment in request.comments:
        scores = sia.polarity_scores(comment)
        results.append({
            "comment": comment,
            "compound": scores["compound"],
            "positive": scores["pos"],
            "neutral": scores["neu"],
            "negative": scores["neg"]
        })
    return {"analysis": results}


# SentiWordNet

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def penn_to_wordnet(penn_tag: str) -> str | None:
    if penn_tag.startswith('J'):
        return wordnet.ADJ
    elif penn_tag.startswith('V'):
        return wordnet.VERB
    elif penn_tag.startswith('N'):
        return wordnet.NOUN
    elif penn_tag.startswith('R'):
        return wordnet.ADV
    return None

def preprocess(text: str) -> list[tuple[str, str]]:
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'[^a-z\s]', '', text)
    tokens = word_tokenize(text)
    tagged = pos_tag(tokens)
    result = []
    for word, penn_tag in tagged:
        if word in stop_words or len(word) < 2:
            continue
        wn_tag = penn_to_wordnet(penn_tag)
        if wn_tag:
            lemma = lemmatizer.lemmatize(word, pos=wn_tag)
        else:
            lemma = lemmatizer.lemmatize(word)
            wn_tag = wordnet.NOUN
        result.append((lemma, wn_tag))
    return result

def score_token(lemma: str, pos) -> tuple[float, float, float] | None:
    synsets = list(swn.senti_synsets(lemma, pos))
    if not synsets:
        return None
    pos_score = sum(s.pos_score() for s in synsets) / len(synsets)
    neg_score = sum(s.neg_score() for s in synsets) / len(synsets)
    obj_score = sum(s.obj_score() for s in synsets) / len(synsets)
    return round(pos_score, 4), round(neg_score, 4), round(obj_score, 4)

@app.post("/analyze_sentiwordnet/")
async def analyze_sentiwordnet(request: AnalyzeRequest):
    results = []
    for comment in request.comments:
        tokens = preprocess(comment)
        total_pos = total_neg = total_obj = 0.0
        count = 0
        for lemma, pos in tokens:
            scores = score_token(lemma, pos)
            if scores:
                p, n, o = scores
                total_pos += p
                total_neg += n
                total_obj += o
                count += 1
        if count > 0:
            avg_pos = round(total_pos / count, 4)
            avg_neg = round(total_neg / count, 4)
            avg_obj = round(total_obj / count, 4)
        else:
            avg_pos = avg_neg = 0.0
            avg_obj = 1.0
        results.append({
            "comment": comment,
            "positive": avg_pos,
            "negative": avg_neg,
            "objective": avg_obj,
        })
    return {"analysis": results}


# Hybrid Search algo

# subject to change in the future perhaps
print("Loading SBERT model...")
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
print("SBERT model loaded.")

_search_index: dict = {}

def tokenize_for_bm25(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    return text.split()

def build_index(comments: list[str]) -> dict:
    embeddings = sbert_model.encode(comments, convert_to_numpy=True, show_progress_bar=False)
    tokenized = [tokenize_for_bm25(c) for c in comments]
    bm25 = BM25Okapi(tokenized)
    return {"embeddings": embeddings, "bm25": bm25, "comments": comments}

def min_max_normalize(scores: np.ndarray) -> np.ndarray:
    min_s, max_s = scores.min(), scores.max()
    if max_s - min_s == 0:
        return np.zeros_like(scores)
    return (scores - min_s) / (max_s - min_s)


class SearchRequest(BaseModel):
    query: str
    comments: list[str]
    top_k: int = 10
    semantic_weight: float = 0.7  # BM25 gets the remaining 0.3


@app.post("/search_comments/")
async def search_comments(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if not request.comments:
        raise HTTPException(status_code=400, detail="No comments provided")

    cache_key = hash(tuple(request.comments))
    if cache_key not in _search_index:
        _search_index[cache_key] = build_index(request.comments)

    index = _search_index[cache_key]
    comments = index["comments"]

    # Semantic scores via cosine similarity
    query_embedding = sbert_model.encode([request.query], convert_to_numpy=True)
    semantic_scores = cosine_similarity(query_embedding, index["embeddings"])[0]

    # BM25 lexical scores
    query_tokens = tokenize_for_bm25(request.query)
    bm25_scores = np.array(index["bm25"].get_scores(query_tokens))

    semantic_norm = min_max_normalize(semantic_scores)
    bm25_norm = min_max_normalize(bm25_scores)

    w_s = request.semantic_weight
    w_b = 1.0 - w_s
    hybrid_scores = w_s * semantic_norm + w_b * bm25_norm

    top_k = min(request.top_k, len(comments))
    top_indices = np.argsort(hybrid_scores)[::-1][:top_k]

    results = []
    for rank, idx in enumerate(top_indices):
        results.append({
            "rank": rank + 1,
            "comment": comments[int(idx)],
            "hybrid_score": round(float(hybrid_scores[idx]), 4),
            "semantic_score": round(float(semantic_norm[idx]), 4),
            "bm25_score": round(float(bm25_norm[idx]), 4),
        })

    return {"results": results, "query": request.query}