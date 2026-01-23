from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_client import get_youtube_client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        print(f"Received video_id: {video_id}")  # Debug print

        if not video_id:
            raise HTTPException(status_code=400, detail="video_id is required")

        youtube = get_youtube_client()
        comments = get_video_comments(youtube, video_id)
        return {"comments": comments}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching comments: {str(e)}")