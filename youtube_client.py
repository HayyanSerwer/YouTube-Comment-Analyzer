import os
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

def get_youtube_client():
    api_key = os.getenv("YOUTUBE_API_KEY")  # Fetch the API key from the .env file
    if not api_key:
        raise ValueError("API key not found. Please set the YOUTUBE_API_KEY environment variable.")
    
    youtube = build("youtube", "v3", developerKey=api_key)
    return youtube


def get_video_comments(youtube, video_id):
    # Use the YouTube API to get comments
    request = youtube.commentThreads().list(
        part="snippet",
        videoId=video_id,
        textFormat="plainText"
    )
    response = request.execute()
    
    comments = []
    for item in response.get("items", []):
        comment = item["snippet"]["topLevelComment"]["snippet"]
        comments.append({
            "author": comment["authorDisplayName"],
            "text": comment["textDisplay"],
            "published_at": comment["publishedAt"]
        })
    
    return comments

