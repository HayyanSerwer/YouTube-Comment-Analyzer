import Search from './Search.tsx';
import Comment from './Comment.tsx';

interface HomeProps {
  URL: string;
  setURL: (url: string) => void;
  comments: string[];
  setComments: (comments: string[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

function Home({ URL, setURL, comments, setComments, loading, setLoading }: HomeProps) {
  const handleURLChange = (url: string) => {
    setURL(url);
    console.log("URL from Search component:", url);
  };

  const extractVideoID = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : '';
  };

  const handleButtonClick = async () => {
    const video_id = extractVideoID(URL);
    console.log("Extracted video_id:", video_id);
    
    if (!video_id) {
      alert("Invalid YouTube URL.");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/comments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_id: video_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.detail || "Failed to fetch comments");
      }

      const data = await response.json();
      setComments(data.comments);
      console.log("Fetched comments:", data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen px-4 pt-20">
      <h1 className="text-white text-4xl mb-8 text-center">Enter YouTube Link</h1>
      <div className="flex flex-row w-full max-w-xl">
        <Search onURLChange={handleURLChange} />
        <button
          className="bg-blue-200 m-2 rounded-md w-32 text-black disabled:opacity-50"
          onClick={handleButtonClick}
          disabled={loading}
        >
          {loading ? "Loading..." : "AI Analyzer"}
        </button>
      </div>
      <div className="mt-8 w-full max-w-xl ">
        {comments.length > 0 ? (
          <ul className="text-white bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            {comments.map((comment, index) => (
              <Comment key={index} text={comment} number={index}/>
            ))} 
          </ul>
        ) : (
          <p className="text-white">No comments fetched yet.</p>
        )}
      </div>
    </div>
  );
}

export default Home;